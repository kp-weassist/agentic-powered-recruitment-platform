import type { NextRequest } from "next/server";
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFJob,
  ExtractPDFResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError,
} from "@adobe/pdfservices-node-sdk";
import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";
import unzipper from "unzipper";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const streamPipeline = promisify(pipeline);

type ParseRequestBody = {
  url?: string; // http(s) URL to PDF
  resumeUrl?: string; // alias for url
  base64?: string; // base64-encoded PDF
};

async function extractTextFromZip(zipPath: string): Promise<{ elements: Array<{ Text: string }> }> {
  return new Promise((resolve, reject) => {
    const extracted: { elements: Array<{ Text: string }> } = { elements: [] };
    fs.createReadStream(zipPath)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: any) => {
        const fileName = entry.path;
        if (fileName.endsWith("structuredData.json")) {
          try {
            const content = await entry.buffer();
            const json = JSON.parse(content.toString());
            extracted.elements = (json.elements || []).filter((el: any) => el.Text && String(el.Text).trim() !== "");
          } catch (e) {
            entry.autodrain();
            reject(e);
          }
        } else {
          entry.autodrain();
        }
      })
      .on("error", reject)
      .on("close", () => resolve(extracted));
  });
}

export async function POST(req: NextRequest) {
  let tempDir = "";
  let inputPath = "";
  let outputPath = "";
  let readStream: fs.ReadStream | null = null;

  try {
    const body = (await req.json()) as ParseRequestBody;
    const url = body.url || body.resumeUrl;

    if (!url && !body.base64) {
      return new Response(JSON.stringify({ error: "Provide 'url' (http/https) or 'base64'" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (url) {
      try {
        const u = new URL(url);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          return new Response(
            JSON.stringify({ error: "Invalid URL protocol. Use http/https or send 'base64'." }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }
      } catch {
        return new Response(JSON.stringify({ error: "Invalid URL" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (!process.env.ADOBE_CLIENT_ID || !process.env.ADOBE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Missing ADOBE_CLIENT_ID / ADOBE_CLIENT_SECRET" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const tempDirName = `pdf-extract-${randomUUID()}-${Date.now()}`;
    tempDir = path.join(process.cwd(), tempDirName);
    inputPath = path.join(tempDir, "input.pdf");
    outputPath = path.join(tempDir, "output.zip");

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    if (body.base64) {
      const buffer = Buffer.from(body.base64, "base64");
      fs.writeFileSync(inputPath, buffer);
    } else if (url) {
      const response = await axios({ method: "GET", url, responseType: "stream" });
      await streamPipeline(response.data, fs.createWriteStream(inputPath));
    }

    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.ADOBE_CLIENT_ID as string,
      clientSecret: process.env.ADOBE_CLIENT_SECRET as string,
    });
    const pdfServices = new PDFServices({ credentials });

    readStream = fs.createReadStream(inputPath);
    const inputAsset = await pdfServices.upload({ readStream, mimeType: MimeType.PDF });

    const params = new ExtractPDFParams({ elementsToExtract: [ExtractElementType.TEXT] });
    const job = new ExtractPDFJob({ inputAsset, params });
    const pollingURL = await pdfServices.submit({ job });

    const pdfServicesResponse = await pdfServices.getJobResult({ pollingURL, resultType: ExtractPDFResult });
    if (!pdfServicesResponse?.result?.resource) {
      return new Response(JSON.stringify({ error: "No result resource from Adobe PDF Services" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const resultAsset = pdfServicesResponse.result.resource;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      streamAsset.readStream.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    const extractedContent: any = await extractTextFromZip(outputPath);
    if (!extractedContent?.elements || extractedContent.elements.length === 0) {
      return new Response(JSON.stringify({ error: "No text elements found in the PDF" }), {
        status: 422,
        headers: { "content-type": "application/json" },
      });
    }

    const fullText = extractedContent.elements
      .map((el: any) => el.Text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return new Response(JSON.stringify({ text: fullText }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error: unknown) {
    let message = error instanceof Error ? error.message : "Unknown error";
    if (
      error instanceof (SDKError as any) ||
      error instanceof (ServiceUsageError as any) ||
      error instanceof (ServiceApiError as any)
    ) {
      message = `Adobe PDF Services error: ${message}`;
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  } finally {
    try {
      if (readStream) readStream.destroy();
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (tempDir && fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}



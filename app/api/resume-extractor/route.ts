import type { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ResumeSchema = z.object({
  full_name: z.string().optional().nullable(),
  resume_url: z.string().url().optional().nullable(),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        position: z.string().default(""),
        start_date: z.string().default(""),
        end_date: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(""),
        degree: z.string().default(""),
        field: z.string().default(""),
        graduation_date: z.string().default(""),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        project_name: z.string().default(""),
        description: z.string().optional().nullable(),
        project_link: z.string().optional().nullable(),
        github_link: z.string().optional().nullable(),
        start_date: z.string().optional().nullable(),
        end_date: z.string().optional().nullable(),
      }),
    )
    .default([]),
  location: z.string().optional().nullable(),
  desired_salary: z.number().optional().nullable(),
});

type ExtractRequestBody = {
  text: string;
  resumeUrl?: string | null;
};

const SYSTEM_PROMPT = `You are an expert resume parser. Extract a structured candidate profile from the provided resume text.
- Keep descriptions concise, under 120 words each.
- Make sure descriptions are writtem in rich text format.
- Use bullet points in descriptions using <ul> and <li> tags.
- Use ISO date format (YYYY-MM-DD) when specific, otherwise leave empty.
- If a field is missing, omit it or set it to null/empty string appropriately.
- For skills, return a deduplicated list of short skill names.
Return ONLY JSON that conforms to the provided JSON schema.

JSON Schema (strict):
{
  "type": "object",
  "properties": {
    "full_name": { "type": ["string", "null"] },
    "resume_url": { "type": ["string", "null"], "format": "uri" },
    "skills": { "type": "array", "items": { "type": "string" } },
    "experience": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "company": { "type": "string" },
          "position": { "type": "string" },
          "start_date": { "type": "string" },
          "end_date": { "type": ["string", "null"] },
          "description": { "type": ["string", "null"] }
        },
        "required": ["company", "position", "start_date"],
        "additionalProperties": false
      }
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "institution": { "type": "string" },
          "degree": { "type": "string" },
          "field": { "type": "string" },
          "graduation_date": { "type": "string" }
        },
        "required": ["institution", "degree", "field", "graduation_date"],
        "additionalProperties": false
      }
    },
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "project_name": { "type": "string" },
          "description": { "type": ["string", "null"] },
          "project_link": { "type": ["string", "null"], "format": "uri" },
          "github_link": { "type": ["string", "null"], "format": "uri" },
          "start_date": { "type": ["string", "null"] },
          "end_date": { "type": ["string", "null"] }
        },
        "required": ["project_name"],
        "additionalProperties": false
      }
    },
    "location": { "type": ["string", "null"] },
    "desired_salary": { "type": ["number", "null"] }
  },
  "required": [],
  "additionalProperties": false
}`;



export async function POST(req: NextRequest) {
  try {
    const { text, resumeUrl } = (await req.json()) as ExtractRequestBody;
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "'text' is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    console.log(text);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!openai.apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const trimmed = text.length > 200_000 ? text.slice(0, 200_000) : text;

    // Use structured output with Zod schema
    const response = await openai.responses.parse({
      model: "gpt-4.1",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Resume Text:\n\n${trimmed}`,
        },
      ],
      temperature: 0.1,
    });
    console.log("response", response);

    const anyResp = response as any;
    let parsed: unknown = anyResp.output_parsed ?? null;
    if (!parsed && typeof anyResp.output_text === "string") {
      try {
        parsed = JSON.parse(anyResp.output_text);
      } catch {
        parsed = {};
      }
    }

    const validated = ResumeSchema.safeParse(parsed ?? {});
    const base = { skills: [], experience: [], education: [], projects: [] };
    const result = {
      ...base,
      ...(validated.success ? validated.data : {}),
      resume_url: (parsed as any)?.resume_url ?? resumeUrl ?? null,
    } as z.infer<typeof ResumeSchema> & { resume_url: string | null };
console.log("result", result);
    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}



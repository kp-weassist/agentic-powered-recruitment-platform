import type { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  resumeId: z.string().uuid().optional(),
  text: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  force: z.boolean().optional().default(false),
});

// Strict structured output for ATS analysis
const AtsResultSchema = z.object({
  ats_compatibility_score: z.number().min(0).max(100),
  summary: z.string(),
  prioritized_actions: z
    .array(
      z.object({
        impact: z.enum(["high", "medium", "low"]),
        description: z.string(),
      }),
    )
    .default([]),
  keyword_matching: z.object({
    inferred_role: z.string(),
    matched_keywords: z.array(z.string()).default([]),
    missing_keywords: z.array(z.string()).default([]),
    match_score: z.number().min(0).max(100),
  }),
  format_suggestions: z.array(z.string()).default([]),
  section_structure: z.object({
    sections_present: z.array(z.string()).default([]),
    missing_sections: z.array(z.string()).default([]),
    recommendations: z.array(z.string()).default([]),
  }),
  formatting_guides: z.array(z.string()).default([]),
  readability_score: z.number().min(0).max(100),
  action_verbs_score: z.number().min(0).max(100),
  quantifiable_achievements: z.object({ count: z.number().int().min(0), examples: z.array(z.string()).default([]) }),
  length_appropriateness: z.string(),
  ats_red_flags: z.array(z.string()).default([]),
  file_parse_risks: z.array(z.string()).default([]),
  contact_info_check: z.object({
    has_email: z.boolean(),
    has_phone: z.boolean(),
    has_linkedin: z.boolean(),
    issues: z.array(z.string()).default([]),
  }),
  links_accessibility: z.object({
    urls: z.array(z.string()).default([]),
    are_urls_plain_text: z.boolean(),
    issues: z.array(z.string()).default([]),
  }),
  tables_graphics_usage: z.object({
    has_tables: z.boolean(),
    has_images: z.boolean(),
    risks: z.array(z.string()).default([]),
  }),
});

const SYSTEM_PROMPT = `You are an expert ATS evaluator. Analyze the provided resume content and produce an unbiased ATS optimization report.
- Output MUST be strict JSON matching the provided schema. Do not include extra fields or commentary.
- Score on a 0–100 scale where 100 is excellent ATS compatibility.
- Provide actionable, concise recommendations.
- Ingore the symbols (e.g., ) because it might happen because of our pdf parser.
- Keep in mind that Candidate has upload thier pdf resume and we have parsed it into text and you are analyzing it.So there might be some extra text in the resume that is not part of the resume.
- Assume no specific job description is provided: infer a primary role/domain from the resume itself and evaluate keyword coverage for that role.

JSON Schema (strict):
{
  "type": "object",
  "properties": {
    "ats_compatibility_score": {"type": "number", "minimum": 0, "maximum": 100},
    "summary": {"type": "string"},
    "prioritized_actions": {
      "type": "array",
      "items": {"type": "object", "properties": {"impact": {"type": "string", "enum": ["high", "medium", "low"]}, "description": {"type": "string"}}, "required": ["impact", "description"], "additionalProperties": false}
    },
    "keyword_matching": {"type": "object", "properties": {"inferred_role": {"type": "string"}, "matched_keywords": {"type": "array", "items": {"type": "string"}}, "missing_keywords": {"type": "array", "items": {"type": "string"}}, "match_score": {"type": "number", "minimum": 0, "maximum": 100}}, "required": ["inferred_role", "matched_keywords", "missing_keywords", "match_score"], "additionalProperties": false},
    "format_suggestions": {"type": "array", "items": {"type": "string"}},
    "section_structure": {"type": "object", "properties": {"sections_present": {"type": "array", "items": {"type": "string"}}, "missing_sections": {"type": "array", "items": {"type": "string"}}, "recommendations": {"type": "array", "items": {"type": "string"}}}, "required": ["sections_present", "missing_sections", "recommendations"], "additionalProperties": false},
    "formatting_guides": {"type": "array", "items": {"type": "string"}},
    "readability_score": {"type": "number", "minimum": 0, "maximum": 100},
    "action_verbs_score": {"type": "number", "minimum": 0, "maximum": 100},
    "quantifiable_achievements": {"type": "object", "properties": {"count": {"type": "number"}, "examples": {"type": "array", "items": {"type": "string"}}}, "required": ["count", "examples"], "additionalProperties": false},
    "length_appropriateness": {"type": "string"},
    "ats_red_flags": {"type": "array", "items": {"type": "string"}},
    "file_parse_risks": {"type": "array", "items": {"type": "string"}},
    "contact_info_check": {"type": "object", "properties": {"has_email": {"type": "boolean"}, "has_phone": {"type": "boolean"}, "has_linkedin": {"type": "boolean"}, "issues": {"type": "array", "items": {"type": "string"}}}, "required": ["has_email", "has_phone", "has_linkedin", "issues"], "additionalProperties": false},
    "links_accessibility": {"type": "object", "properties": {"urls": {"type": "array", "items": {"type": "string"}}, "are_urls_plain_text": {"type": "boolean"}, "issues": {"type": "array", "items": {"type": "string"}}}, "required": ["urls", "are_urls_plain_text", "issues"], "additionalProperties": false},
    "tables_graphics_usage": {"type": "object", "properties": {"has_tables": {"type": "boolean"}, "has_images": {"type": "boolean"}, "risks": {"type": "array", "items": {"type": "string"}}}, "required": ["has_tables", "has_images", "risks"], "additionalProperties": false}
  },
  "required": [
    "ats_compatibility_score","summary","prioritized_actions","keyword_matching","format_suggestions","section_structure","formatting_guides","readability_score","action_verbs_score","quantifiable_achievements","length_appropriateness","ats_red_flags","file_parse_risks","contact_info_check","links_accessibility","tables_graphics_usage"
  ],
  "additionalProperties": false
}

Return only valid JSON.`;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resumeId, text, resumeUrl, force } = RequestSchema.parse(json);

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    let resumeRow: any = null;
    if (resumeId) {
      const { data: resume, error: fetchErr } = await supabase
        .from("resumes")
        .select("id,file_url,resume_content,ats_optimization_checker_results")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();
      if (fetchErr) throw fetchErr;
      if (!resume) {
        return new Response(JSON.stringify({ error: "Resume not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      resumeRow = resume;

      if (!force && (resume as any).ats_optimization_checker_results && !text) {
        return new Response(
          JSON.stringify({ data: (resume as any).ats_optimization_checker_results, cached: true }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
    }

    let resumeText: string | null = (text ?? (resumeRow?.resume_content as string | null) ?? null);
    if (!resumeText || resumeText.trim().length < 50) {
      const urlToUse = resumeUrl ?? (resumeRow?.file_url as string | undefined);
      if (!urlToUse) {
        return new Response(JSON.stringify({ error: "No resume content or URL provided" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      // Parse PDF via internal API
      const origin = new URL(req.url).origin;
      const parseResp = await fetch(`${origin}/api/pdf-parser`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: urlToUse }),
      });
      let parsed: any = null;
      if (parseResp.headers.get("content-type")?.includes("application/json")) {
        parsed = await parseResp.json().catch(() => null);
      } else {
        const t = await parseResp.text().catch(() => "");
        try {
          parsed = JSON.parse(t);
        } catch {
          parsed = null;
        }
      }
      if (!parseResp.ok || !parsed?.text) {
        return new Response(JSON.stringify({ error: parsed?.error || "Failed to parse PDF" }), {
          status: 502,
          headers: { "content-type": "application/json" },
        });
      }
      resumeText = String(parsed.text || "").trim();
      if (resumeId && resumeText) {
        const { error: updateParseErr } = await supabase
          .from("resumes")
          .update({ resume_content: resumeText })
          .eq("id", resumeId)
          .eq("user_id", user.id);
        if (updateParseErr) throw updateParseErr;
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!openai.apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const trimmed = (resumeText || "").slice(0, 200_000);

    // Prefer structured output using zod schema
    const aiResponse = await openai.responses.parse({
      model: "gpt-4.1",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Resume Content (plain text):\n\n${trimmed}` },
      ],
      temperature: 0.2,
    });

    const anyResp = aiResponse as any;
    let parsedResult: unknown = anyResp.output_parsed ?? null;
    if (!parsedResult && typeof anyResp.output_text === "string") {
      try {
        parsedResult = JSON.parse(anyResp.output_text);
      } catch {
        parsedResult = {};
      }
    }

    const validated = AtsResultSchema.safeParse(parsedResult ?? {});
    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: "Model returned invalid schema", details: validated.error.flatten() }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const result = validated.data;

    if (resumeId) {
      const { error: saveErr } = await supabase
        .from("resumes")
        .update({ ats_optimization_checker_results: result })
        .eq("id", resumeId)
        .eq("user_id", user.id);
      if (saveErr) throw saveErr;
    }

    return new Response(JSON.stringify({ data: result, cached: false }), {
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



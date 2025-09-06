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
  jd: z.string().min(20, "Job description is too short"),
  force: z.boolean().optional().default(false),
});

const AnalysisResultSchema = z.object({
  overall_match_score: z.number().min(0).max(100),
  role_inferred: z.string(),
  summary: z.string(),
  keyword_matching: z.object({
    matched_keywords: z.array(z.string()).default([]),
    missing_keywords: z.array(z.string()).default([]),
    match_score: z.number().min(0).max(100),
  }),
  experience_alignment: z.object({
    strengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    years_of_experience_estimate: z.number().min(0).max(60).optional(),
  }),
  responsibilities_alignment: z.object({
    satisfied_requirements: z.array(z.string()).default([]),
    partially_satisfied: z.array(z.string()).default([]),
    missing_requirements: z.array(z.string()).default([]),
  }),
  education_cert_alignment: z.object({
    meets_requirements: z.boolean(),
    missing_certifications: z.array(z.string()).default([]),
    recommended_certifications: z.array(z.string()).default([]),
  }),
  resume_improvements: z.array(z.string()).default([]),
  tailored_bullet_suggestions: z.array(z.string()).default([]),
  recommended_keywords_to_add: z.array(z.string()).default([]),
  ats_considerations: z.array(z.string()).default([]),
  interview_preparation: z.object({
    technical_questions: z.array(z.string()).default([]),
    behavioral_questions: z.array(z.string()).default([]),
    domain_questions: z.array(z.string()).default([]),
    estimated_seniority: z.string(),
  }),
  risk_flags: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
});

const SYSTEM_PROMPT = `You are an expert career coach and ATS evaluator. Compare a candidate's resume to a provided job description.
- Output MUST be strict JSON matching the provided schema. Do not include extra fields or commentary.
- Score on a 0–100 scale where 100 is an excellent match.
- Be concise, specific, and actionable.
- Ignore odd PDF parsing artifacts (e.g., special symbols) and boilerplate.
- Focus on relevance to the JD: skills, responsibilities, impact, and seniority expectations.

JSON Schema (strict):
{
  "type": "object",
  "properties": {
    "overall_match_score": {"type": "number", "minimum": 0, "maximum": 100},
    "role_inferred": {"type": "string"},
    "summary": {"type": "string"},
    "keyword_matching": {"type": "object", "properties": {"matched_keywords": {"type": "array", "items": {"type": "string"}}, "missing_keywords": {"type": "array", "items": {"type": "string"}}, "match_score": {"type": "number", "minimum": 0, "maximum": 100}}, "required": ["matched_keywords", "missing_keywords", "match_score"], "additionalProperties": false},
    "experience_alignment": {"type": "object", "properties": {"strengths": {"type": "array", "items": {"type": "string"}}, "gaps": {"type": "array", "items": {"type": "string"}}, "years_of_experience_estimate": {"type": "number"}}, "required": ["strengths", "gaps"], "additionalProperties": false},
    "responsibilities_alignment": {"type": "object", "properties": {"satisfied_requirements": {"type": "array", "items": {"type": "string"}}, "partially_satisfied": {"type": "array", "items": {"type": "string"}}, "missing_requirements": {"type": "array", "items": {"type": "string"}}}, "required": ["satisfied_requirements", "partially_satisfied", "missing_requirements"], "additionalProperties": false},
    "education_cert_alignment": {"type": "object", "properties": {"meets_requirements": {"type": "boolean"}, "missing_certifications": {"type": "array", "items": {"type": "string"}}, "recommended_certifications": {"type": "array", "items": {"type": "string"}}}, "required": ["meets_requirements", "missing_certifications", "recommended_certifications"], "additionalProperties": false},
    "resume_improvements": {"type": "array", "items": {"type": "string"}},
    "tailored_bullet_suggestions": {"type": "array", "items": {"type": "string"}},
    "recommended_keywords_to_add": {"type": "array", "items": {"type": "string"}},
    "ats_considerations": {"type": "array", "items": {"type": "string"}},
    "interview_preparation": {"type": "object", "properties": {"technical_questions": {"type": "array", "items": {"type": "string"}}, "behavioral_questions": {"type": "array", "items": {"type": "string"}}, "domain_questions": {"type": "array", "items": {"type": "string"}}, "estimated_seniority": {"type": "string"}}, "required": ["technical_questions", "behavioral_questions", "domain_questions", "estimated_seniority"], "additionalProperties": false},
    "risk_flags": {"type": "array", "items": {"type": "string"}},
    "next_steps": {"type": "array", "items": {"type": "string"}}
  },
  "required": [
    "overall_match_score","role_inferred","summary","keyword_matching","experience_alignment","responsibilities_alignment","education_cert_alignment","resume_improvements","tailored_bullet_suggestions","recommended_keywords_to_add","ats_considerations","interview_preparation","risk_flags","next_steps"
  ],
  "additionalProperties": false
}

Return only valid JSON.`;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resumeId, text, resumeUrl, jd, force } = RequestSchema.parse(json);

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
        .select("id,file_url,resume_content")
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

    const trimmedResume = (resumeText || "").slice(0, 200_000);
    const trimmedJD = (jd || "").slice(0, 50_000);

    const aiResponse = await openai.responses.parse({
      model: "gpt-4.1",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Job Description (JD)\n\n${trimmedJD}` },
        { role: "user", content: `Resume (plain text)\n\n${trimmedResume}` },
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

    const validated = AnalysisResultSchema.safeParse(parsedResult ?? {});
    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: "Model returned invalid schema", details: validated.error.flatten() }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const result = validated.data;

    // Persist analysis history
    const { data: inserted, error: insertErr } = await supabase
      .from("resume_jd_analysis_history")
      .insert({
        user_id: user.id,
        resume_id: resumeId ?? null,
        jd,
        analysis: result,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ data: result, history_id: inserted?.id }), {
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



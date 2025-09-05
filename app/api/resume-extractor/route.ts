import type { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ResumeSchema = z.object({
  full_name: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  resume_url: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        position: z.string().default(""),
        location: z.string().optional().nullable(),
        start_date: z.string().default(""),
        end_date: z.string().optional().nullable(),
        is_current: z.boolean().optional().nullable(),
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
        location: z.string().optional().nullable(),
        start_date: z.string().optional().nullable(),
        graduation_date: z.string().default(""),
        gpa: z.string().optional().nullable(),
        gpa_scale: z.string().optional().nullable(),
        gpa_type: z.enum(["gpa", "percentage"]).optional().nullable(),
        coursework: z.string().optional().nullable(),
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
        date: z.string().optional().nullable(),
      }),
    )
    .default([]),
  activities: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().optional().nullable(),
        date: z.string().optional().nullable(),
      }),
    )
    .default([]),
  location: z.string().optional().nullable(),
  volunteer_experience: z.string().optional().nullable(),
  interests_hobbies: z.string().optional().nullable(),
  desired_salary: z.number().optional().nullable(),
});

type ExtractRequestBody = {
  text: string;
  resumeUrl?: string | null;
};

const SYSTEM_PROMPT = `You are an expert resume parser. Extract a structured candidate profile from the provided resume text.
- Keep descriptions concise, under 120 words each.
- Make sure descriptions are written in rich text format.
- Use bullet points in descriptions using <ul> and <li> tags where appropriate.
- Extract professional summary/objective if present.
- Use ISO date format (YYYY-MM-DD) when specific, otherwise leave empty.
- If a field is missing, omit it or set it to null/empty string appropriately.
- For skills, languages, and certifications, return deduplicated lists of short names.
- Extract GPA and coursework information if mentioned in education.
- Include location information for experience and education entries when available.
- Extract any volunteer experience or interests/hobbies if mentioned.
- Look for activities, clubs, or organizations the candidate has participated in.
- For experience: Set is_current to true if the position shows "Present" or "Current" as end date.
- For education: Include both start_date and graduation_date when available. Detect if GPA is percentage-based (e.g., "85%") and set gpa_type accordingly.
- For projects: Extract any project URLs, GitHub links, or demo links. Look for dates or time periods.
Return ONLY JSON that conforms to the provided JSON schema.

JSON Schema (strict):
{
  "type": "object",
  "properties": {
    "full_name": { "type": ["string", "null"] },
    "summary": { "type": ["string", "null"], "description": "Professional summary or objective in HTML format" },
    "resume_url": { "type": ["string", "null"], "format": "uri" },
    "email": { "type": ["string", "null"], "format": "email" },
    "phone": { "type": ["string", "null"] },
    "linkedin": { "type": ["string", "null"] },
    "skills": { "type": "array", "items": { "type": "string" } },
    "languages": { "type": "array", "items": { "type": "string" }, "description": "Spoken/written languages with proficiency level if mentioned" },
    "certifications": { "type": "array", "items": { "type": "string" }, "description": "Professional certifications, licenses, or credentials" },
    "experience": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "company": { "type": "string" },
          "position": { "type": "string" },
          "location": { "type": ["string", "null"] },
          "start_date": { "type": "string" },
          "end_date": { "type": ["string", "null"] },
          "is_current": { "type": ["boolean", "null"], "description": "Whether currently working at this position" },
          "description": { "type": ["string", "null"], "description": "HTML formatted description with bullet points" }
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
          "location": { "type": ["string", "null"] },
          "start_date": { "type": ["string", "null"] },
          "graduation_date": { "type": "string" },
          "gpa": { "type": ["string", "null"] },
          "gpa_scale": { "type": ["string", "null"] },
          "gpa_type": { "type": ["string", "null"], "enum": ["gpa", "percentage"], "description": "Type of GPA: 'gpa' for scale-based or 'percentage' for percentage-based" },
          "coursework": { "type": ["string", "null"], "description": "Relevant coursework in HTML format" }
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
          "description": { "type": ["string", "null"], "description": "HTML formatted description" },
          "project_link": { "type": ["string", "null"], "format": "uri" },
          "github_link": { "type": ["string", "null"], "format": "uri" },
          "start_date": { "type": ["string", "null"] },
          "end_date": { "type": ["string", "null"] },
          "date": { "type": ["string", "null"], "description": "Single date field for project completion" }
        },
        "required": ["project_name"],
        "additionalProperties": false
      }
    },
    "activities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": ["string", "null"], "description": "HTML formatted description" },
          "date": { "type": ["string", "null"] }
        },
        "required": ["name"],
        "additionalProperties": false
      }
    },
    "location": { "type": ["string", "null"] },
    "volunteer_experience": { "type": ["string", "null"], "description": "Volunteer work and community service" },
    "interests_hobbies": { "type": ["string", "null"], "description": "Personal interests, hobbies, or extracurricular activities" },
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

    // Use structured output with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Resume Text:\n\n${trimmed}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    
    console.log("response", completion);
    
    let parsed: unknown = null;
    const responseText = completion.choices[0]?.message?.content;
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        parsed = {};
      }
    }

    const validated = ResumeSchema.safeParse(parsed ?? {});
    const base = { 
      skills: [], 
      languages: [],
      certifications: [],
      experience: [], 
      education: [], 
      projects: [],
      activities: []
    };
    
    const result = {
      ...base,
      ...(validated.success ? validated.data : {}),
      resume_url: (parsed as any)?.resume_url ?? resumeUrl ?? null,
    } as any;
    
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
import type { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Question schemas
const MCQSchema = z.object({
  question_type: z.literal("multiple_choice"),
  question: z.string(),
  options: z.array(z.string()).min(2),
  // zero-based indices of correct options (support multiple correct)
  correct_options: z.array(z.number().int()).min(1),
  max_score: z.number().min(1).default(1),
  metadata: z.record(z.any()).optional(),
});

const CodingSchema = z.object({
  question_type: z.literal("coding"),
  question: z.string(),
  language: z.string().default("javascript"),
  starter_code: z.string().optional().default(""),
  max_score: z.number().min(1).default(10),
  rubric: z
    .object({
      criteria: z.array(z.string()).default([]),
      key_points: z.array(z.string()).default([]),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

const ScenarioSchema = z.object({
  question_type: z.literal("scenario"),
  question: z.string(),
  max_score: z.number().min(1).default(5),
  rubric: z
    .object({
      criteria: z.array(z.string()).default([]),
      key_points: z.array(z.string()).default([]),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

const QuestionSchema = z.discriminatedUnion("question_type", [MCQSchema, CodingSchema, ScenarioSchema]).and(
  z.object({
    question_index: z.number().int().nonnegative().optional(),
  })
);

const GeneratedAssessmentSchema = z.object({
  title: z.string(),
  time_limit_seconds: z.number().min(300).max(7200),
  questions: z.array(QuestionSchema).min(5),
});

const GenerateRequestSchema = z.object({
  resumeId: z.string().uuid().optional(),
  jd: z.string().min(20),
  templateNames: z.array(z.string()).optional(),
});

const GradeAnswerSchema = z.object({
  question_id: z.string().uuid(),
  question_type: z.enum(["multiple_choice", "coding", "scenario"]),
  answer: z.any(),
});

const GradeRequestSchema = z.object({
  assessmentId: z.string().uuid(),
  attemptId: z.string().uuid().optional(),
  answers: z.array(GradeAnswerSchema),
  timeRemainingSeconds: z.number().int().optional(),
});

const SYSTEM_PROMPT_GENERATE = `You are an expert assessment author. Create a concise, fair assessment tailored to the candidate's resume and the provided job description.
- Output MUST be valid JSON matching the given schema. No commentary.
- Include multiple question types: multiple_choice, coding, scenario.
- For multiple_choice, provide 3–6 options and one or more correct option indices (0-based).
- For coding, include language (e.g., "javascript", "python"), starter_code when useful, and a short rubric with key points.
- For scenario, provide a short rubric focusing on soft skills.
- Keep questions clear and unambiguous; avoid trick questions.
- Time limit should be realistic for the total difficulty.
- Prefer skills relevant to the JD and resume.

Example output JSON (illustrative only):
{
  "title": "Full-Stack Web Assessment",
  "time_limit_seconds": 1800,
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "Which statements about HTTP are true?",
      "options": ["Stateless", "Requires cookies", "Supports methods like GET/POST", "Encrypted by default"],
      "correct_options": [0, 2],
      "max_score": 1
    },
    {
      "question_type": "coding",
      "question": "Write a function to deduplicate an array while preserving order.",
      "language": "javascript",
      "starter_code": "function unique(arr) {\n  // TODO: implement\n}\n",
      "max_score": 10,
      "rubric": {"criteria": ["Correctness", "Time complexity"], "key_points": ["Use Set or seen map", "O(n)"]}
    },
    {
      "question_type": "scenario",
      "question": "A teammate frequently misses standups. How do you address it?",
      "max_score": 5,
      "rubric": {"criteria": ["Empathy", "Actionability"], "key_points": ["Private conversation", "Offer support", "Escalate if needed"]}
    }
  ]
}`;

const SYSTEM_PROMPT_GRADE = `You are a strict, unbiased grader.
Score responses according to the rubric and max_score. Return ONLY JSON.

For multiple_choice double-checks, return:
{
  "is_correct": true,
  "explanation": "...brief rationale..."
}

For coding/scenario grading, return:
{
  "score": 8,
  "feedback": "...specific, concise feedback tied to rubric..."
}`;

const SYSTEM_PROMPT_RESULT = `You are an assessment reporting engine. Based on per-question scores and metadata, produce a concise result report. Return ONLY JSON that matches the schema below. Be specific and actionable.

JSON Schema (strict):
{
  "type": "object",
  "properties": {
    "overall": {"type": "object", "properties": {"score": {"type": "number"}, "max_score": {"type": "number"}, "percentage": {"type": "number"}}, "required": ["score", "max_score", "percentage"], "additionalProperties": false},
    "sections": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string"}, "score": {"type": "number"}, "max_score": {"type": "number"}, "strengths": {"type": "array", "items": {"type": "string"}}, "improvements": {"type": "array", "items": {"type": "string"}}}, "required": ["name", "score", "max_score", "strengths", "improvements"], "additionalProperties": false}},
    "summary": {"type": "string"},
    "recommendations": {"type": "array", "items": {"type": "string"}},
    "question_feedback": {"type": "array", "items": {"type": "object", "properties": {"index": {"type": "number"}, "type": {"type": "string"}, "comment": {"type": "string"}}, "required": ["index", "type", "comment"], "additionalProperties": false}}
  },
  "required": ["overall", "sections", "summary", "recommendations", "question_feedback"],
  "additionalProperties": false
}

Example output JSON (illustrative only):
{
  "overall": {"score": 14, "max_score": 20, "percentage": 70},
  "sections": [
    {"name": "Technical", "score": 10, "max_score": 15, "strengths": ["Solid JS fundamentals"], "improvements": ["Edge-case handling in code"]},
    {"name": "Soft Skills", "score": 4, "max_score": 5, "strengths": ["Collaborative communication"], "improvements": ["Proactive risk communication"]}
  ],
  "summary": "Overall strong match with opportunities to harden coding solutions.",
  "recommendations": ["Practice DSA warm-ups", "Review error handling patterns"],
  "question_feedback": [{"index": 2, "type": "coding", "comment": "Logic correct; consider O(n) approach and tests."}]
}`;

export async function POST(req: NextRequest) {
  // Create a new assessment from resume + JD
  try {
    const { resumeId, jd, templateNames } = GenerateRequestSchema.parse(await req.json());

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
    }

    // Load resume content if available
    let resumeRow: any = null;
    if (resumeId) {
      const { data, error } = await supabase
        .from("resumes")
        .select("id,file_url,resume_content")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      resumeRow = data;
    }

    let resumeText: string | null = (resumeRow?.resume_content as string | null) ?? null;
    if (!resumeText || resumeText.trim().length < 50) {
      const urlToUse = resumeRow?.file_url as string | undefined;
      if (urlToUse) {
        const origin = new URL(req.url).origin;
        const parseResp = await fetch(`${origin}/api/pdf-parser`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: urlToUse }),
        });
        const parsed = (await parseResp.json().catch(() => null)) as any;
        if (parseResp.ok && parsed?.text) {
          resumeText = String(parsed.text || "").trim();
          if (resumeId && resumeText) {
            await supabase.from("resumes").update({ resume_content: resumeText }).eq("id", resumeId).eq("user_id", user.id);
          }
        }
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!openai.apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: { "content-type": "application/json" } });
    }

    const trimmedResume = (resumeText || "").slice(0, 200_000);
    const trimmedJD = (jd || "").slice(0, 50_000);
    const templateHint = (templateNames && templateNames.length > 0)
      ? `Focus on these skills: ${templateNames.join(", ")}.`
      : "Include a balanced mix of technical (5) and soft-skill (5) topics.";

    const aiResp = await openai.responses.parse({
      model: "gpt-4.1",
      input: [
        { role: "system", content: SYSTEM_PROMPT_GENERATE },
        { role: "user", content: `Job Description (JD)\n\n${trimmedJD}` },
        { role: "user", content: `Resume (plain text)\n\n${trimmedResume}` },
        {
          role: "user",
          content: `Constraints: ${templateHint}\n\nJSON Schema (strict): {"type":"object","properties":{"title":{"type":"string"},"time_limit_seconds":{"type":"number","minimum":300,"maximum":7200},"questions":{"type":"array","minItems":5,"items":{"oneOf":[{"type":"object","properties":{"question_type":{"const":"multiple_choice"},"question":{"type":"string"},"options":{"type":"array","items":{"type":"string"},"minItems":2},"correct_options":{"type":"array","items":{"type":"number"},"minItems":1},"max_score":{"type":"number","minimum":1}},"required":["question_type","question","options","correct_options"],"additionalProperties":true},{"type":"object","properties":{"question_type":{"const":"coding"},"question":{"type":"string"},"language":{"type":"string"},"starter_code":{"type":"string"},"max_score":{"type":"number","minimum":1},"rubric":{"type":"object","properties":{"criteria":{"type":"array","items":{"type":"string"}},"key_points":{"type":"array","items":{"type":"string"}}},"additionalProperties":false}},"required":["question_type","question"],"additionalProperties":true},{"type":"object","properties":{"question_type":{"const":"scenario"},"question":{"type":"string"},"max_score":{"type":"number","minimum":1},"rubric":{"type":"object","properties":{"criteria":{"type":"array","items":{"type":"string"}},"key_points":{"type":"array","items":{"type":"string"}}},"additionalProperties":false}},"required":["question_type","question"],"additionalProperties":true}]}}},"required":["title","time_limit_seconds","questions"],"additionalProperties":false}`,
        },
      ],
      temperature: 0.2,
    });

    const anyGen: any = aiResp;
    let parsed: unknown = anyGen.output_parsed ?? null;
    if (!parsed && typeof anyGen.output_text === "string") {
      try {
        parsed = JSON.parse(anyGen.output_text);
      } catch {
        parsed = {};
      }
    }
    const validated = GeneratedAssessmentSchema.safeParse(parsed ?? {});
    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: "Model returned invalid schema", details: validated.error.flatten() }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
    const assessment = validated.data;

    // Persist assessment
    const { data: inserted, error: assessErr } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        resume_id: resumeId ?? null,
        jd,
        title: assessment.title,
        category: "composite",
        total_questions: assessment.questions.length,
        time_limit_seconds: assessment.time_limit_seconds,
      })
      .select("id")
      .single();
    if (assessErr) throw assessErr;
    const assessmentId = inserted!.id as string;

    // Insert questions
    const rows = assessment.questions.map((q, idx) => ({
      assessment_id: assessmentId,
      question_index: idx,
      question_type: q.question_type,
      question: q.question,
      options: (q as any).options ?? null,
      correct_options: (q as any).correct_options ?? null,
      language: (q as any).language ?? null,
      starter_code: (q as any).starter_code ?? null,
      max_score: (q as any).max_score ?? (q.question_type === "multiple_choice" ? 1 : q.question_type === "coding" ? 10 : 5),
      rubric: (q as any).rubric ?? null,
      metadata: (q as any).metadata ?? null,
    }));
    const { error: qErr } = await supabase.from("assessment_questions").insert(rows);
    if (qErr) throw qErr;

    return new Response(JSON.stringify({ assessment_id: assessmentId }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export async function PUT(req: NextRequest) {
  // Grade an assessment attempt
  try {
    const { assessmentId, attemptId, answers, timeRemainingSeconds } = GradeRequestSchema.parse(await req.json());

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
    }

    // Load assessment and questions
    const { data: assess, error: aErr } = await supabase
      .from("assessments")
      .select("id,user_id,time_limit_seconds,status")
      .eq("id", assessmentId)
      .single();
    if (aErr) throw aErr;
    if (!assess || assess.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });
    }

    const { data: questions, error: qLoadErr } = await supabase
      .from("assessment_questions")
      .select("id,question_type,question,options,correct_options,max_score,rubric,question_index,language")
      .eq("assessment_id", assessmentId)
      .order("question_index", { ascending: true });
    if (qLoadErr) throw qLoadErr;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!openai.apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: { "content-type": "application/json" } });
    }

    // Start attempt if needed
    let attemptRow: any = null;
    if (attemptId) {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id,status,started_at")
        .eq("id", attemptId)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      attemptRow = data;
    } else {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .insert({ assessment_id: assessmentId, user_id: user.id })
        .select("id,started_at")
        .single();
      if (error) throw error;
      attemptRow = data;
    }

    const answerResults: Array<{ question_id: string; is_correct: boolean | null; score: number; ai_feedback: any; idx?: number; type?: string }> = [];
    let totalScore = 0;
    let technicalScore = 0;
    let technicalMax = 0;
    let softScore = 0;
    let softMax = 0;

    for (const ans of answers) {
      const q = questions!.find((qq) => qq.id === ans.question_id);
      if (!q) continue;

      if (q.question_type === "multiple_choice") {
        const selectedRaw: number[] = Array.isArray(ans.answer) ? ans.answer.map((n: any) => Number(n)) : (ans.answer == null ? [] : [Number(ans.answer)]);
        const selected = Array.from(new Set(selectedRaw.filter((n) => Number.isFinite(n))));
        const correct: number[] = ((q.correct_options as any[]) ?? []).map((n) => Number(n));
        const isCorrectByKey = correct.length > 0 && selected.length === correct.length && selected.every((n) => correct.includes(n));

        // AI double-check
        let aiOk = isCorrectByKey;
        let aiFeedback: any = null;
        try {
          const check = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT_GRADE + " Return JSON: {\"is_correct\": boolean, \"explanation\": string}." },
              {
                role: "user",
                content: `Question: ${q.question}\nOptions:${(q.options as any[] | null)?.map((o, i) => `\n${i}. ${o}`).join("") || ""}\nSelected: ${selected.join(",")}\nAssume the given key ${JSON.stringify(correct)} is authoritative unless clearly wrong.`,
              },
            ],
            temperature: 0,
            response_format: { type: "json_object" },
          });
          const content = check.choices[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          aiOk = !!parsed.is_correct;
          aiFeedback = { explanation: parsed.explanation };
        } catch {}

        const finalCorrect = isCorrectByKey || aiOk;

        // Partial credit: proportion of correct selections minus wrong selections, clamped to [0,1]
        const correctSet = new Set(correct);
        const correctSelected = selected.filter((n) => correctSet.has(n)).length;
        const wrongSelected = selected.filter((n) => !correctSet.has(n)).length;
        const denom = Math.max(1, correct.length);
        const ratio = Math.max(0, Math.min(1, (correctSelected - wrongSelected) / denom));
        const score = Number((ratio * Number(q.max_score || 1)).toFixed(2));

        totalScore += score;
        technicalScore += score;
        technicalMax += Number(q.max_score || 1);
        answerResults.push({ question_id: q.id, is_correct: finalCorrect, score, ai_feedback: aiFeedback, idx: q.question_index as any, type: q.question_type });
      } else if (q.question_type === "coding" || q.question_type === "scenario") {
        const rubric = (q.rubric as any) || { criteria: [], key_points: [] };
        const maxScore = Number(q.max_score || (q.question_type === "coding" ? 10 : 5));
        let score = 0;
        let feedback: string | null = null;
        try {
          const evalResp = await openai.responses.parse({
            model: "gpt-4.1",
            input: [
              { role: "system", content: SYSTEM_PROMPT_GRADE },
              {
                role: "user",
                content: `Question Type: ${q.question_type}\nLanguage: ${q.language || "n/a"}\nMax Score: ${maxScore}\nRubric: ${JSON.stringify(rubric)}\n\nQuestion:\n${q.question}\n\nCandidate Response:\n${typeof ans.answer === "string" ? ans.answer : JSON.stringify(ans.answer)}`,
              },
              { role: "user", content: `JSON Schema: {"type":"object","properties":{"score":{"type":"number","minimum":0,"maximum":${maxScore}},"feedback":{"type":"string"}},"required":["score","feedback"],"additionalProperties":false}` },
            ],
            temperature: 0,
          });
          const anyEval: any = evalResp;
          let parsed: any = anyEval.output_parsed ?? null;
          if (!parsed && typeof anyEval.output_text === "string") {
            try {
              parsed = JSON.parse(anyEval.output_text);
            } catch {
              parsed = null;
            }
          }
          if (parsed && typeof parsed.score === "number") {
            score = Math.max(0, Math.min(maxScore, Number(parsed.score)));
            feedback = String(parsed.feedback || "");
          }
        } catch {}
        // Fallback feedback if the AI did not return anything
        if (!feedback) {
          const ansText = typeof ans.answer === "string" ? ans.answer : JSON.stringify(ans.answer ?? "");
          feedback = `No detailed AI feedback generated. Rubric summary: ${JSON.stringify(rubric)}. Candidate response length: ${ansText.length}.`;
        }
        totalScore += score;
        if (q.question_type === "coding") {
          technicalScore += score;
          technicalMax += maxScore;
        } else {
          softScore += score;
          softMax += maxScore;
        }
        answerResults.push({ question_id: q.id, is_correct: null, score, ai_feedback: feedback ? { feedback } : null, idx: q.question_index as any, type: q.question_type });
      }
    }

    // Persist attempt + answers
    const now = new Date().toISOString();
    const { data: attemptUpd, error: attErr } = await supabase
      .from("assessment_attempts")
      .upsert({
        id: attemptRow.id,
        assessment_id: assessmentId,
        user_id: user.id,
        submitted_at: now,
        time_remaining_seconds: timeRemainingSeconds ?? null,
        status: "graded",
        score_total: totalScore,
        score_technical: technicalMax > 0 ? technicalScore : null,
        score_soft: softMax > 0 ? softScore : null,
      })
      .select("id")
      .single();
    if (attErr) throw attErr;
    const finalAttemptId = attemptUpd.id as string;

    // Clear existing answers and insert fresh
    await supabase.from("assessment_answers").delete().eq("attempt_id", finalAttemptId);
    const answerRows = answerResults.map((r) => {
      const provided = (answers.find((a) => a.question_id === r.question_id) as any)?.answer;
      const normalized = provided !== undefined && provided !== null ? provided : (r.type === "multiple_choice" ? [] : "");
      return {
        attempt_id: finalAttemptId,
        question_id: r.question_id,
        answer_data: normalized,
        is_correct: r.is_correct,
        score: r.score,
        ai_feedback: r.ai_feedback ?? null,
      };
    });
    const { error: insAnsErr } = await supabase.from("assessment_answers").insert(answerRows);
    if (insAnsErr) throw insAnsErr;

    // Mark assessment completed
    await supabase.from("assessments").update({ status: "completed" }).eq("id", assessmentId).eq("user_id", user.id);

    // Build result report via AI (best-effort)
    let report: any = null;
    try {
      const maxTotal = (technicalMax + softMax) || questions!.reduce((s, q) => s + Number(q.max_score || 0), 0);
      const context = {
        overall: { score: totalScore, max_score: maxTotal },
        sections: [
          { name: "Technical", score: technicalScore, max_score: technicalMax },
          { name: "Soft Skills", score: softScore, max_score: softMax },
        ],
        questions: questions!.map((q) => ({
          index: q.question_index,
          type: q.question_type,
          max_score: q.max_score,
          text: q.question,
        })),
        answers: answerResults.map((a) => ({ index: a.idx, type: a.type, score: a.score, ai_feedback: a.ai_feedback })),
      };
      const resultResp = await openai.responses.parse({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT_RESULT },
          { role: "user", content: `Context: ${JSON.stringify(context)}` },
        ],
        temperature: 0.2,
      });
      const anyR: any = resultResp;
      report = anyR.output_parsed ?? null;
      if (!report && typeof anyR.output_text === "string") {
        try { report = JSON.parse(anyR.output_text); } catch { report = null; }
      }
    } catch {}

    if (report) {
      await supabase.from("assessment_attempts").update({ report }).eq("id", finalAttemptId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ attempt_id: finalAttemptId, score_total: totalScore, report }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


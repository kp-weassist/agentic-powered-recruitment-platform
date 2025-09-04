"use client";

import { ResumeData } from "../../_components/resume-form";

function hasHtml(html?: string): boolean {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
  return text.length > 0;
}

export function ModernPreview({ data }: { data: ResumeData }) {
  const skillsArr = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-sm border mx-auto">
      <div className="bg-slate-900 text-white p-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[30px] font-extrabold tracking-tight">{data.fullName || "Your Name"}</h1>
            <p className="text-sm text-slate-300">{data.location}</p>
          </div>
        </div>
        {hasHtml(data.summary) && (
          <div className="prose prose-sm max-w-none mt-3 text-slate-200" dangerouslySetInnerHTML={{ __html: data.summary || "" }} />
        )}
      </div>

      <div className="p-8 grid grid-cols-3 gap-8">
        <section className="col-span-2">
          {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || hasHtml(e.description)) && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Experience</h2>
              <div className="mt-2 space-y-5">
                {data.experience
                  .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || hasHtml(exp.description))
                  .map((exp, idx) => (
                    <div key={idx} className="border-l-2 pl-4 border-slate-200">
                      <div className="flex items-center justify-between">
                        {exp.position && <p className="font-semibold text-slate-900">{exp.position}</p>}
                        {(exp.start_date || exp.end_date) && (
                          <p className="text-xs text-slate-500">{exp.start_date} {exp.end_date ? `- ${exp.end_date}` : exp.start_date ? "- Present" : ""}</p>
                        )}
                      </div>
                      {exp.company && <p className="text-sm text-slate-700">{exp.company}</p>}
                      {hasHtml(exp.description) && (
                        <div className="prose prose-sm max-w-none mt-1 text-slate-700" dangerouslySetInnerHTML={{ __html: exp.description || "" }} />
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
        <aside className="col-span-1">
          {skillsArr.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Skills</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {skillsArr.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-full text-xs bg-slate-100 border">{skill}</span>
                ))}
              </div>
            </>
          )}

          {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date) && (
            <>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-600">Education</h2>
              <div className="mt-2 space-y-3">
                {data.education
                  .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
                  .map((ed, idx) => (
                    <div key={idx}>
                      {ed.institution && <p className="font-semibold text-sm">{ed.institution}</p>}
                      {(ed.degree || ed.field) && <p className="text-sm text-slate-700">{ed.degree}{ed.degree && ed.field ? " — " : ""}{ed.field}</p>}
                      {ed.graduation_date && <p className="text-xs text-slate-500">Graduated: {ed.graduation_date}</p>}
                    </div>
                  ))}
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="px-8 pb-8">
        {data.projects.some((p) => p.project_name || hasHtml(p.description)) && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Projects</h2>
            <div className="mt-2 grid gap-4">
              {data.projects
                .filter((pr) => pr.project_name || hasHtml(pr.description))
                .map((pr, idx) => (
                  <div key={idx} className="rounded-md border p-3">
                    {pr.project_name && <p className="font-semibold text-slate-900">{pr.project_name}</p>}
                    {hasHtml(pr.description) && (
                      <div className="prose prose-sm max-w-none mt-1 text-slate-700" dangerouslySetInnerHTML={{ __html: pr.description || "" }} />
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ModernPreview;



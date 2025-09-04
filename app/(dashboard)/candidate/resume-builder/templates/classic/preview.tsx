"use client";

import { ResumeData } from "../../_components/resume-form";

function hasHtml(html?: string): boolean {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
  return text.length > 0;
}

export function ClassicPreview({ data }: { data: ResumeData }) {
  const skillsArr = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-sm border mx-auto">
      <div className="p-8">
        <div className="border-b pb-4">
          <h1 className="text-[30px] font-extrabold tracking-tight text-slate-900">{data.fullName || "Your Name"}</h1>
          <p className="text-sm text-slate-500">{data.location}</p>
        </div>

        {hasHtml(data.summary) && (
          <section className="mt-5">
            <h2 className="text-base font-semibold tracking-wide bg-slate-800 text-white px-3 py-1 inline-block rounded">Professional Summary</h2>
            <div className="prose prose-sm max-w-none mt-2 text-slate-700" dangerouslySetInnerHTML={{ __html: data.summary || "" }} />
          </section>
        )}

        <div className="grid grid-cols-3 gap-6 mt-6">
          <section className="col-span-2">
            {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || hasHtml(e.description)) && (
              <>
                <h2 className="text-base font-semibold tracking-wide bg-slate-800 text-white px-3 py-1 inline-block rounded">Experience</h2>
                <div className="space-y-5 mt-3">
                  {data.experience
                    .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || hasHtml(exp.description))
                    .map((exp, idx) => (
                      <div key={idx}>
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
                <h2 className="text-base font-semibold tracking-wide bg-slate-800 text-white px-3 py-1 inline-block rounded">Skills</h2>
                <ul className="mt-3 grid grid-cols-1 gap-1 text-sm text-slate-800">
                  {skillsArr.map((skill, idx) => (
                    <li key={idx} className="border-b pb-1">{skill}</li>
                  ))}
                </ul>
              </>
            )}
            {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date) && (
              <>
                <h2 className="mt-6 text-base font-semibold tracking-wide bg-slate-800 text-white px-3 py-1 inline-block rounded">Education</h2>
                <div className="mt-3 space-y-3">
                  {data.education
                    .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
                    .map((ed, idx) => (
                      <div key={idx}>
                        {ed.institution && <p className="font-semibold text-sm text-slate-900">{ed.institution}</p>}
                        {(ed.degree || ed.field) && <p className="text-sm text-slate-700">{ed.degree}{ed.degree && ed.field ? " — " : ""}{ed.field}</p>}
                        {ed.graduation_date && <p className="text-xs text-slate-500">Graduated: {ed.graduation_date}</p>}
                      </div>
                    ))}
                </div>
              </>
            )}
          </aside>
        </div>

        {data.projects.some((p) => p.project_name || hasHtml(p.description)) && (
          <section className="mt-6">
            <h2 className="text-base font-semibold tracking-wide bg-slate-800 text-white px-3 py-1 inline-block rounded">Projects</h2>
            <div className="space-y-4 mt-3 text-slate-700">
              {data.projects
                .filter((pr) => pr.project_name || hasHtml(pr.description))
                .map((pr, idx) => (
                  <div key={idx}>
                    {pr.project_name && <p className="font-semibold text-slate-900">{pr.project_name}</p>}
                    {hasHtml(pr.description) && (
                      <div className="prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: pr.description || "" }} />
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ClassicPreview;



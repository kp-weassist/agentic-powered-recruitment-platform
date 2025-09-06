"use client";

import { ResumeData } from "../../_components/resume-form";

function hasHtml(html?: string): boolean {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
  return text.length > 0;
}

export function TraditionalPreview({ data }: { data: ResumeData }) {
  const skillsArr = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="w-[794px] min-h-[1123px] bg-white text-black shadow-sm border mx-auto">
      <div className="px-12 py-10">
        {/* Header - Name */}
        <div className="mb-4">
          <h1 className="text-[28px] font-normal mb-2">{data.fullName || ""}</h1>
          
          {/* Contact Info Line */}
          <div className="text-[11px] text-gray-700">
            {[
              data.location,
              data.phone,
              data.email,
              data.linkedin ? data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "") : null
            ].filter(Boolean).map((item, idx, arr) => (
              <span key={idx}>
                {item}
                {idx < arr.length - 1 && <span className="mx-2">"</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Education Section */}
        {data.education.some((e) => e.institution || e.degree || e.field) && (
          <section className="mt-5">
            <h2 className="text-[13px] font-normal border-b border-gray-400 pb-1 mb-3">Education</h2>
            <div className="space-y-3">
              {data.education
                .filter((ed) => ed.institution || ed.degree || ed.field)
                .map((ed, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[11px] font-semibold">{ed.institution}{ed.location ? `, ${ed.location}` : ""}</p>
                        {(ed.degree || ed.field) && (
                          <p className="text-[11px] text-gray-700">
                            {ed.degree}{ed.degree && ed.field ? " in " : ""}{ed.field}
                            {ed.gpa && ed.degree ? ` (${ed.gpa_type === "percentage" ? `${ed.gpa}%` : `GPA: ${ed.gpa}${ed.gpa_scale ? `/${ed.gpa_scale}` : ""}`})` : ""}
                          </p>
                        )}
                      </div>
                      {ed.graduation_date && (
                        <p className="text-[11px] text-gray-700">{ed.graduation_date}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {skillsArr.length > 0 && (
          <section className="mt-5">
            <h2 className="text-[13px] font-normal border-b border-gray-400 pb-1 mb-3">Skills</h2>
            <div className="grid grid-cols-3 gap-x-8 gap-y-1">
              {skillsArr.map((skill, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-[11px] mr-2">"</span>
                  <span className="text-[11px] text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience Section */}
        {data.experience.some((e) => e.company || e.position) && (
          <section className="mt-5">
            <h2 className="text-[13px] font-normal border-b border-gray-400 pb-1 mb-3">Professional Experience</h2>
            <div className="space-y-4">
              {data.experience
                .filter((exp) => exp.company || exp.position)
                .map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[11px] font-semibold">{exp.position}</p>
                        <p className="text-[11px] text-gray-700">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                      </div>
                      <p className="text-[11px] text-gray-700">
                        {exp.start_date ? `${exp.start_date}  ` : ""}
                        {exp.is_current ? "Present" : exp.end_date || ""}
                      </p>
                    </div>
                    {hasHtml(exp.description) && (
                      <div className="ml-4">
                        {exp.description && /<li|<ul/i.test(exp.description) ? (
                          <div 
                            className="text-[11px] text-gray-700 [&_ul]:space-y-1 [&_li]:flex [&_li]:items-start [&_li>*:first-child]:mr-2"
                            dangerouslySetInnerHTML={{ 
                              __html: exp.description.replace(/<li>/g, '<li><span>"</span><span>').replace(/<\/li>/g, '</span></li>') 
                            }} 
                          />
                        ) : (
                          <div className="text-[11px] text-gray-700 space-y-1">
                            {exp.description?.split(/[.!?]/).filter(Boolean).map((sentence, i) => (
                              <div key={i} className="flex items-start">
                                <span className="mr-2">"</span>
                                <span>{sentence.trim()}.</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {data.projects.some((p) => p.project_name) && (
          <section className="mt-5">
            <h2 className="text-[13px] font-normal border-b border-gray-400 pb-1 mb-3">Projects</h2>
            <div className="space-y-3">
              {data.projects
                .filter((pr) => pr.project_name)
                .map((pr, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[11px] font-semibold">{pr.project_name}</p>
                      {pr.date && <p className="text-[11px] text-gray-700">{pr.date}</p>}
                    </div>
                    {hasHtml(pr.description) && (
                      <div className="ml-4">
                        {pr.description && /<li|<ul/i.test(pr.description) ? (
                          <div 
                            className="text-[11px] text-gray-700 [&_ul]:space-y-1 [&_li]:flex [&_li]:items-start [&_li>*:first-child]:mr-2"
                            dangerouslySetInnerHTML={{ 
                              __html: pr.description.replace(/<li>/g, '<li><span>"</span><span>').replace(/<\/li>/g, '</span></li>') 
                            }} 
                          />
                        ) : (
                          <div className="text-[11px] text-gray-700">
                            <div className="flex items-start">
                              <span className="mr-2">"</span>
                              <span>{pr.description?.replace(/<[^>]*>/g, "")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Certifications Section */}
        {data.certifications && (
          <section className="mt-5">
            <h2 className="text-[13px] font-normal border-b border-gray-400 pb-1 mb-3">Certifications</h2>
            <div className="space-y-1">
              {data.certifications.split(",").map((cert, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-[11px] mr-2">"</span>
                  <span className="text-[11px] text-gray-700">{cert.trim()}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages Section */}
        {data.languages && (
          <section className="mt-5">
            <h2 className="text-[13px] font-normal border-b border-gray-400 pb-1 mb-3">Languages</h2>
            <div className="space-y-1">
              {data.languages.split(",").map((lang, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-[11px] mr-2">"</span>
                  <span className="text-[11px] text-gray-700">{lang.trim()}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default TraditionalPreview;
"use client";

import { ResumeData } from "../../_components/resume-form";

function hasHtml(html?: string): boolean {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
  return text.length > 0;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function ModernPreview({ data }: { data: ResumeData }) {
  const skillsArr = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const languagesArr = data.languages
    ? data.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const certificationsArr = data.certifications
    ? data.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="w-[794px] min-h-[1123px] bg-white text-gray-800 shadow-sm border mx-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        {data.fullName && <h1 className="text-[32px] font-bold text-gray-900">{data.fullName}</h1>}
        {/* <p className="text-[11px] text-gray-500 mt-1">ATS Compliant Resume</p> */}
        
        {/* Contact Info Row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-[10px] text-gray-700">
          {data.location && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">Address:</span>
              <span>{data.location}</span>
            </div>
          )}
          {data.linkedin && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">LinkedIn:</span>
              <a 
                href={data.linkedin.includes('linkedin.com') ? data.linkedin : `https://linkedin.com/in/${data.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "")}
              </a>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">Phone:</span>
              <a href={`tel:${data.phone}`} className="hover:underline">
                {data.phone}
              </a>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-1">
              <span className="font-semibold">Email:</span>
              <a href={`mailto:${data.email}`} className="text-blue-600 hover:underline">
                {data.email}
              </a>
            </div>
          )}
        </div>
        
        <div className="border-b border-gray-300 mt-4"></div>
      </div>

      {/* Objective Section */}
      {hasHtml(data.summary) && (
        <div className="px-8 py-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-2">Objective</h2>
          <div className="text-[11px] text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1" 
               dangerouslySetInnerHTML={{ __html: data.summary || "" }} />
        </div>
      )}

      <div className="flex">
        {/* Left Column - Main Content */}
        <div className="flex-1 px-8 py-3">
          {/* Professional Experience */}
          {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || hasHtml(e.description)) && (
            <section>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3">Professional Experience</h2>
              <div className="space-y-4">
                {data.experience
                  .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || hasHtml(exp.description))
                  .map((exp, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline">
                        <div>
                          {exp.position && <p className="text-[12px] font-semibold text-gray-900">{exp.position}</p>}
                          {exp.company && (
                            <p className="text-[11px] text-gray-700">
                              {exp.company}
                              {exp.location && `, ${exp.location}`}
                            </p>
                          )}
                        </div>
                        {(exp.start_date || exp.end_date || exp.is_current) && (
                          <p className="text-[10px] text-gray-600">
                            {exp.start_date}{exp.start_date && (exp.end_date || exp.is_current) ? " – " : ""}
                            {exp.is_current ? "Present" : exp.end_date}
                          </p>
                        )}
                      </div>
                      {hasHtml(exp.description) && (
                        <div className="text-[10px] text-gray-700 mt-2 ml-4 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1 leading-relaxed" 
                             dangerouslySetInnerHTML={{ __html: exp.description || "" }} />
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.projects.some((p) => p.project_name || hasHtml(p.description)) && (
            <section className="mt-6">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3">Projects</h2>
              <div className="space-y-3">
                {data.projects
                  .filter((pr) => pr.project_name || hasHtml(pr.description))
                  .map((pr, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline">
                        <div className="flex-1">
                          {pr.project_name && <p className="text-[12px] font-semibold text-gray-900">{pr.project_name}</p>}
                        </div>
                        {pr.date && (
                          <p className="text-[9px] text-gray-600 ml-2">{pr.date}</p>
                        )}
                      </div>
                      {(pr.project_link || pr.github_link) && (
                        <div className="flex gap-3 mt-1 ml-4">
                          {pr.project_link && (
                            <a 
                              href={pr.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-blue-600 hover:underline"
                            >
                              View Project
                            </a>
                          )}
                          {pr.github_link && (
                            <a 
                              href={pr.github_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-blue-600 hover:underline"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                      )}
                      {hasHtml(pr.description) && (
                        <div className="text-[10px] text-gray-700 mt-1 ml-4 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1 leading-relaxed" 
                             dangerouslySetInnerHTML={{ __html: pr.description || "" }} />
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-[200px] bg-gray-100 px-6 py-3">
          {/* Skills */}
          {skillsArr.length > 0 && (
            <section>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3 bg-gray-200 px-2 py-1">Skills</h2>
              <div className="flex flex-wrap gap-1">
                {skillsArr.map((skill, idx) => (
                  <span key={idx} className="text-[10px] bg-white px-2 py-1 rounded text-gray-700 mb-1">{skill}</span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date) && (
            <section className="mt-6">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3 bg-gray-200 px-2 py-1">Education</h2>
              <div className="space-y-3">
                {data.education
                  .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
                  .map((ed, idx) => (
                    <div key={idx}>
                      {(ed.degree || ed.field) && (
                        <p className="text-[11px] font-semibold text-gray-900">
                          {ed.degree}{ed.degree && ed.field ? " in " : ""}{ed.field}
                        </p>
                      )}
                      {ed.institution && (
                        <p className="text-[10px] text-gray-700">
                          {ed.institution}
                          {ed.location && `, ${ed.location}`}
                        </p>
                      )}
                      {(ed.start_date || ed.graduation_date) && (
                        <p className="text-[9px] text-gray-600">
                          {ed.start_date && ed.graduation_date ? `${ed.start_date} - ${ed.graduation_date}` : 
                           ed.graduation_date ? `Graduation Date: ${ed.graduation_date}` : 
                           `Start Date: ${ed.start_date}`}
                        </p>
                      )}
                      {hasHtml(ed.coursework) && (
                        <>
                          <p className="text-[10px] font-semibold text-gray-800 mt-2">Relevant coursework:</p>
                          <div className="text-[9px] text-gray-700" 
                               dangerouslySetInnerHTML={{ __html: ed.coursework || "" }} />
                        </>
                      )}
                      {ed.gpa && (
                        <p className="text-[10px] text-gray-700 mt-1">
                          {ed.gpa_type === "percentage" ? 
                            `Score: ${ed.gpa}%` : 
                            `Honors: ${ed.gpa}${ed.gpa_scale ? ` / ${ed.gpa_scale}` : ""} GPA`}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certificationsArr.length > 0 && (
            <section className="mt-6">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3 bg-gray-200 px-2 py-1">Certifications</h2>
              <div className="space-y-2">
                {certificationsArr.map((cert, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] text-gray-700">{cert}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {languagesArr.length > 0 && (
            <section className="mt-6">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3 bg-gray-200 px-2 py-1">Languages</h2>
              <div className="space-y-1">
                {languagesArr.map((lang, idx) => (
                  <p key={idx} className="text-[10px] text-gray-700">{lang}</p>
                ))}
              </div>
            </section>
          )}

          {/* Additional Info */}
          {(data.volunteer_experience || data.interests_hobbies) && (
            <section className="mt-6">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-900 mb-3 bg-gray-200 px-2 py-1">Additional</h2>
              <div className="space-y-3">
                {hasHtml(data.volunteer_experience) && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-800">Volunteer Experience</p>
                    {typeof data.volunteer_experience === "string" && /<li|<ul/i.test(data.volunteer_experience) ? (
                      <div
                        className="text-[9px] text-gray-700 mt-1 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1"
                        dangerouslySetInnerHTML={{ __html: data.volunteer_experience }}
                      />
                    ) : (
                      <p className="text-[9px] text-gray-700 mt-1">{data.volunteer_experience}</p>
                    )}
                  </div>
                )}
                {hasHtml(data.interests_hobbies) && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-800">Interests/Hobbies</p>
                    {typeof data.interests_hobbies === "string" && /<li|<ul/i.test(data.interests_hobbies) ? (
                      <div
                        className="text-[9px] text-gray-700 mt-1 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1"
                        dangerouslySetInnerHTML={{ __html: data.interests_hobbies }}
                      />
                    ) : (
                      <p className="text-[9px] text-gray-700 mt-1">{data.interests_hobbies}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModernPreview;
"use client";

import { ResumeData } from "../../_components/resume-form";

function hasHtml(html?: string): boolean {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
  return text.length > 0;
}

function ContactInfo({ data }: { data: ResumeData }) {
  const parts = [];
  
  if (data.location) parts.push(<span key="location">{data.location}</span>);
  
  if (data.phone) parts.push(
    <a key="phone" href={`tel:${data.phone}`} className="hover:underline">
      {data.phone}
    </a>
  );
  
  if (data.email) parts.push(
    <a key="email" href={`mailto:${data.email}`} className="hover:underline">
      {data.email}
    </a>
  );
  
  if (data.linkedin) {
    const linkedinUrl = data.linkedin.includes('linkedin.com') 
      ? data.linkedin 
      : `https://linkedin.com/in/${data.linkedin}`;
    const displayUrl = data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "");
    parts.push(
      <a key="linkedin" href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {displayUrl}
      </a>
    );
  }
  
  if (parts.length === 0) return null;
  
  return (
    <p className="text-[11px] text-gray-700">
      {parts.map((part, idx) => (
        <span key={idx}>
          {idx > 0 && " • "}
          {part}
        </span>
      ))}
    </p>
  );
}

export function ClassicPreview({ data }: { data: ResumeData }) {
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
    <div className="w-[794px] min-h-[1123px] bg-white text-black shadow-sm border mx-auto">
      <div className="px-12 py-10">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-[36px] font-bold tracking-wide mb-2">{data.fullName || ""}</h1>
          <ContactInfo data={data} />
        </div>

        {/* Summary/Objective Section */}
        {hasHtml(data.summary) && (
          <section className="mt-6">
            <h2 className="text-[14px] font-bold border-b-2 border-black pb-1 mb-3">Summary</h2>
            <div className="text-[11px] text-gray-700 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1" 
                 dangerouslySetInnerHTML={{ __html: data.summary }} />
          </section>
        )}

        {/* Education Section */}
        {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date || e.gpa || hasHtml(e.coursework)) && (
          <section className="mt-6">
            <h2 className="text-[14px] font-bold border-b-2 border-black pb-1 mb-3">Education</h2>
            <div className="space-y-4">
              {data.education
                .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
                .map((ed, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {ed.institution && <p className="text-[11px] font-bold uppercase">{ed.institution}</p>}
                        {(ed.degree || ed.field) && (
                          <p className="text-[11px] text-gray-700 mt-1">
                            {ed.degree}{ed.degree && ed.field ? " in " : ""}{ed.field}
                          </p>
                        )}
                        {ed.gpa && (
                          <p className="text-[11px] text-gray-700">
                            {ed.gpa_type === "percentage" ? `${ed.gpa}%` : `GPA: ${ed.gpa}${ed.gpa_scale ? ` / ${ed.gpa_scale}` : ""}`}
                          </p>
                        )}
                        {hasHtml(ed.coursework) && (
                          <div className="text-[11px] text-gray-700 mt-1">
                            <span>Relevant coursework: </span>
                            <span dangerouslySetInnerHTML={{ __html: ed.coursework || "" }} />
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {ed.location && <p className="text-[11px] text-gray-600">{ed.location}</p>}
                        {(ed.start_date || ed.graduation_date) && (
                          <p className="text-[11px] text-gray-600">
                            {ed.start_date && ed.graduation_date ? `${ed.start_date} - ${ed.graduation_date}` : ed.graduation_date || ed.start_date}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Experience Section */}
        {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || hasHtml(e.description)) && (
          <section className="mt-6">
            <h2 className="text-[14px] font-bold border-b-2 border-black pb-1 mb-3">Experience</h2>
            <div className="space-y-4">
              {data.experience
                .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || hasHtml(exp.description))
                .map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {exp.position && <p className="text-[11px] font-bold uppercase">{exp.position}</p>}
                        {exp.company && <p className="text-[11px] text-gray-700">{exp.company}</p>}
                        {hasHtml(exp.description) && (
                          <div className="text-[11px] text-gray-700 mt-2 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1" 
                               dangerouslySetInnerHTML={{ __html: exp.description || "" }} />
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {exp.location && <p className="text-[11px] text-gray-600">{exp.location}</p>}
                        {(exp.start_date || exp.end_date || exp.is_current) && (
                          <p className="text-[11px] text-gray-600">
                            {exp.start_date}{exp.start_date && (exp.end_date || exp.is_current) ? " - " : ""}
                            {exp.is_current ? "Present" : exp.end_date}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* University Projects Section */}
        {data.projects.some((p) => p.project_name || hasHtml(p.description)) && (
          <section className="mt-6">
            <h2 className="text-[14px] font-bold border-b-2 border-black pb-1 mb-3">Projects</h2>
            <div className="space-y-4">
              {data.projects
                .filter((pr) => pr.project_name || hasHtml(pr.description))
                .map((pr, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {pr.project_name && <p className="text-[11px] font-bold uppercase">{pr.project_name}</p>}
                        <div className="flex gap-3 mt-1">
                          {pr.project_link && (
                            <a 
                              href={pr.project_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-blue-600 hover:underline"
                            >
                              View Project
                            </a>
                          )}
                          {pr.github_link && (
                            <a 
                              href={pr.github_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-blue-600 hover:underline"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                        {hasHtml(pr.description) && (
                          <div className="text-[11px] text-gray-700 mt-2 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1" 
                               dangerouslySetInnerHTML={{ __html: pr.description || "" }} />
                        )}
                      </div>
                      {pr.date && (
                        <div className="text-right ml-4">
                          <p className="text-[11px] text-gray-600">{pr.date}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Activities Section */}
        {data.activities && data.activities.length > 0 && data.activities.some((a) => a.name || hasHtml(a.description)) && (
          <section className="mt-6">
            <h2 className="text-[14px] font-bold border-b-2 border-black pb-1 mb-3">Acheivements</h2>
            <div className="space-y-4">
              {data.activities
                .filter((act) => act.name || hasHtml(act.description))
                .map((act, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {act.name && <p className="text-[11px] font-bold uppercase">{act.name}</p>}
                        {hasHtml(act.description) && (
                          <div className="text-[11px] text-gray-700 mt-2 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1" 
                               dangerouslySetInnerHTML={{ __html: act.description || "" }} />
                        )}
                      </div>
                      {act.date && (
                        <div className="text-right ml-4">
                          <p className="text-[11px] text-gray-600">{act.date}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Additional Section */}
        {(languagesArr.length > 0 || skillsArr.length > 0 || certificationsArr.length > 0 || data.volunteer_experience || data.interests_hobbies) && (
          <section className="mt-6">
            <h2 className="text-[14px] font-bold border-b-2 border-black pb-1 mb-3">Skills & Additional Information</h2>
            <div className="space-y-2">
              {languagesArr.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold">Languages: </span>
                  <span className="text-[11px] text-gray-700">{languagesArr.join(", ")}</span>
                </div>
              )}
              {skillsArr.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold">Skills: </span>
                  <span className="text-[11px] text-gray-700">{skillsArr.join(", ")}</span>
                </div>
              )}
              {certificationsArr.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold">Certifications: </span>
                  <span className="text-[11px] text-gray-700">{certificationsArr.join(", ")}</span>
                </div>
              )}
              {hasHtml(data.volunteer_experience) && (
                <div>
                  <span className="text-[11px] font-bold">Volunteer Experience</span>
                  {typeof data.volunteer_experience === "string" && /<li|<ul/i.test(data.volunteer_experience) ? (
                    <div
                      className="text-[11px] text-gray-700 mt-1 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1"
                      dangerouslySetInnerHTML={{ __html: data.volunteer_experience }}
                    />
                  ) : (
                    <div className="text-[11px] text-gray-700 mt-1">{data.volunteer_experience}</div>
                  )}
                </div>
              )}
              {hasHtml(data.interests_hobbies) && (
                <div>
                  <span className="text-[11px] font-bold">Interests/Hobbies</span>
                  {typeof data.interests_hobbies === "string" && /<li|<ul/i.test(data.interests_hobbies) ? (
                    <div
                      className="text-[11px] text-gray-700 mt-1 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:mt-1"
                      dangerouslySetInnerHTML={{ __html: data.interests_hobbies }}
                    />
                  ) : (
                    <div className="text-[11px] text-gray-700 mt-1">{data.interests_hobbies}</div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ClassicPreview;



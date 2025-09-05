import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { ResumeData } from "../../_components/resume-form";

const styles = StyleSheet.create({
  page: { 
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2937"
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 16
  },
  name: { 
    fontSize: 26,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    color: "#111827"
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 20
  },
  contactItem: {
    flexDirection: "row",
    fontSize: 9
  },
  contactLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 4
  },
  contactValue: {
    color: "#374151"
  },
  contactLink: {
    color: "#2563eb"
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginTop: 12
  },
  mainContent: {
    flexDirection: "row"
  },
  leftColumn: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 12
  },
  rightColumn: {
    width: 180,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#111827",
    marginBottom: 8
  },
  sidebarTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#111827",
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 8
  },
  objectiveText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5
  },
  experienceItem: {
    marginBottom: 12
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2
  },
  jobTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827"
  },
  jobCompany: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 6
  },
  jobDate: {
    fontSize: 9,
    color: "#6b7280"
  },
  description: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
    marginLeft: 12
  },
  bullet: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
    marginLeft: 12,
    marginTop: 2
  },
  projectItem: {
    marginBottom: 10
  },
  projectTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 3
  },
  skillChip: {
    fontSize: 9,
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: 4,
    marginRight: 4,
    color: "#374151"
  },
  educationItem: {
    marginBottom: 10
  },
  educationDegree: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827"
  },
  educationSchool: {
    fontSize: 9,
    color: "#374151",
    marginTop: 1
  },
  educationDate: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 1
  },
  courseworkTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    marginTop: 6
  },
  courseworkText: {
    fontSize: 8,
    color: "#374151",
    marginTop: 2
  },
  certificationItem: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 6
  },
  languageItem: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 2
  }
});

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function RenderBulletPoints({ html }: { html: string }) {
  const items = Array.from(html.matchAll(/<li[\s\S]*?>([\s\S]*?)<\/li>/gi)).map((m) => stripHtml(m[1]));
  
  if (items.length > 0) {
    return (
      <View>
        {items.map((item, idx) => (
          <Text key={idx} style={styles.bullet}>• {item}</Text>
        ))}
      </View>
    );
  }
  
  const plainText = stripHtml(html);
  if (!plainText) return null;
  
  const lines = plainText.split(/[.!?]/).filter(Boolean);
  if (lines.length > 1) {
    return (
      <View>
        {lines.map((line, idx) => (
          <Text key={idx} style={styles.bullet}>• {line.trim()}</Text>
        ))}
      </View>
    );
  }
  
  return <Text style={styles.description}>{plainText}</Text>;
}

export function ModernPdf({ data }: { data: ResumeData }) {
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
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.fullName && <Text style={styles.name}>{data.fullName}</Text>}
          {/* <Text style={styles.subtitle}>ATS Compliant Resume</Text> */}
          
          {/* Contact Info */}
          <View style={styles.contactRow}>
            {data.location && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Address:</Text>
                <Text style={styles.contactValue}>{data.location}</Text>
              </View>
            )}
            {data.linkedin && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>LinkedIn:</Text>
                <Link 
                  src={data.linkedin.includes('linkedin.com') ? data.linkedin : `https://linkedin.com/in/${data.linkedin}`}
                  style={styles.contactLink}
                >
                  {data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "")}
                </Link>
              </View>
            )}
            {data.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Link src={`tel:${data.phone}`} style={styles.contactValue}>
                  {data.phone}
                </Link>
              </View>
            )}
            {data.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Link src={`mailto:${data.email}`} style={styles.contactLink}>
                  {data.email}
                </Link>
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
        </View>

        {/* Objective Section (if exists) */}
        {stripHtml(data.summary) && (
          <View style={{ paddingHorizontal: 32, paddingVertical: 12 }}>
            <Text style={styles.sectionTitle}>OBJECTIVE</Text>
            <RenderBulletPoints html={data.summary || ""} />
          </View>
        )}

        {/* Main Content - Two Columns */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Professional Experience */}
            {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || stripHtml(e.description)) && (
              <View>
                <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
                {data.experience
                  .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || stripHtml(exp.description))
                  .map((exp, idx) => (
                    <View key={idx} style={styles.experienceItem}>
                      <View style={styles.jobHeader}>
                        <View style={{ flex: 1 }}>
                          {exp.position && <Text style={styles.jobTitle}>{exp.position}</Text>}
                          {exp.company && (
                            <Text style={styles.jobCompany}>
                              {exp.company}
                              {exp.location && `, ${exp.location}`}
                            </Text>
                          )}
                        </View>
                        {(exp.start_date || exp.end_date || exp.is_current) && (
                          <Text style={styles.jobDate}>
                            {exp.start_date}{exp.start_date && (exp.end_date || exp.is_current) ? " – " : ""}
                            {exp.is_current ? "Present" : exp.end_date}
                          </Text>
                        )}
                      </View>
                      {stripHtml(exp.description) && (
                        <RenderBulletPoints html={exp.description || ""} />
                      )}
                    </View>
                  ))}
              </View>
            )}

            {/* Projects */}
            {data.projects.some((p) => p.project_name || stripHtml(p.description)) && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sectionTitle}>PROJECTS</Text>
                {data.projects
                  .filter((pr) => pr.project_name || stripHtml(pr.description))
                  .map((pr, idx) => (
                    <View key={idx} style={styles.projectItem}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                        <View style={{ flex: 1 }}>
                          {pr.project_name && <Text style={styles.projectTitle}>{pr.project_name}</Text>}
                        </View>
                        {pr.date && (
                          <Text style={{ fontSize: 8, color: "#6b7280", marginLeft: 8 }}>{pr.date}</Text>
                        )}
                      </View>
                      {(pr.project_link || pr.github_link) && (
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 4, marginBottom: 4 }}>
                          {pr.project_link && (
                            <Link src={pr.project_link} style={{ fontSize: 8, color: "#2563eb", textDecoration: "none" }}>
                              View Project
                            </Link>
                          )}
                          {pr.github_link && (
                            <Link src={pr.github_link} style={{ fontSize: 8, color: "#2563eb", textDecoration: "none" }}>
                              GitHub
                            </Link>
                          )}
                        </View>
                      )}
                      {stripHtml(pr.description) && (
                        <RenderBulletPoints html={pr.description || ""} />
                      )}
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Right Column - Sidebar */}
          <View style={styles.rightColumn}>
            {/* Skills */}
            {skillsArr.length > 0 && (
              <View>
                <Text style={styles.sidebarTitle}>SKILLS</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {skillsArr.map((skill, idx) => (
                    <Text key={idx} style={styles.skillChip}>{skill}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Education */}
            {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date) && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sidebarTitle}>EDUCATION</Text>
                {data.education
                  .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
                  .map((ed, idx) => (
                    <View key={idx} style={styles.educationItem}>
                      {(ed.degree || ed.field) && (
                        <Text style={styles.educationDegree}>
                          {ed.degree}{ed.degree && ed.field ? " in " : ""}{ed.field}
                        </Text>
                      )}
                      {ed.institution && (
                        <Text style={styles.educationSchool}>
                          {ed.institution}
                          {ed.location && `, ${ed.location}`}
                        </Text>
                      )}
                      {(ed.start_date || ed.graduation_date) && (
                        <Text style={styles.educationDate}>
                          {ed.start_date && ed.graduation_date ? `${ed.start_date} - ${ed.graduation_date}` : 
                           ed.graduation_date ? `Graduation Date: ${ed.graduation_date}` : 
                           `Start Date: ${ed.start_date}`}
                        </Text>
                      )}
                      {stripHtml(ed.coursework) && (
                        <View>
                          <Text style={styles.courseworkTitle}>Relevant coursework:</Text>
                          <Text style={styles.courseworkText}>{stripHtml(ed.coursework)}</Text>
                        </View>
                      )}
                      {ed.gpa && (
                        <Text style={styles.educationSchool}>
                          {ed.gpa_type === "percentage" ? 
                            `Score: ${ed.gpa}%` : 
                            `Honors: ${ed.gpa}${ed.gpa_scale ? ` / ${ed.gpa_scale}` : ""} GPA`}
                        </Text>
                      )}
                    </View>
                  ))}
              </View>
            )}

            {/* Certifications */}
            {certificationsArr.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sidebarTitle}>CERTIFICATIONS</Text>
                {certificationsArr.map((cert, idx) => (
                  <Text key={idx} style={styles.certificationItem}>{cert}</Text>
                ))}
              </View>
            )}

            {/* Languages */}
            {languagesArr.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sidebarTitle}>LANGUAGES</Text>
                {languagesArr.map((lang, idx) => (
                  <Text key={idx} style={styles.languageItem}>{lang}</Text>
                ))}
              </View>
            )}

            {/* Additional Info */}
            {(data.volunteer_experience || data.interests_hobbies) && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sidebarTitle}>ADDITIONAL</Text>
                {stripHtml(data.volunteer_experience) && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1f2937", marginBottom: 2 }}>Volunteer Experience</Text>
                    <RenderBulletPoints html={data.volunteer_experience || ""} />
                  </View>
                )}
                {stripHtml(data.interests_hobbies) && (
                  <View>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1f2937", marginBottom: 2 }}>Interests/Hobbies</Text>
                    <RenderBulletPoints html={data.interests_hobbies || ""} />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default ModernPdf;
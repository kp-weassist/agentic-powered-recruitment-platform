import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { ResumeData } from "../../_components/resume-form";

const styles = StyleSheet.create({
  page: { 
    padding: 48,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#000000"
  },
  header: {
    textAlign: "center",
    marginBottom: 12
  },
  name: { 
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "Times-Bold",
    letterSpacing: 0.5,
    marginBottom: 8
  },
  contactInfo: { 
    fontSize: 10,
    color: "#374151",
    textAlign: "center"
  },
  section: {
    marginTop: 18
  },
  sectionTitle: { 
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "Times-Bold",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000",
    paddingBottom: 3,
    marginBottom: 10,
    textTransform: "capitalize"
  },
  entryContainer: {
    marginBottom: 12
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3
  },
  entryLeft: {
    flex: 1
  },
  entryRight: {
    textAlign: "right",
    marginLeft: 16
  },
  entryTitle: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    marginBottom: 2
  },
  entrySubtitle: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 2
  },
  entryLocation: {
    fontSize: 10,
    color: "#4B5563"
  },
  entryDate: {
    fontSize: 10,
    color: "#4B5563"
  },
  description: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
    marginTop: 6
  },
  bullet: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
    marginTop: 3,
    marginLeft: 12
  },
  additionalRow: {
    marginBottom: 6
  },
  additionalLabel: {
    fontSize: 10,
    fontFamily: "Times-Bold"
  },
  additionalValue: {
    fontSize: 10,
    color: "#374151"
  },
  projectLink: {
    fontSize: 9,
    color: "#2563eb",
    textDecoration: "none",
    marginRight: 8
  }
});

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function ContactInfoPdf({ data }: { data: ResumeData }) {
  const parts = [];
  
  if (data.location) {
    parts.push(data.location);
  }
  
  if (data.phone) {
    parts.push(data.phone);
  }
  
  if (data.email) {
    parts.push(data.email);
  }
  
  if (data.linkedin) {
    const displayUrl = data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "");
    parts.push(displayUrl);
  }
  
  if (parts.length === 0) return null;
  
  return <Text style={styles.contactInfo}>{parts.join(" • ")}</Text>;
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

export function ClassicPdf({ data }: { data: ResumeData }) {
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
          <ContactInfoPdf data={data} />
        </View>

        {/* Summary Section */}
        {stripHtml(data.summary) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <RenderBulletPoints html={data.summary || ""} />
          </View>
        )}

        {/* Education Section */}
        {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date || e.gpa || stripHtml(e.coursework)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education
              .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
              .map((ed, idx) => (
                <View key={idx} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      {ed.institution && (
                        <Text style={styles.entryTitle}>{ed.institution}</Text>
                      )}
                      {(ed.degree || ed.field) && (
                        <Text style={styles.entrySubtitle}>
                          {ed.degree}{ed.degree && ed.field ? " in " : ""}{ed.field}
                        </Text>
                      )}
                      {ed.gpa && (
                        <Text style={styles.entrySubtitle}>
                          {ed.gpa_type === "percentage" ? `${ed.gpa}%` : `GPA: ${ed.gpa}${ed.gpa_scale ? ` / ${ed.gpa_scale}` : ""}`}
                        </Text>
                      )}
                      {stripHtml(ed.coursework) && (
                        <Text style={styles.entrySubtitle}>
                          Relevant coursework: {stripHtml(ed.coursework)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.entryRight}>
                      {ed.location && (
                        <Text style={styles.entryLocation}>{ed.location}</Text>
                      )}
                      {(ed.start_date || ed.graduation_date) && (
                        <Text style={styles.entryDate}>
                          {ed.start_date && ed.graduation_date ? `${ed.start_date} - ${ed.graduation_date}` : ed.graduation_date || ed.start_date}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Experience Section */}
        {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || stripHtml(e.description)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience
              .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || stripHtml(exp.description))
              .map((exp, idx) => (
                <View key={idx} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      {exp.position && (
                        <Text style={styles.entryTitle}>{exp.position}</Text>
                      )}
                      {exp.company && (
                        <Text style={styles.entrySubtitle}>{exp.company}</Text>
                      )}
                    </View>
                    <View style={styles.entryRight}>
                      {exp.location && (
                        <Text style={styles.entryLocation}>{exp.location}</Text>
                      )}
                      {(exp.start_date || exp.end_date || exp.is_current) && (
                        <Text style={styles.entryDate}>
                          {exp.start_date}{exp.start_date && (exp.end_date || exp.is_current) ? " - " : ""}
                          {exp.is_current ? "Present" : exp.end_date}
                        </Text>
                      )}
                    </View>
                  </View>
                  {stripHtml(exp.description) && (
                    <RenderBulletPoints html={exp.description || ""} />
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Projects Section */}
        {data.projects.some((p) => p.project_name || stripHtml(p.description)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}> Projects</Text>
            {data.projects
              .filter((pr) => pr.project_name || stripHtml(pr.description))
              .map((pr, idx) => (
                <View key={idx} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      {pr.project_name && (
                        <Text style={styles.entryTitle}>{pr.project_name}</Text>
                      )}
                      {(pr.project_link || pr.github_link) && (
                        <View style={{ flexDirection: "row", marginTop: 2 }}>
                          {pr.project_link && (
                            <Link src={pr.project_link} style={styles.projectLink}>
                              View Project
                            </Link>
                          )}
                          {pr.github_link && (
                            <Link src={pr.github_link} style={styles.projectLink}>
                              GitHub
                            </Link>
                          )}
                        </View>
                      )}
                    </View>
                    {pr.date && (
                      <View style={styles.entryRight}>
                        <Text style={styles.entryDate}>{pr.date}</Text>
                      </View>
                    )}
                  </View>
                  {stripHtml(pr.description) && (
                    <RenderBulletPoints html={pr.description || ""} />
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Activities Section */}
        {data.activities && data.activities.length > 0 && data.activities.some((a) => a.name || stripHtml(a.description)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acheivements</Text>
            {data.activities
              .filter((act) => act.name || stripHtml(act.description))
              .map((act, idx) => (
                <View key={idx} style={styles.entryContainer}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      {act.name && (
                        <Text style={styles.entryTitle}>{act.name}</Text>
                      )}
                    </View>
                    {act.date && (
                      <View style={styles.entryRight}>
                        <Text style={styles.entryDate}>{act.date}</Text>
                      </View>
                    )}
                  </View>
                  {stripHtml(act.description) && (
                    <RenderBulletPoints html={act.description || ""} />
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Additional Section */}
        {(languagesArr.length > 0 || skillsArr.length > 0 || data.volunteer_experience || data.interests_hobbies || certificationsArr.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View>
              {languagesArr.length > 0 && (
                <View style={styles.additionalRow}>
                  <Text>
                    <Text style={styles.additionalLabel}>Language Skills: </Text>
                    <Text style={styles.additionalValue}>{languagesArr.join(", ")}</Text>
                  </Text>
                </View>
              )}
              {skillsArr.length > 0 && (
                <View style={styles.additionalRow}>
                  <Text>
                    <Text style={styles.additionalLabel}>Skills: </Text>
                    <Text style={styles.additionalValue}>{skillsArr.join(", ")}</Text>
                  </Text>
                </View>
              )}
              {certificationsArr.length > 0 && (
                <View style={styles.additionalRow}>
                  <Text>
                    <Text style={styles.additionalLabel}>Certifications: </Text>
                    <Text style={styles.additionalValue}>{certificationsArr.join(", ")}</Text>
                  </Text>
                </View>
              )}
              {data.volunteer_experience && stripHtml(data.volunteer_experience) && (
                <View style={styles.additionalRow}>
                  <Text style={styles.additionalLabel}>Volunteer Experience</Text>
                  <RenderBulletPoints html={data.volunteer_experience || ""} />
                </View>
              )}
              {data.interests_hobbies && stripHtml(data.interests_hobbies) && (
                <View style={styles.additionalRow}>
                  <Text style={styles.additionalLabel}>Interests/Hobbies</Text>
                  <RenderBulletPoints html={data.interests_hobbies || ""} />
                </View>
              )}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default ClassicPdf;
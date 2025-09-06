import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "../../_components/resume-form";

const styles = StyleSheet.create({
  page: { 
    padding: 48,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#000000"
  },
  header: {
    marginBottom: 16
  },
  name: { 
    fontSize: 22,
    fontWeight: 400,
    marginBottom: 8
  },
  contactInfo: { 
    fontSize: 10,
    color: "#374151",
    flexDirection: "row",
    flexWrap: "wrap"
  },
  contactItem: {
    marginRight: 8
  },
  contactSeparator: {
    marginLeft: 8,
    marginRight: 8
  },
  section: {
    marginTop: 16
  },
  sectionTitle: { 
    fontSize: 12,
    fontWeight: 400,
    borderBottomWidth: 0.5,
    borderBottomColor: "#9CA3AF",
    paddingBottom: 3,
    marginBottom: 10
  },
  educationContainer: {
    marginBottom: 10
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2
  },
  educationInstitution: {
    fontSize: 10,
    fontFamily: "Times-Bold"
  },
  educationDetails: {
    fontSize: 10,
    color: "#374151"
  },
  educationDate: {
    fontSize: 10,
    color: "#374151"
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  skillItem: {
    width: "33%",
    flexDirection: "row",
    marginBottom: 3
  },
  bullet: {
    fontSize: 10,
    marginRight: 6
  },
  skillText: {
    fontSize: 10,
    color: "#374151"
  },
  experienceContainer: {
    marginBottom: 14
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  experienceLeft: {
    flex: 1
  },
  experienceTitle: {
    fontSize: 10,
    fontFamily: "Times-Bold"
  },
  experienceCompany: {
    fontSize: 10,
    color: "#374151"
  },
  experienceDate: {
    fontSize: 10,
    color: "#374151"
  },
  experienceDescription: {
    marginLeft: 16
  },
  descriptionBullet: {
    fontSize: 10,
    color: "#374151",
    flexDirection: "row",
    marginBottom: 3
  },
  descriptionText: {
    flex: 1
  },
  projectContainer: {
    marginBottom: 10
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  projectName: {
    fontSize: 10,
    fontFamily: "Times-Bold"
  },
  projectDate: {
    fontSize: 10,
    color: "#374151"
  },
  projectDescription: {
    marginLeft: 16
  },
  listContainer: {
    marginTop: 4
  },
  listItem: {
    flexDirection: "row",
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
          <View key={idx} style={styles.descriptionBullet}>
            <Text style={styles.bullet}>"</Text>
            <Text style={styles.descriptionText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  
  const plainText = stripHtml(html);
  if (!plainText) return null;
  
  const sentences = plainText.split(/[.!?]/).filter(Boolean);
  if (sentences.length > 1) {
    return (
      <View>
        {sentences.map((sentence, idx) => (
          <View key={idx} style={styles.descriptionBullet}>
            <Text style={styles.bullet}>"</Text>
            <Text style={styles.descriptionText}>{sentence.trim()}.</Text>
          </View>
        ))}
      </View>
    );
  }
  
  return (
    <View style={styles.descriptionBullet}>
      <Text style={styles.bullet}>"</Text>
      <Text style={styles.descriptionText}>{plainText}</Text>
    </View>
  );
}

export function TraditionalPdf({ data }: { data: ResumeData }) {
  const skillsArr = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const contactParts = [
    data.location,
    data.phone,
    data.email,
    data.linkedin ? data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "") : null
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.fullName && <Text style={styles.name}>{data.fullName}</Text>}
          
          {/* Contact Info */}
          {contactParts.length > 0 && (
            <View style={styles.contactInfo}>
              {contactParts.map((part, idx) => (
                <View key={idx} style={{ flexDirection: "row" }}>
                  <Text style={styles.contactItem}>{part}</Text>
                  {idx < contactParts.length - 1 && (
                    <Text style={styles.contactSeparator}>"</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Education Section */}
        {data.education.some((e) => e.institution || e.degree || e.field) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education
              .filter((ed) => ed.institution || ed.degree || ed.field)
              .map((ed, idx) => (
                <View key={idx} style={styles.educationContainer}>
                  <View style={styles.educationHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.educationInstitution}>
                        {ed.institution}{ed.location ? `, ${ed.location}` : ""}
                      </Text>
                      {(ed.degree || ed.field) && (
                        <Text style={styles.educationDetails}>
                          {ed.degree}{ed.degree && ed.field ? " in " : ""}{ed.field}
                          {ed.gpa && ed.degree ? ` (${ed.gpa_type === "percentage" ? `${ed.gpa}%` : `GPA: ${ed.gpa}${ed.gpa_scale ? `/${ed.gpa_scale}` : ""}`})` : ""}
                        </Text>
                      )}
                    </View>
                    {ed.graduation_date && (
                      <Text style={styles.educationDate}>{ed.graduation_date}</Text>
                    )}
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Skills Section */}
        {skillsArr.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsGrid}>
              {skillsArr.map((skill, idx) => (
                <View key={idx} style={styles.skillItem}>
                  <Text style={styles.bullet}>"</Text>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Professional Experience Section */}
        {data.experience.some((e) => e.company || e.position) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.experience
              .filter((exp) => exp.company || exp.position)
              .map((exp, idx) => (
                <View key={idx} style={styles.experienceContainer}>
                  <View style={styles.experienceHeader}>
                    <View style={styles.experienceLeft}>
                      <Text style={styles.experienceTitle}>{exp.position}</Text>
                      <Text style={styles.experienceCompany}>
                        {exp.company}{exp.location ? `, ${exp.location}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.experienceDate}>
                      {exp.start_date ? `${exp.start_date}  ` : ""}
                      {exp.is_current ? "Present" : exp.end_date || ""}
                    </Text>
                  </View>
                  {stripHtml(exp.description) && (
                    <View style={styles.experienceDescription}>
                      <RenderBulletPoints html={exp.description || ""} />
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Projects Section */}
        {data.projects.some((p) => p.project_name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects
              .filter((pr) => pr.project_name)
              .map((pr, idx) => (
                <View key={idx} style={styles.projectContainer}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{pr.project_name}</Text>
                    {pr.date && <Text style={styles.projectDate}>{pr.date}</Text>}
                  </View>
                  {stripHtml(pr.description) && (
                    <View style={styles.projectDescription}>
                      <RenderBulletPoints html={pr.description || ""} />
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Certifications Section */}
        {data.certifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.listContainer}>
              {data.certifications.split(",").map((cert, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bullet}>"</Text>
                  <Text style={styles.skillText}>{cert.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages Section */}
        {data.languages && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.listContainer}>
              {data.languages.split(",").map((lang, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bullet}>"</Text>
                  <Text style={styles.skillText}>{lang.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default TraditionalPdf;
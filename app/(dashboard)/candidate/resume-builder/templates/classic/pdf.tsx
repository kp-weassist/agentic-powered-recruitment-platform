import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "../../_components/resume-form";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#0f172a" },
  header: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 8 },
  name: { fontSize: 22, fontWeight: 800 },
  meta: { fontSize: 10, color: "#64748b" },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#ffffff", backgroundColor: "#1f2937", paddingVertical: 4, paddingHorizontal: 8, alignSelf: "flex-start", marginTop: 12, borderRadius: 4 },
  row: { flexDirection: "row", gap: 16, marginTop: 8 },
  col2: { flex: 2 },
  col1: { flex: 1 },
  paragraph: { marginTop: 6, lineHeight: 1.5, color: "#334155" },
  small: { fontSize: 10, color: "#64748b" },
  bullet: { marginTop: 4, lineHeight: 1.5, color: "#334155" },
});

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function renderInline(html: string): any[] {
  // very small inline parser for <b>/<strong> and <i>/<em>, + <br>
  let remaining = html.replace(/\n/g, " ").replace(/<br\s*\/>/gi, "\n");
  const out: any[] = [];
  const regex = /<(strong|b|em|i)>([\s\S]*?)<\/\1>/i;
  while (true) {
    const m = remaining.match(regex);
    if (!m || m.index === undefined) break;
    const before = remaining.slice(0, m.index);
    if (stripHtml(before)) out.push(stripHtml(before));
    const tag = m[1].toLowerCase();
    const inner = stripHtml(m[2]);
    const style = tag === "strong" || tag === "b" ? { fontWeight: 700 } : { fontStyle: "italic" as const };
    out.push({ text: inner, style });
    remaining = remaining.slice(m.index + m[0].length);
  }
  if (stripHtml(remaining)) out.push(stripHtml(remaining));
  return out;
}

function RichParagraph({ html }: { html: string }) {
  const runs = renderInline(html);
  return (
    <Text style={styles.paragraph}>
      {runs.map((r, i) => (typeof r === "string" ? <Text key={i}>{r}</Text> : <Text key={i} style={r.style}>{r.text}</Text>))}
    </Text>
  );
}

function RichList({ html }: { html: string }) {
  const items = Array.from(html.matchAll(/<li[\s\S]*?>([\s\S]*?)<\/li>/gi)).map((m) => m[1]);
  if (items.length === 0) return <RichParagraph html={html} />;
  return (
    <View style={{ marginTop: 4 }}>
      {items.map((it, idx) => (
        <Text key={idx} style={styles.bullet}>• {stripHtml(it)}</Text>
      ))}
    </View>
  );
}

export function ClassicPdf({ data }: { data: ResumeData }) {
  const skillsArr = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName || "Your Name"}</Text>
          <Text style={styles.meta}>{data.location || ""}</Text>
        </View>

        {stripHtml(data.summary) && (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <RichParagraph html={data.summary} />
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.col2}>
            {data.experience.some((e) => e.company || e.position || e.start_date || e.end_date || stripHtml(e.description)) && (
              <>
                <Text style={styles.sectionTitle}>Experience</Text>
                {data.experience
                  .filter((exp) => exp.company || exp.position || exp.start_date || exp.end_date || stripHtml(exp.description))
                  .map((exp, idx) => (
                    <View key={idx} style={{ marginTop: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontWeight: 700 }}>{exp.position || ""}</Text>
                        <Text style={styles.small}>
                          {exp.start_date} {exp.end_date ? `- ${exp.end_date}` : exp.start_date ? "- Present" : ""}
                        </Text>
                      </View>
                      {exp.company ? <Text style={{ color: "#334155" }}>{exp.company}</Text> : null}
                      {stripHtml(exp.description) ? <RichList html={exp.description || ""} /> : null}
                    </View>
                  ))}
              </>
            )}
          </View>
          <View style={styles.col1}>
            {skillsArr.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={{ marginTop: 6 }}>
                  {skillsArr.map((skill, idx) => (
                    <Text key={idx}>• {skill}</Text>
                  ))}
                </View>
              </>
            )}
            {data.education.some((e) => e.institution || e.degree || e.field || e.graduation_date) && (
              <>
                <Text style={styles.sectionTitle}>Education</Text>
                <View style={{ marginTop: 6 }}>
                  {data.education
                    .filter((ed) => ed.institution || ed.degree || ed.field || ed.graduation_date)
                    .map((ed, idx) => (
                      <View key={idx} style={{ marginBottom: 6 }}>
                        {ed.institution ? <Text style={{ fontWeight: 700 }}>{ed.institution}</Text> : null}
                        {(ed.degree || ed.field) ? (
                          <Text>
                            {ed.degree}
                            {ed.degree && ed.field ? " — " : ""}
                            {ed.field}
                          </Text>
                        ) : null}
                        {ed.graduation_date ? <Text style={styles.small}>Graduated: {ed.graduation_date}</Text> : null}
                      </View>
                    ))}
                </View>
              </>
            )}
          </View>
        </View>

        {data.projects.some((p) => p.project_name || stripHtml(p.description)) && (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects
              .filter((pr) => pr.project_name || stripHtml(pr.description))
              .map((pr, idx) => (
                <View key={idx} style={{ marginTop: 6 }}>
                  {pr.project_name ? <Text style={{ fontWeight: 700 }}>{pr.project_name}</Text> : null}
                  {stripHtml(pr.description) ? <RichList html={pr.description || ""} /> : null}
                </View>
              ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export default ClassicPdf;



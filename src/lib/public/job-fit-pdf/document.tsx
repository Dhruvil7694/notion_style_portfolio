import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { JobFitPdfReportData } from "@/lib/public/job-fit-pdf/report-data"
import type { JobFitSkillRow } from "@/lib/public/parse-job-fit-result"

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#737373",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  score: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: 700,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#525252",
    marginBottom: 8,
  },
  body: {
    fontSize: 10,
    color: "#333333",
  },
  muted: {
    color: "#737373",
    fontSize: 9,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  cellRequirement: {
    width: "34%",
    padding: 8,
    fontSize: 9,
    fontWeight: 700,
  },
  cellDetail: {
    width: "66%",
    padding: 8,
    fontSize: 9,
    color: "#404040",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 8,
    fontSize: 8,
    color: "#a3a3a3",
  },
})

function SkillTable({
  title,
  rows,
  detailHeader,
}: {
  title: string
  rows: JobFitSkillRow[]
  detailHeader: string
}) {
  if (rows.length === 0) return null

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.cellRequirement}>Requirement</Text>
          <Text style={styles.cellDetail}>{detailHeader}</Text>
        </View>
        {rows.map((row) => (
          <View key={row.requirement} style={styles.tableRow}>
            <Text style={styles.cellRequirement}>{row.requirement}</Text>
            <Text style={styles.cellDetail}>{row.detail || "—"}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export function JobFitPdfDocument({ data }: { data: JobFitPdfReportData }) {
  const { analysis, seniority, ownerName, generatedAt } = data

  return (
    <Document
      author={ownerName}
      subject={`Job fit report — ${analysis.roleTitle}`}
      title={`Job Fit — ${analysis.roleTitle}`}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Portfolio job fit report</Text>
          <Text style={styles.title}>{analysis.roleTitle}</Text>
          <Text style={styles.score}>
            Overall fit score: {analysis.fitScoreLabel}
          </Text>
          <Text style={styles.muted}>
            Prepared for recruiters reviewing {ownerName}
          </Text>
        </View>

        {seniority ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seniority fit</Text>
            {seniority.roleLevel ? (
              <Text style={styles.body}>Role level: {seniority.roleLevel}</Text>
            ) : null}
            {seniority.profileLevel ? (
              <Text style={[styles.body, { marginTop: 4 }]}>
                {ownerName}&apos;s profile: {seniority.profileLevel}
              </Text>
            ) : null}
            {seniority.verdict ? (
              <Text style={[styles.body, { marginTop: 4 }]}>
                Verdict: {seniority.verdict}
              </Text>
            ) : null}
          </View>
        ) : null}

        {analysis.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.body}>{analysis.summary}</Text>
          </View>
        ) : null}

        <SkillTable
          detailHeader="Evidence"
          rows={analysis.strongMatches}
          title="Strong matches"
        />
        <SkillTable
          detailHeader="Notes"
          rows={analysis.partialMatches}
          title="Partial matches"
        />
        <SkillTable
          detailHeader="Context"
          rows={analysis.growthAreas}
          title="Growth areas"
        />

        <Text style={styles.footer} fixed>
          Generated {generatedAt} · {ownerName} portfolio assistant
        </Text>
      </Page>
    </Document>
  )
}

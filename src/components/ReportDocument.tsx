import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Standard fonts for IEEE-like layout
Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/timesnewroman/v11/q_7nJtB3L99P8q9L9L8P8q9.ttf' } // Just a placeholder, @react-pdf/renderer uses standard Times-Roman automatically when specified as standard font
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontFamily: 'Times-Roman',
  },
  author: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  department: {
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 15,
    marginBottom: 8,
  },
  abstractHeader: {
    fontSize: 9,
    fontFamily: 'Times-Roman',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  abstractText: {
    fontSize: 9,
    fontFamily: 'Times-Roman',
    fontStyle: 'italic',
    textAlign: 'justify',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 10,
    textAlign: 'justify',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
  },
  imageContainer: {
    marginTop: 10,
    marginBottom: 5,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    marginBottom: 5,
  },
  figureCaption: {
    fontSize: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});

interface ReportDocumentProps {
  experimentName: string;
  authorName: string;
  abstract: string;
  indexTerms: string;
  theory: string;
  conclusion: string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  graphs: { title: string, dataUrl: string }[];
}

export const ReportDocument = ({
  experimentName,
  authorName,
  abstract,
  indexTerms,
  theory,
  conclusion,
  inputData,
  outputData,
  graphs
}: ReportDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{experimentName}</Text>
        <Text style={styles.author}>{authorName}</Text>
        <Text style={styles.department}>Department of Electrical and Electronic Engineering</Text>
      </View>

      {/* Two Column Layout */}
      <View style={styles.twoColumn}>
        {/* Left Column */}
        <View style={styles.column}>
          <Text style={styles.abstractText}>
            <Text style={styles.abstractHeader}>Abstract—</Text>
            {abstract}
          </Text>

          <Text style={styles.abstractText}>
            <Text style={styles.abstractHeader}>Index Terms—</Text>
            {indexTerms}
          </Text>

          <Text style={styles.sectionTitle}>I. Introduction</Text>
          <Text style={styles.paragraph}>{theory}</Text>

          <Text style={styles.sectionTitle}>II. Methodology & Parameters</Text>
          <Text style={styles.paragraph}>The following parameters were utilized in the simulation to model the system characteristics:</Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Parameter</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Value</Text></View>
            </View>
            {Object.entries(inputData).map(([key, value], idx) => (
              <View style={styles.tableRow} key={idx}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{key}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text></View>
              </View>
            ))}
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>III. Results & Analysis</Text>
          <Text style={styles.paragraph}>The simulation yielded the following calculated outputs:</Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Output Metric</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Value</Text></View>
            </View>
            {Object.entries(outputData).map(([key, value], idx) => (
              <View style={styles.tableRow} key={idx}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{key}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{typeof value === 'object' ? JSON.stringify(value).substring(0,30) + '...' : String(value)}</Text></View>
              </View>
            ))}
          </View>

          {graphs.map((g, idx) => (
            <View key={idx} style={styles.imageContainer}>
              <Image src={g.dataUrl} style={styles.image} />
              <Text style={styles.figureCaption}>Fig. {idx + 1}. {g.title}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>IV. Conclusion</Text>
          <Text style={styles.paragraph}>{conclusion}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

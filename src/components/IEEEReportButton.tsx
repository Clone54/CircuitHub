import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileText, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { ReportDocument } from './ReportDocument';

interface IEEEReportButtonProps {
  experimentName: string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  chartSelectors?: string[]; // CSS selectors for the charts to capture
  authorName?: string;
}

export function IEEEReportButton({ 
  experimentName, 
  inputData, 
  outputData, 
  chartSelectors = [],
  authorName = "Student Engineer" 
}: IEEEReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const captureGraphs = async () => {
    const graphs: { title: string, dataUrl: string }[] = [];
    
    for (let i = 0; i < chartSelectors.length; i++) {
      const element = document.querySelector(chartSelectors[i]) as HTMLElement;
      if (element) {
        try {
          const dataUrl = await toPng(element, { 
            pixelRatio: 2, // Higher resolution
            backgroundColor: '#ffffff' // Ensure white background for PDF
          });
          graphs.push({
            title: `Simulation Waveform ${i + 1}`,
            dataUrl
          });
        } catch (err) {
          console.error("Failed to capture chart", err);
        }
      }
    }
    return graphs;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Capture graphs from UI
      const graphs = await captureGraphs();

      // 2. Fetch AI-generated report text
      const response = await fetch('/api/generate-report-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentName, inputData, outputData }),
      });

      if (!response.ok) throw new Error('Failed to generate report text');
      const aiContent = await response.json();

      // 3. Generate PDF Document
      const doc = <ReportDocument 
        experimentName={experimentName}
        authorName={authorName}
        abstract={aiContent.abstract || "Abstract generation failed."}
        indexTerms={aiContent.index_terms || "Simulation, IEEE, Report"}
        theory={aiContent.theory || "Theory generation failed."}
        conclusion={aiContent.conclusion || "Conclusion generation failed."}
        inputData={inputData}
        outputData={outputData}
        graphs={graphs}
      />;

      const blob = await pdf(doc).toBlob();

      // 4. Trigger Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IEEE_Report_${experimentName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating IEEE report:", error);
      alert("Failed to generate IEEE Report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border shadow-lg ${
        isGenerating 
          ? 'bg-navy-light border-navy-light/50 text-slate-400 cursor-not-allowed'
          : 'bg-emerald-accent/10 border-emerald-accent text-emerald-accent hover:bg-emerald-accent hover:text-navy-dark cursor-pointer'
      }`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          AI is drafting your IEEE report...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Generate IEEE Report
        </>
      )}
    </button>
  );
}

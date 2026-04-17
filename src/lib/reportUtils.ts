import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatCurrency } from './utils';

export interface ReportData {
  userName: string;
  month: Date;
  summary: {
    income: number;
    expense: number;
    savings: number;
    healthScore: number;
  };
  categories: { name: string, value: number, color: string }[];
  goals: { name: string, target: number, current: number, progress: number }[];
  insights: { title: string, desc: string }[];
}

// Helper for "Save As" functionality to allow saving directly to Desktop
export const saveFileAsync = async (blob: Blob, suggestedName: string, mimeType: string) => {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const extension = suggestedName.split('.').pop() || '';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{
          description: `${extension.toUpperCase()} File`,
          accept: { [mimeType]: [`.${extension}`] }
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return true; // User cancelled, don't show error
    }
  }

  // Fallback: Standard Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', suggestedName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

export const generateMonthlyReport = async (data: ReportData) => {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600
  const monthStr = format(data.month, 'MMMM yyyy');

  // --- Page 1: Executive Summary ---
  
  // Header Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('StudentFin', 14, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Monthly Financial Statement - ${monthStr}`, 14, 28);
  
  // User Info
  doc.setFontSize(10);
  doc.text(`Account Holder: ${data.userName || 'Student'}`, 140, 20);
  doc.text(`Report Date: ${format(new Date(), 'PPP')}`, 140, 26);

  // Section: Summary Cards (Simulated with Rects)
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, 55);

  const startY = 65;
  const colWidth = 60;

  // Income Card
  doc.setDrawColor(240);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, startY, colWidth - 5, 30, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('TOTAL INCOME', 19, startY + 8);
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatCurrency(data.summary.income), 19, startY + 20);

  // Expense Card
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14 + colWidth, startY, colWidth - 5, 30, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('TOTAL EXPENSE', 14 + colWidth + 5, startY + 8);
  doc.setFontSize(14);
  doc.setTextColor(244, 63, 94); // Rose
  doc.text(formatCurrency(data.summary.expense), 14 + colWidth + 5, startY + 20);

  // Health Score Card
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(14 + colWidth * 2, startY, colWidth - 5, 30, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('HEALTH SCORE', 14 + colWidth * 2 + 5, startY + 8);
  doc.setFontSize(14);
  doc.text(`${data.summary.healthScore}/100`, 14 + colWidth * 2 + 5, startY + 20);

  // Section: Category Breakdown Table
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Spending by Category', 14, 110);

  autoTable(doc, {
    startY: 115,
    head: [['Category', 'Amount Spent', '% of Total']],
    body: data.categories.map(c => [
      c.name,
      formatCurrency(c.value),
      `${((c.value / (data.summary.expense || 1)) * 100).toFixed(1)}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: primaryColor }
  });

  // --- Page 2: Insights & Goals ---
  doc.addPage();
  
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Insights & Strategic Goals', 14, 10);

  // Section: AI Insights
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Finny's Strategic Advice", 14, 30);

  let currentY = 40;
  data.insights.forEach(insight => {
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, currentY, 180, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(insight.title, 19, currentY + 8);
    doc.setFontSize(9);
    doc.setTextColor(100);
    // Wrap text manually for jspdf
    const lines = doc.splitTextToSize(insight.desc, 170);
    doc.text(lines, 19, currentY + 15);
    currentY += 30;
  });

  // Section: Goals
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Active Savings Goals', 14, currentY + 10);

  autoTable(doc, {
    startY: currentY + 15,
    head: [['Goal Name', 'Target', 'Progress']],
    body: data.goals.map(g => [
      g.name,
      formatCurrency(g.target),
      `${g.progress.toFixed(1)}% (${formatCurrency(g.current)})`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [100, 116, 139] } // Gray-500
  });

  // Footer on each page (Optional but good)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Generated by StudentFin AI Intelligence', 14, 285);
  }

  const pdfBlob = doc.output('blob');
  await saveFileAsync(pdfBlob, `StudentFin_Monthly_Report_${format(data.month, 'MMM_yyyy')}.pdf`, 'application/pdf');
};

export const exportToJSON = async (data: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  await saveFileAsync(blob, `${fileName}.json`, 'application/json');
};

export const exportToCSV = async (headers: string[], rows: any[][], fileName: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  await saveFileAsync(blob, `${fileName}.csv`, 'text/csv');
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Brand colors (RGB, since jsPDF doesn't read CSS variables)
const YELLOW = [245, 197, 24];
const BLACK = [10, 10, 10];
const GREY = [110, 110, 110];
const DARK_GREY = [40, 40, 40];

/**
 * Generates and downloads a lab-manual-style PDF for one experiment.
 *
 * @param {Object} opts
 * @param {string} opts.title            e.g. "Slump Test"
 * @param {string} opts.code             e.g. "IS 1199"
 * @param {string} opts.studentName      optional, defaults to "Student"
 * @param {string} opts.aim              one-paragraph aim of the experiment
 * @param {string[]} opts.procedure      ordered list of procedure steps
 * @param {{label:string, value:string}[]} opts.inputsSummary   what the student set
 * @param {{label:string, value:string}[]} opts.resultsSummary  computed results
 * @param {string[]} [opts.tableColumns] observation table headers
 * @param {Array<Array<string|number>>} [opts.tableRows]        observation table rows
 * @param {{score:number, total:number}|null} [opts.vivaScore]  AI viva score, if taken
 */
export function generateLabManual(opts) {
  const {
    title, code, studentName, aim, procedure = [],
    inputsSummary = [], resultsSummary = [],
    tableColumns, tableRows, vivaScore,
  } = opts;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 0;

  // ---- header band ----
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, pageWidth, 84, 'F');
  doc.setFillColor(...YELLOW);
  doc.rect(0, 80, pageWidth, 4, 'F');

  doc.setTextColor(...YELLOW);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('LabSim', margin, 36);

  doc.setTextColor(230, 230, 230);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text('VIRTUAL CIVIL ENGINEERING LAB — MANUAL & REPORT', margin, 52);

  doc.setTextColor(...YELLOW);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text(code, pageWidth - margin, 36, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), pageWidth - margin, 52, { align: 'right' });

  y = 112;

  // ---- title + student ----
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Student: ${studentName || 'Student'}`, margin, y);
  y += 22;

  // ---- aim ----
  if (aim) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text('Aim', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK_GREY);
    const aimLines = doc.splitTextToSize(aim, pageWidth - margin * 2);
    doc.text(aimLines, margin, y);
    y += aimLines.length * 13 + 12;
  }

  // ---- procedure ----
  if (procedure.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text('Procedure', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK_GREY);
    procedure.forEach((step, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 13 + 4;
    });
    y += 8;
  }

  // ---- inputs / results as two-column key-value blocks ----
  function keyValueBlock(heading, rows) {
    if (!rows.length) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text(heading, margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { font: 'courier', fontSize: 9.5, cellPadding: 3, textColor: DARK_GREY },
      columnStyles: { 0: { fontStyle: 'bold', textColor: BLACK, cellWidth: 200 } },
      body: rows.map(r => [r.label, r.value]),
    });
    y = doc.lastAutoTable.finalY + 16;
  }

  keyValueBlock('Inputs', inputsSummary);
  keyValueBlock('Results', resultsSummary);

  // ---- observation table ----
  if (tableColumns && tableRows && tableRows.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text('Observation Table', margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [tableColumns],
      body: tableRows,
      styles: { font: 'courier', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: BLACK, textColor: YELLOW, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 240] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ---- viva score ----
  if (vivaScore) {
    if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text('AI Viva Result', margin, y);
    y += 16;
    doc.setFillColor(...YELLOW);
    doc.roundedRect(margin, y - 12, 90, 26, 4, 4, 'F');
    doc.setTextColor(...BLACK);
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.text(`${vivaScore.score}/${vivaScore.total}`, margin + 45, y + 5, { align: 'center' });
    y += 30;
  }

  // ---- footer ----
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const h = doc.internal.pageSize.getHeight();
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text('LabSim — github.com/harxhpatell/LabSim', margin, h - 24);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, h - 24, { align: 'right' });
  }

  doc.save(`${title.replace(/\s+/g, '_')}_Lab_Manual.pdf`);
}

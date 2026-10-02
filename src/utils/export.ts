import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Observation } from '../types';

export const exportObservationsToExcel = (observations: Observation[], filename = 'instant_erp_observations.xlsx') => {
  const data = observations.map((obs) => ({
    'Observation Code': obs.observationCode,
    'Instructor': obs.instructor?.user?.name || 'N/A',
    'Employee ID': obs.instructor?.employeeId || 'N/A',
    'Track': obs.track?.name || 'N/A',
    'Group': obs.group?.name || 'N/A',
    'Observer': obs.observer?.name || 'N/A',
    'Observation Date': new Date(obs.observationDate).toLocaleDateString(),
    'Type': obs.type,
    'Total Score (out of 10)': obs.totalScore,
    'Weighted Score (%)': obs.weightedScore,
    'Grade': obs.grade || 'N/A',
    'Status': obs.status,
    'Strengths': obs.feedback?.strengths || '',
    'Areas for Improvement': obs.feedback?.areasForImprovement || '',
    'Recommendations': obs.feedback?.recommendations || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Observations');
  XLSX.writeFile(workbook, filename);
};

export const exportObservationsToPDF = (observations: Observation[], title = 'Instant ERP - Observation Records Report') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${observations.length}`, 40, 56);

  const tableData = observations.map((obs) => [
    obs.observationCode,
    obs.instructor?.user?.name || 'N/A',
    obs.track?.name || 'N/A',
    obs.group?.name || 'N/A',
    obs.observer?.name || 'N/A',
    new Date(obs.observationDate).toLocaleDateString(),
    obs.type === 'TECHNICAL' ? 'Tech' : 'Non-Tech',
    `${obs.totalScore} / 10`,
    obs.grade || 'N/A',
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['Code', 'Instructor', 'Track', 'Group', 'Observer', 'Date', 'Type', 'Score', 'Grade']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { overflow: 'linebreak', cellPadding: 5 },
  });

  doc.save('instant_erp_observations_report.pdf');
};

export const exportSingleObservationPDF = (obs: Observation) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Header Banner
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 595, 75, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('INSTANT ERP | OBSERVATION AUDIT REPORT', 40, 38);

  doc.setFontSize(10);
  doc.text(`Official Evaluation Code: ${obs.observationCode}`, 40, 55);

  // Meta Info
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);

  let y = 105;
  const leftX = 40;
  const rightX = 320;

  doc.setFont('helvetica', 'bold');
  doc.text('Instructor:', leftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(obs.instructor?.user?.name || 'N/A', leftX + 70, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Observation Date:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(obs.observationDate).toLocaleDateString(), rightX + 110, y);

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Track:', leftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(obs.track?.name || 'N/A', leftX + 70, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Evaluator / Observer:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(obs.observer?.name || 'N/A', rightX + 110, y);

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Cohort Group:', leftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(obs.group?.name || 'N/A', leftX + 70, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Overall Score:', rightX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(`${obs.totalScore}/10 (${obs.weightedScore}%) - ${obs.grade}`, rightX + 110, y);
  doc.setTextColor(30, 41, 59);

  // Criteria Table
  y += 35;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Rubric Criteria Evaluation', 40, y);

  const criteriaRows = (obs.scores || []).map((s) => [
    s.criterionName,
    `${s.weight}%`,
    `${s.score} / 10`,
    `${s.weightedScore} pts`,
    s.feedback || 'Satisfactory execution',
  ]);

  autoTable(doc, {
    startY: y + 10,
    head: [['Criterion Name', 'Weight', 'Score', 'Weighted Score', 'Feedback']],
    body: criteriaRows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 70 },
      4: { cellWidth: 220 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 350;

  // Feedback narrative
  let fy = finalY + 25;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Structured Qualitative Feedback', 40, fy);

  fy += 18;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Strengths:', 40, fy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(obs.feedback?.strengths || 'No specific strengths recorded.', 510), 40, fy + 14);

  fy += 45;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('Areas for Improvement:', 40, fy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(obs.feedback?.areasForImprovement || 'None noted.', 510), 40, fy + 14);

  fy += 45;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('Recommendations & Next Steps:', 40, fy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(obs.feedback?.recommendations || 'Continue standard instructional pacing.', 510), 40, fy + 14);

  doc.save(`${obs.observationCode}_Audit_Report.pdf`);
};

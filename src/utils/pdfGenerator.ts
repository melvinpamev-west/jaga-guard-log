import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type Report = Database["public"]["Tables"]["reports"]["Row"];

export const generateReportPDF = (report: Report) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(21, 50, 89); // Primary color
  doc.text("LAPORAN JAGA", 105, 20, { align: "center" });
  
  // Line separator
  doc.setDrawColor(21, 50, 89);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Report details
  const reportDate = format(new Date(report.report_date), "dd MMMM yyyy", { locale: id });
  
  autoTable(doc, {
    startY: 35,
    head: [['Field', 'Detail']],
    body: [
      ['Judul', report.title],
      ['Tanggal', reportDate],
      ['Jam', report.report_time],
      ['Deskripsi', report.description || '-'],
      ['Media', report.media_type ? `${report.media_type} (terlampir)` : 'Tidak ada'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [21, 50, 89],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 120 },
    },
    styles: {
      fontSize: 11,
      cellPadding: 5,
    },
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`,
      105,
      280,
      { align: "center" }
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: "center" });
  }
  
  // Save PDF
  const fileName = `Laporan_${report.title.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(report.report_date), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};

export const generateMultipleReportsPDF = (reports: Report[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(21, 50, 89);
  doc.text("RINGKASAN LAPORAN JAGA", 105, 20, { align: "center" });
  
  // Line separator
  doc.setDrawColor(21, 50, 89);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Summary info
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Laporan: ${reports.length}`, 20, 35);
  doc.text(`Periode: ${format(new Date(reports[reports.length - 1]?.report_date || new Date()), "dd MMM yyyy", { locale: id })} - ${format(new Date(reports[0]?.report_date || new Date()), "dd MMM yyyy", { locale: id })}`, 20, 42);
  
  // Table of reports
  const tableData = reports.map((report) => [
    format(new Date(report.report_date), "dd/MM/yyyy", { locale: id }),
    report.report_time,
    report.title,
    report.description?.substring(0, 50) + (report.description && report.description.length > 50 ? '...' : '') || '-',
  ]);
  
  autoTable(doc, {
    startY: 50,
    head: [['Tanggal', 'Jam', 'Judul', 'Deskripsi']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [21, 50, 89],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 22 },
      2: { cellWidth: 50 },
      3: { cellWidth: 80 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`,
      105,
      280,
      { align: "center" }
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: "center" });
  }
  
  // Save PDF
  const fileName = `Ringkasan_Laporan_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  doc.save(fileName);
};

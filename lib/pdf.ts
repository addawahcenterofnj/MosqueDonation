import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Campaign } from '@/types/campaign';
import { Donation } from '@/types/donation';
import { MonthlyReport } from '@/types/monthly-report';
import { formatCurrency, formatDate } from './utils';

export function generateCampaignPDF(campaign: Campaign, donations: Donation[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(31, 78, 47); // dark green
  doc.text('Mosque Donation Tracker', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(campaign.name, pageWidth / 2, 32, { align: 'center' });

  // Campaign details
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  let y = 44;

  if (campaign.description) {
    const lines = doc.splitTextToSize(campaign.description, pageWidth - 40);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 4;
  }

  if (campaign.start_date || campaign.end_date) {
    const range = [
      campaign.start_date ? `From: ${formatDate(campaign.start_date)}` : '',
      campaign.end_date ? `To: ${formatDate(campaign.end_date)}` : '',
    ]
      .filter(Boolean)
      .join('   ');
    doc.text(range, 20, y);
    y += 8;
  }

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  doc.setFontSize(13);
  doc.setTextColor(31, 78, 47);
  doc.text(`Total Collected: ${formatCurrency(total)}`, 20, y + 2);
  y += 12;

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Donations: ${donations.length}`, 20, y);
  y += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Table
  autoTable(doc, {
    startY: y,
    head: [['Donor Name', 'Phone Number', 'Amount', 'Date']],
    body: donations.map((d) => [
      d.donor_name,
      d.donor_phone || '—',
      formatCurrency(Number(d.amount)),
      formatDate(d.donation_date),
    ]),
    headStyles: {
      fillColor: [31, 78, 47],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 250, 247] },
    styles: { fontSize: 10 },
    margin: { left: 20, right: 20 },
  });

  // Footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const fileName = `${campaign.name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`;
  doc.save(fileName);
}

export function generateMonthlyReportPDF(reports: MonthlyReport[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(6, 78, 59); // #064e3b
  doc.text('Mosque Donation Tracker', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Monthly Live Report', pageWidth / 2, 32, { align: 'center' });

  // Summary
  const totalAmount = reports.reduce((sum, r) => sum + Number(r.amount), 0);
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Entries: ${reports.length}`, 20, 44);
  doc.setFontSize(13);
  doc.setTextColor(6, 78, 59);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 53);

  // Separator
  doc.setDrawColor(167, 243, 208); // #a7f3d0
  doc.line(20, 60, pageWidth - 20, 60);

  // Table
  autoTable(doc, {
    startY: 67,
    head: [['Month', 'Amount', 'Notes']],
    body: reports.map((r) => [
      r.month,
      formatCurrency(Number(r.amount)),
      r.notes || '—',
    ]),
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      1: { halign: 'right' },
    },
    styles: { fontSize: 10 },
    margin: { left: 20, right: 20 },
  });

  // Footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save('monthly-live-report.pdf');
}

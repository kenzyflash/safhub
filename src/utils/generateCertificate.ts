import jsPDF from 'jspdf';

interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  instructorName: string;
}

export const generateCertificate = (data: CertificateData) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(245, 248, 250);
  doc.rect(0, 0, width, height, 'F');

  // Border
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(1);
  doc.rect(14, 14, width - 28, height - 28);

  // Header ornament
  doc.setFillColor(16, 185, 129);
  doc.rect(width / 2 - 40, 10, 80, 4, 'F');

  // Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128);
  doc.text('CERTIFICATE OF COMPLETION', width / 2, 40, { align: 'center' });

  // EdHub branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(16, 185, 129);
  doc.text('EdHub', width / 2, 55, { align: 'center' });

  // Divider
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 50, 62, width / 2 + 50, 62);

  // "This certifies that"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text('This is to certify that', width / 2, 78, { align: 'center' });

  // Student name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(31, 41, 55);
  doc.text(data.studentName, width / 2, 93, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(data.studentName);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - nameWidth / 2 - 5, 96, width / 2 + nameWidth / 2 + 5, 96);

  // "has successfully completed"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text('has successfully completed the course', width / 2, 110, { align: 'center' });

  // Course title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text(data.courseTitle, width / 2, 125, { align: 'center' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`Completed on ${data.completionDate}`, width / 2, 140, { align: 'center' });

  // Instructor signature area
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 40, 165, width / 2 + 40, 165);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(data.instructorName, width / 2, 172, { align: 'center' });
  doc.text('Instructor', width / 2, 178, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('EdHub - Empowering Ethiopian Education', width / 2, height - 18, { align: 'center' });

  // Download
  const fileName = `EdHub-Certificate-${data.courseTitle.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

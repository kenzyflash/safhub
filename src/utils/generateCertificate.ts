import jsPDF from 'jspdf';

export type CertificateStyle = 'classic' | 'modern' | 'elegant';

interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  instructorName: string;
  style?: CertificateStyle;
}

const drawClassicCertificate = (doc: jsPDF, data: CertificateData, width: number, height: number) => {
  // Background
  doc.setFillColor(245, 248, 250);
  doc.rect(0, 0, width, height, 'F');

  // Border - sky blue theme
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(1);
  doc.rect(14, 14, width - 28, height - 28);

  // Header ornament
  doc.setFillColor(14, 165, 233);
  doc.rect(width / 2 - 40, 10, 80, 4, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128);
  doc.text('CERTIFICATE OF COMPLETION', width / 2, 40, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(14, 165, 233);
  doc.text('EdHub', width / 2, 55, { align: 'center' });

  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 50, 62, width / 2 + 50, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text('This is to certify that', width / 2, 78, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(31, 41, 55);
  doc.text(data.studentName, width / 2, 93, { align: 'center' });

  const nameWidth = doc.getTextWidth(data.studentName);
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - nameWidth / 2 - 5, 96, width / 2 + nameWidth / 2 + 5, 96);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text('has successfully completed the course', width / 2, 110, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text(data.courseTitle, width / 2, 125, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`Completed on ${data.completionDate}`, width / 2, 140, { align: 'center' });

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 40, 165, width / 2 + 40, 165);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(data.instructorName, width / 2, 172, { align: 'center' });
  doc.text('Instructor', width / 2, 178, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('EdHub - Empowering Ethiopian Education', width / 2, height - 18, { align: 'center' });
};

const drawModernCertificate = (doc: jsPDF, data: CertificateData, width: number, height: number) => {
  // Dark header section
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, width, 70, 'F');

  // Accent stripe
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 68, width, 4, 'F');

  // White body
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 72, width, height - 72, 'F');

  // Title in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICATE', width / 2, 35, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text('OF COMPLETION', width / 2, 50, { align: 'center' });

  // EdHub logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(14, 165, 233);
  doc.text('EdHub', 20, 30);

  // Body content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('This certifies that', width / 2, 95, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text(data.studentName, width / 2, 115, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('has successfully completed', width / 2, 132, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(14, 165, 233);
  doc.text(data.courseTitle, width / 2, 148, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${data.completionDate}  |  Instructor: ${data.instructorName}`, width / 2, 165, { align: 'center' });

  // Bottom bar
  doc.setFillColor(14, 165, 233);
  doc.rect(0, height - 12, width, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('EdHub - Empowering Ethiopian Education', width / 2, height - 5, { align: 'center' });
};

const drawElegantCertificate = (doc: jsPDF, data: CertificateData, width: number, height: number) => {
  // Warm ivory background
  doc.setFillColor(254, 252, 247);
  doc.rect(0, 0, width, height, 'F');

  // Gold border
  doc.setDrawColor(180, 140, 60);
  doc.setLineWidth(2);
  doc.rect(12, 12, width - 24, height - 24);
  doc.setLineWidth(0.5);
  doc.rect(16, 16, width - 32, height - 32);

  // Corner ornaments (simple squares)
  const cornerSize = 8;
  doc.setFillColor(180, 140, 60);
  doc.rect(12, 12, cornerSize, cornerSize, 'F');
  doc.rect(width - 12 - cornerSize, 12, cornerSize, cornerSize, 'F');
  doc.rect(12, height - 12 - cornerSize, cornerSize, cornerSize, 'F');
  doc.rect(width - 12 - cornerSize, height - 12 - cornerSize, cornerSize, cornerSize, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 140, 60);
  doc.text('~ CERTIFICATE OF COMPLETION ~', width / 2, 38, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(60, 50, 30);
  doc.text('EdHub', width / 2, 55, { align: 'center' });

  // Decorative line
  doc.setDrawColor(180, 140, 60);
  doc.setLineWidth(0.3);
  doc.line(width / 2 - 60, 62, width / 2 + 60, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 100, 60);
  doc.text('Presented to', width / 2, 80, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(60, 50, 30);
  doc.text(data.studentName, width / 2, 98, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 100, 60);
  doc.text('for the successful completion of', width / 2, 115, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(60, 50, 30);
  doc.text(data.courseTitle, width / 2, 132, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 100, 60);
  doc.text(data.completionDate, width / 2, 148, { align: 'center' });

  // Signature line
  doc.setDrawColor(180, 140, 60);
  doc.line(width / 2 - 40, 170, width / 2 + 40, 170);
  doc.setFontSize(9);
  doc.text(data.instructorName, width / 2, 177, { align: 'center' });
  doc.text('Instructor', width / 2, 183, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(180, 140, 60);
  doc.text('EdHub - Empowering Ethiopian Education', width / 2, height - 20, { align: 'center' });
};

export const generateCertificate = (data: CertificateData) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const style = data.style || 'classic';

  switch (style) {
    case 'modern':
      drawModernCertificate(doc, data, width, height);
      break;
    case 'elegant':
      drawElegantCertificate(doc, data, width, height);
      break;
    default:
      drawClassicCertificate(doc, data, width, height);
  }

  const fileName = `EdHub-Certificate-${data.courseTitle.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

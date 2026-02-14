import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientType?: string;
  saltType: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalAmount: number;
  paymentStatus: string;
  notes?: string;
}

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  ninea?: string;
  rccm?: string;
  managerName?: string;
}

export const generateInvoicePdf = (invoice: InvoiceData, company: CompanyInfo) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === HEADER ===
  doc.setFillColor(0, 77, 77);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(company.name || "Entreprise", 15, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let headerY = 28;
  if (company.address) { doc.text(company.address, 15, headerY); headerY += 5; }
  if (company.phone) { doc.text(`Tél: ${company.phone}`, 15, headerY); headerY += 5; }
  if (company.email) { doc.text(`Email: ${company.email}`, 15, headerY); }

  // Right side - NINEA / RCCM
  let rightY = 28;
  if (company.ninea) { doc.text(`NINEA: ${company.ninea}`, pageWidth - 15, rightY, { align: "right" }); rightY += 5; }
  if (company.rccm) { doc.text(`RCCM: ${company.rccm}`, pageWidth - 15, rightY, { align: "right" }); rightY += 5; }

  // === FACTURE TITLE ===
  doc.setTextColor(0, 77, 77);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", pageWidth - 15, 65, { align: "right" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`N° ${invoice.invoiceNumber}`, pageWidth - 15, 73, { align: "right" });
  doc.text(`Date: ${invoice.date}`, pageWidth - 15, 80, { align: "right" });

  // === CLIENT INFO ===
  doc.setFillColor(240, 245, 245);
  doc.roundedRect(15, 90, pageWidth - 30, 35, 3, 3, "F");

  doc.setTextColor(0, 77, 77);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURÉ À:", 20, 100);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text(invoice.clientName, 20, 108);
  let clientY = 114;
  if (invoice.clientAddress) { doc.setFontSize(9); doc.text(invoice.clientAddress, 20, clientY); clientY += 5; }
  if (invoice.clientPhone) { doc.setFontSize(9); doc.text(`Tél: ${invoice.clientPhone}`, 20, clientY); }

  const statusLabel = invoice.paymentStatus === "paid" ? "PAYÉE" : invoice.paymentStatus === "partial" ? "PARTIEL" : "EN ATTENTE";
  const statusColor: [number, number, number] = invoice.paymentStatus === "paid" ? [0, 150, 80] : invoice.paymentStatus === "partial" ? [200, 150, 0] : [200, 50, 50];
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...statusColor);
  doc.text(statusLabel, pageWidth - 20, 108, { align: "right" });

  // === TABLE ===
  autoTable(doc, {
    startY: 135,
    head: [["Description", "Quantité", "Prix unitaire", "Montant"]],
    body: [
      [
        `Sel - ${invoice.saltType}`,
        `${invoice.quantity.toLocaleString()} kg`,
        `${invoice.unitPrice.toLocaleString()} FCFA`,
        `${(invoice.quantity * invoice.unitPrice).toLocaleString()} FCFA`,
      ],
      ...(invoice.discount && invoice.discount > 0
        ? [["Remise", "", "", `-${invoice.discount.toLocaleString()} FCFA`]]
        : []),
    ],
    headStyles: {
      fillColor: [0, 77, 77],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      3: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 15, right: 15 },
  });

  // === TOTAL ===
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFillColor(0, 77, 77);
  doc.roundedRect(pageWidth - 95, finalY, 80, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL:", pageWidth - 90, finalY + 9);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`${invoice.totalAmount.toLocaleString()} FCFA`, pageWidth - 20, finalY + 14, { align: "right" });

  // === NOTES ===
  if (invoice.notes) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`Notes: ${invoice.notes}`, 15, finalY + 35);
  }

  // === FOOTER ===
  doc.setFillColor(0, 77, 77);
  doc.rect(0, pageHeight - 25, pageWidth, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const footerParts: string[] = [];
  if (company.name) footerParts.push(company.name);
  if (company.address) footerParts.push(company.address);
  if (company.phone) footerParts.push(`Tél: ${company.phone}`);
  doc.text(footerParts.join(" | "), pageWidth / 2, pageHeight - 15, { align: "center" });

  const legalParts: string[] = [];
  if (company.ninea) legalParts.push(`NINEA: ${company.ninea}`);
  if (company.rccm) legalParts.push(`RCCM: ${company.rccm}`);
  if (company.managerName) legalParts.push(`Gérant: ${company.managerName}`);
  if (legalParts.length > 0) {
    doc.text(legalParts.join(" | "), pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
};

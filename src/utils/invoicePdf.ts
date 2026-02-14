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
  logoUrl?: string;
  city?: string;
  capital?: string;
}

const GREEN = [100, 160, 60] as const;
const DARK = [50, 50, 50] as const;
const GRAY = [120, 120, 120] as const;

export const generateInvoicePdf = (invoice: InvoiceData, company: CompanyInfo) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============================
  // HEADER - Logo + Facture N°
  // ============================
  // Logo placeholder (top-left)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(company.name || "LOGO", 15, 20);

  // Facture N° (top-right, green)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text(`Facture N°`, pageWidth - 15, 20, { align: "right" });

  doc.setFontSize(14);
  doc.text(invoice.invoiceNumber, pageWidth - 15, 28, { align: "right" });

  // City + date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  const cityDate = company.city ? `${company.city}, le ${invoice.date}` : `Le ${invoice.date}`;
  doc.text(cityDate, pageWidth - 15, 36, { align: "right" });

  // ============================
  // COMPANY INFO (left side)
  // ============================
  let leftY = 45;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(company.name || "Mon entreprise", 15, leftY);
  leftY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  if (company.address) { doc.text(company.address, 15, leftY); leftY += 5; }
  if (company.phone) { doc.text(`Numéro de téléphone: ${company.phone}`, 15, leftY); leftY += 5; }
  if (company.email) { doc.text(`Email: ${company.email}`, 15, leftY); leftY += 5; }
  if (company.ninea) { doc.text(`NINEA: ${company.ninea}`, 15, leftY); leftY += 5; }
  if (company.rccm) { doc.text(`RCCM: ${company.rccm}`, 15, leftY); leftY += 5; }

  // ============================
  // CLIENT INFO (right side, boxed)
  // ============================
  const clientBoxX = 110;
  const clientBoxY = 45;
  const clientBoxW = pageWidth - clientBoxX - 15;
  const clientBoxH = 35;

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.rect(clientBoxX, clientBoxY, clientBoxW, clientBoxH);

  let clientY = clientBoxY + 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(invoice.clientName, clientBoxX + 5, clientY);
  clientY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  if (invoice.clientAddress) { doc.text(invoice.clientAddress, clientBoxX + 5, clientY); clientY += 5; }
  if (invoice.clientPhone) { doc.text(`Tél: ${invoice.clientPhone}`, clientBoxX + 5, clientY); clientY += 5; }
  if (invoice.clientEmail) { doc.text(`Email: ${invoice.clientEmail}`, clientBoxX + 5, clientY); }

  // ============================
  // TABLE
  // ============================
  const subtotal = invoice.quantity * invoice.unitPrice;
  const discount = invoice.discount || 0;

  autoTable(doc, {
    startY: 95,
    head: [["Description", "Prix unitaire", "Unité", "Quantité", "Montant HT"]],
    body: [
      [
        `Sel - ${invoice.saltType}`,
        `${invoice.unitPrice.toLocaleString("fr-FR")} FCFA`,
        "kg",
        `${invoice.quantity.toLocaleString("fr-FR")}`,
        `${subtotal.toLocaleString("fr-FR")} FCFA`,
      ],
      ...(discount > 0
        ? [["Remise", "", "", "", `-${discount.toLocaleString("fr-FR")} FCFA`]]
        : []),
    ],
    headStyles: {
      fillColor: [...GREEN],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [...DARK],
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 60 },
      4: { halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [245, 250, 240],
    },
    margin: { left: 15, right: 15 },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
  });

  const tableEndY = (doc as any).lastAutoTable.finalY + 8;

  // ============================
  // TOTALS (right-aligned)
  // ============================
  const totalsX = 130;
  const totalsValX = pageWidth - 18;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);

  let totalY = tableEndY;

  // Total HT
  doc.text("Total HT", totalsX, totalY);
  doc.text(`${subtotal.toLocaleString("fr-FR")} FCFA`, totalsValX, totalY, { align: "right" });
  totalY += 7;

  // Remise line
  if (discount > 0) {
    doc.text("Remise", totalsX, totalY);
    doc.text(`-${discount.toLocaleString("fr-FR")} FCFA`, totalsValX, totalY, { align: "right" });
    totalY += 7;
  }

  // Total TTC (bold, green background)
  doc.setFillColor(...GREEN);
  doc.roundedRect(totalsX - 3, totalY - 5, pageWidth - totalsX - 12, 10, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Total TTC", totalsX, totalY + 1);
  doc.text(`${invoice.totalAmount.toLocaleString("fr-FR")} FCFA`, totalsValX, totalY + 1, { align: "right" });

  // ============================
  // PAYMENT CONDITIONS (left) + SIGNATURE (right)
  // ============================
  const condY = totalY + 25;

  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Modalités et conditions de règlement :", 15, condY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const paymentText = invoice.paymentStatus === "paid"
    ? "Paiement effectué - Merci"
    : invoice.paymentStatus === "partial"
      ? "Paiement partiel reçu - Solde à régler"
      : "Paiement à réception de facture";
  doc.text(paymentText, 15, condY + 7);

  if (invoice.notes) {
    doc.text(`Notes: ${invoice.notes}`, 15, condY + 14);
  }

  // Signature box (right)
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Signature :", totalsX, condY);

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.3);
  doc.rect(totalsX, condY + 4, pageWidth - totalsX - 15, 25);

  // ============================
  // FOOTER
  // ============================
  const footerY = pageHeight - 15;

  // Green line separator
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1);
  doc.line(15, footerY - 8, pageWidth - 15, footerY - 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);

  const footerParts: string[] = [];
  if (company.name) footerParts.push(company.name);
  if (company.capital) footerParts.push(`au capital de ${company.capital}`);
  doc.text(footerParts.join(" – Société … "), pageWidth / 2, footerY - 2, { align: "center" });

  const legalParts: string[] = [];
  if (company.ninea) legalParts.push(`NINEA: ${company.ninea}`);
  if (company.rccm) legalParts.push(`RCCM: ${company.rccm}`);
  if (company.managerName) legalParts.push(`Gérant: ${company.managerName}`);
  if (legalParts.length > 0) {
    doc.text(legalParts.join(" | "), pageWidth / 2, footerY + 3, { align: "center" });
  }

  doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
};

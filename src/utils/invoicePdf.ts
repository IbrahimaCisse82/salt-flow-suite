import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InvoiceStyle } from "@/components/Settings/InvoiceTemplateSelector";

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

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

/** Fetch an image URL and return a base64 data URL, or null on failure */
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const resp = await fetch(url, { mode: "cors" });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/** Add company logo to the PDF at specified position */
const addLogo = (doc: jsPDF, logoBase64: string, x: number, y: number, maxH: number) => {
  try {
    const img = new Image();
    img.src = logoBase64;
    const ratio = img.width / img.height;
    const h = maxH;
    const w = h * ratio;
    doc.addImage(logoBase64, "PNG", x, y, Math.min(w, 40), h);
  } catch {
    // silently skip if image fails
  }
};

const paymentLabel = (status: string) =>
  status === "paid"
    ? "Paiement effectué - Merci"
    : status === "partial"
      ? "Paiement partiel reçu - Solde à régler"
      : "Paiement à réception de facture";

// ═══════════════════════════════════════
// CLASSIC – Traditional layout with boxed client
// ═══════════════════════════════════════
function renderClassic(doc: jsPDF, invoice: InvoiceData, company: CompanyInfo, logoBase64: string | null) {
  const PRIMARY: [number, number, number] = [100, 160, 60];
  const ACCENT: [number, number, number] = [74, 122, 46];
  const SECONDARY: [number, number, number] = [245, 250, 240];
  const DARK: [number, number, number] = [50, 50, 50];
  const GRAY: [number, number, number] = [120, 120, 120];
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Header with logo
  if (logoBase64) {
    addLogo(doc, logoBase64, 15, 12, 14);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text(company.name || "", 58, 20);
  } else {
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text(company.name || "Mon entreprise", 15, 20);
  }
  doc.setFontSize(22); doc.setTextColor(...PRIMARY);
  doc.text("Facture N°", pw - 15, 20, { align: "right" });
  doc.setFontSize(14);
  doc.text(invoice.invoiceNumber, pw - 15, 28, { align: "right" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  const cityDate = company.city ? `${company.city}, le ${invoice.date}` : `Le ${invoice.date}`;
  doc.text(cityDate, pw - 15, 36, { align: "right" });

  // Company info (left)
  let y = 45;
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
  doc.text(company.name || "Mon entreprise", 15, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  if (company.address) { doc.text(company.address, 15, y); y += 5; }
  if (company.phone) { doc.text(`Tél: ${company.phone}`, 15, y); y += 5; }
  if (company.email) { doc.text(`Email: ${company.email}`, 15, y); y += 5; }
  if (company.ninea) { doc.text(`NINEA: ${company.ninea}`, 15, y); y += 5; }
  if (company.rccm) { doc.text(`RCCM: ${company.rccm}`, 15, y); y += 5; }

  // Client box (right) – dynamic height
  const bx = 110, by = 45, bw = pw - bx - 15;
  const clientLines: string[] = [invoice.clientName];
  if (invoice.clientType) clientLines.push(`Type: ${invoice.clientType}`);
  if (invoice.clientAddress) clientLines.push(invoice.clientAddress);
  if (invoice.clientPhone) clientLines.push(`Tél: ${invoice.clientPhone}`);
  if (invoice.clientEmail) clientLines.push(`Email: ${invoice.clientEmail}`);
  const bh = Math.max(35, 8 + clientLines.length * 5 + 3);
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.5);
  doc.rect(bx, by, bw, bh);
  let cy = by + 8;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
  doc.text(clientLines[0], bx + 5, cy); cy += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  for (let i = 1; i < clientLines.length; i++) { doc.text(clientLines[i], bx + 5, cy); cy += 5; }

  // Table
  const subtotal = invoice.quantity * invoice.unitPrice;
  const discount = invoice.discount || 0;
  autoTable(doc, {
    startY: 95,
    head: [["Description", "Prix unitaire", "Unité", "Quantité", "Montant HT"]],
    body: [
      [`Sel - ${invoice.saltType}`, `${fmt(invoice.unitPrice)} FCFA`, "tonne", `${fmt(invoice.quantity)}`, `${fmt(subtotal)} FCFA`],
      ...(discount > 0 ? [["Remise", "", "", "", `-${fmt(discount)} FCFA`]] : []),
    ],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
    bodyStyles: { fontSize: 9, textColor: [...DARK], halign: "center" },
    columnStyles: { 0: { halign: "left", cellWidth: 60 }, 4: { halign: "right", fontStyle: "bold" } },
    alternateRowStyles: { fillColor: SECONDARY },
    margin: { left: 15, right: 15 },
    styles: { lineColor: [200, 200, 200], lineWidth: 0.2 },
  });

  const tey = (doc as any).lastAutoTable.finalY + 8;
  const tx = 130, tv = pw - 18;
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
  let ty = tey;
  doc.text("Total HT", tx, ty); doc.text(`${fmt(subtotal)} FCFA`, tv, ty, { align: "right" }); ty += 7;
  if (discount > 0) { doc.text("Remise", tx, ty); doc.text(`-${fmt(discount)} FCFA`, tv, ty, { align: "right" }); ty += 7; }
  doc.setFillColor(...ACCENT);
  doc.roundedRect(tx - 3, ty - 5, pw - tx - 12, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text("Total TTC", tx, ty + 3); doc.text(`${fmt(invoice.totalAmount)} FCFA`, tv, ty + 3, { align: "right" });

  // Conditions + Signature
  const condY = ty + 25;
  doc.setTextColor(...DARK); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Modalités et conditions de règlement :", 15, condY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text(paymentLabel(invoice.paymentStatus), 15, condY + 7);
  if (invoice.notes) doc.text(`Notes: ${invoice.notes}`, 15, condY + 14);
  doc.setTextColor(...DARK); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Signature :", tx, condY);
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.3);
  doc.rect(tx, condY + 4, pw - tx - 15, 25);

  // Footer
  const fy = ph - 15;
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(1);
  doc.line(15, fy - 8, pw - 15, fy - 8);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  const fp: string[] = []; if (company.name) fp.push(company.name); if (company.capital) fp.push(`au capital de ${company.capital}`);
  doc.text(fp.join(" – "), pw / 2, fy - 2, { align: "center" });
  const lp: string[] = []; if (company.ninea) lp.push(`NINEA: ${company.ninea}`); if (company.rccm) lp.push(`RCCM: ${company.rccm}`); if (company.managerName) lp.push(`Gérant: ${company.managerName}`);
  if (lp.length) doc.text(lp.join(" | "), pw / 2, fy + 3, { align: "center" });
}

// ═══════════════════════════════════════
// MODERN – Full-width colored banner, rounded elements, two-column header
// ═══════════════════════════════════════
function renderModern(doc: jsPDF, invoice: InvoiceData, company: CompanyInfo, logoBase64: string | null) {
  const PRIMARY: [number, number, number] = [37, 99, 235];
  const LIGHT: [number, number, number] = [239, 246, 255];
  const ACCENT: [number, number, number] = [29, 78, 216];
  const DARK: [number, number, number] = [30, 41, 59];
  const GRAY: [number, number, number] = [100, 116, 139];
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Full-width top banner
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pw, 45, "F");

  // Company name in banner (with optional logo)
  if (logoBase64) {
    addLogo(doc, logoBase64, 20, 10, 12);
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(company.name || "Mon Entreprise", 65, 20);
  } else {
    doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(company.name || "Mon Entreprise", 20, 20);
  }
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  const infoParts: string[] = [];
  if (company.phone) infoParts.push(company.phone);
  if (company.email) infoParts.push(company.email);
  if (infoParts.length) doc.text(infoParts.join("  •  "), 20, 30);

  // Invoice number + date in banner (right)
  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.text("FACTURE", pw - 20, 20, { align: "right" });
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(`N° ${invoice.invoiceNumber}`, pw - 20, 30, { align: "right" });
  doc.setFontSize(9);
  doc.text(invoice.date, pw - 20, 38, { align: "right" });

  // Two-column info section
  let ly = 58;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text("ÉMETTEUR", 20, ly);
  doc.text("DESTINATAIRE", pw / 2 + 10, ly);
  ly += 6;

  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...DARK);
  const leftLines: string[] = [company.name || ""];
  if (company.address) leftLines.push(company.address);
  if (company.ninea) leftLines.push(`NINEA: ${company.ninea}`);
  if (company.rccm) leftLines.push(`RCCM: ${company.rccm}`);

  const rightLines: string[] = [invoice.clientName];
  if (invoice.clientType) rightLines.push(`Type: ${invoice.clientType}`);
  if (invoice.clientAddress) rightLines.push(invoice.clientAddress);
  if (invoice.clientPhone) rightLines.push(`Tél: ${invoice.clientPhone}`);
  if (invoice.clientEmail) rightLines.push(invoice.clientEmail);

  leftLines.forEach((l, i) => { doc.text(l, 20, ly + i * 5); });
  rightLines.forEach((l, i) => { doc.text(l, pw / 2 + 10, ly + i * 5); });

  // Separator
  const sepY = ly + Math.max(leftLines.length, rightLines.length) * 5 + 5;
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.5);
  doc.line(20, sepY, pw - 20, sepY);

  // Table
  const subtotal = invoice.quantity * invoice.unitPrice;
  const discount = invoice.discount || 0;
  autoTable(doc, {
    startY: sepY + 8,
    head: [["#", "Description", "Qté (tonnes)", "Prix unitaire", "Total"]],
    body: [
      ["1", `Sel - ${invoice.saltType}`, fmt(invoice.quantity), `${fmt(invoice.unitPrice)} F`, `${fmt(subtotal)} F`],
      ...(discount > 0 ? [["", "Remise", "", "", `-${fmt(discount)} F`]] : []),
    ],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
    bodyStyles: { fontSize: 9, textColor: [...DARK], halign: "center" },
    columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { halign: "left", cellWidth: 65 }, 4: { halign: "right", fontStyle: "bold" } },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 20, right: 20 },
    styles: { lineColor: [200, 210, 230], lineWidth: 0.1 },
  });

  const tey = (doc as any).lastAutoTable.finalY + 10;

  // Totals in a blue sidebar box
  const boxW = 80, boxX = pw - 20 - boxW;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(boxX, tey, boxW, discount > 0 ? 40 : 30, 3, 3, "F");
  let ty = tey + 10;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
  doc.text("Sous-total:", boxX + 5, ty); doc.text(`${fmt(subtotal)} FCFA`, boxX + boxW - 5, ty, { align: "right" });
  if (discount > 0) { ty += 8; doc.text("Remise:", boxX + 5, ty); doc.text(`-${fmt(discount)} FCFA`, boxX + boxW - 5, ty, { align: "right" }); }
  ty += 10;
  doc.setFillColor(...ACCENT); doc.roundedRect(boxX, ty - 4, boxW, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", boxX + 5, ty + 4); doc.text(`${fmt(invoice.totalAmount)} FCFA`, boxX + boxW - 5, ty + 4, { align: "right" });

  // Payment + Notes (left side)
  const ny = tey + 5;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text("CONDITIONS", 20, ny);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text(paymentLabel(invoice.paymentStatus), 20, ny + 7);
  if (invoice.notes) doc.text(`Note: ${invoice.notes}`, 20, ny + 14);

  // Footer band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, ph - 20, pw, 20, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(255, 255, 255);
  const fp: string[] = []; if (company.name) fp.push(company.name); if (company.address) fp.push(company.address); if (company.phone) fp.push(company.phone);
  doc.text(fp.join("  •  "), pw / 2, ph - 11, { align: "center" });
  const lp: string[] = []; if (company.ninea) lp.push(`NINEA: ${company.ninea}`); if (company.rccm) lp.push(`RCCM: ${company.rccm}`);
  if (lp.length) doc.text(lp.join("  •  "), pw / 2, ph - 5, { align: "center" });
}

// ═══════════════════════════════════════
// MINIMAL – Clean, monochrome, lots of whitespace, no boxes
// ═══════════════════════════════════════
function renderMinimal(doc: jsPDF, invoice: InvoiceData, company: CompanyInfo, logoBase64: string | null) {
  const BLACK: [number, number, number] = [24, 24, 27];
  const GRAY: [number, number, number] = [113, 113, 122];
  const LIGHT: [number, number, number] = [244, 244, 245];
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Logo + Centered title
  if (logoBase64) {
    addLogo(doc, logoBase64, pw / 2 - 7, 14, 12);
    doc.setFontSize(32); doc.setFont("helvetica", "bold"); doc.setTextColor(...BLACK);
    doc.text("FACTURE", pw / 2, 38, { align: "center" });
  } else {
    doc.setFontSize(32); doc.setFont("helvetica", "bold"); doc.setTextColor(...BLACK);
    doc.text("FACTURE", pw / 2, 30, { align: "center" });
  }

  // Thin line
  doc.setDrawColor(...BLACK); doc.setLineWidth(0.8);
  doc.line(pw / 2 - 30, 34, pw / 2 + 30, 34);

  // Invoice number + date centered
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  doc.text(`N° ${invoice.invoiceNumber}  —  ${invoice.date}`, pw / 2, 42, { align: "center" });

  // Two columns: company left, client right – minimal style
  let ly = 58;
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY);
  doc.text("DE", 25, ly); doc.text("POUR", pw / 2 + 15, ly);
  ly += 6;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...BLACK);
  doc.text(company.name || "", 25, ly);
  doc.text(invoice.clientName, pw / 2 + 15, ly);
  ly += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
  const leftL: string[] = [];
  if (company.address) leftL.push(company.address);
  if (company.phone) leftL.push(company.phone);
  if (company.email) leftL.push(company.email);
  const rightL: string[] = [];
  if (invoice.clientType) rightL.push(`Type: ${invoice.clientType}`);
  if (invoice.clientAddress) rightL.push(invoice.clientAddress);
  if (invoice.clientPhone) rightL.push(invoice.clientPhone);
  if (invoice.clientEmail) rightL.push(invoice.clientEmail);
  leftL.forEach((l, i) => doc.text(l, 25, ly + i * 5));
  rightL.forEach((l, i) => doc.text(l, pw / 2 + 15, ly + i * 5));

  const tableStart = ly + Math.max(leftL.length, rightL.length) * 5 + 10;

  // Table – minimal borders, no colored header
  const subtotal = invoice.quantity * invoice.unitPrice;
  const discount = invoice.discount || 0;
  autoTable(doc, {
    startY: tableStart,
    head: [["Description", "Quantité", "Prix unitaire", "Montant"]],
    body: [
      [`Sel – ${invoice.saltType}`, `${fmt(invoice.quantity)} t`, `${fmt(invoice.unitPrice)} FCFA`, `${fmt(subtotal)} FCFA`],
      ...(discount > 0 ? [["Remise", "", "", `-${fmt(discount)} FCFA`]] : []),
    ],
    headStyles: { fillColor: [255, 255, 255], textColor: [...GRAY], fontStyle: "bold", fontSize: 8, halign: "left" },
    bodyStyles: { fontSize: 9, textColor: [...BLACK], halign: "left" },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
    margin: { left: 25, right: 25 },
    styles: { lineColor: [220, 220, 220], lineWidth: 0.3 },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.3,
  });

  const tey = (doc as any).lastAutoTable.finalY;

  // Totals – right aligned, simple lines
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(pw / 2 + 20, tey + 5, pw - 25, tey + 5);

  let ty = tey + 14;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  doc.text("Sous-total", pw - 75, ty); doc.text(`${fmt(subtotal)} FCFA`, pw - 25, ty, { align: "right" });
  if (discount > 0) { ty += 7; doc.text("Remise", pw - 75, ty); doc.text(`-${fmt(discount)} FCFA`, pw - 25, ty, { align: "right" }); }
  ty += 10;
  doc.setDrawColor(...BLACK); doc.setLineWidth(0.8);
  doc.line(pw / 2 + 20, ty - 4, pw - 25, ty - 4);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...BLACK);
  doc.text("Total", pw - 75, ty + 3); doc.text(`${fmt(invoice.totalAmount)} FCFA`, pw - 25, ty + 3, { align: "right" });

  // Payment
  const condY = ty + 25;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  doc.text(paymentLabel(invoice.paymentStatus), 25, condY);
  if (invoice.notes) doc.text(invoice.notes, 25, condY + 7);

  // Footer – just a thin line and text
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(25, ph - 18, pw - 25, ph - 18);
  doc.setFontSize(7); doc.setTextColor(...GRAY);
  const fp: string[] = []; if (company.name) fp.push(company.name); if (company.ninea) fp.push(`NINEA: ${company.ninea}`); if (company.rccm) fp.push(`RCCM: ${company.rccm}`);
  doc.text(fp.join("  ·  "), pw / 2, ph - 12, { align: "center" });
}

// ═══════════════════════════════════════
// ELEGANT – Gold accents, decorative borders, centered composition
// ═══════════════════════════════════════
function renderElegant(doc: jsPDF, invoice: InvoiceData, company: CompanyInfo, logoBase64: string | null) {
  const GOLD: [number, number, number] = [184, 134, 11];
  const DARK_GOLD: [number, number, number] = [139, 105, 20];
  const CREAM: [number, number, number] = [255, 248, 231];
  const DARK: [number, number, number] = [61, 46, 10];
  const GRAY: [number, number, number] = [120, 110, 80];
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Decorative double border
  doc.setDrawColor(...GOLD); doc.setLineWidth(1.5);
  doc.rect(10, 10, pw - 20, ph - 20);
  doc.setLineWidth(0.3);
  doc.rect(13, 13, pw - 26, ph - 26);

  // Header ornament lines
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);
  doc.line(30, 35, pw - 30, 35);
  doc.line(30, 37, pw - 30, 37);

  // Logo + Company name centered
  if (logoBase64) {
    addLogo(doc, logoBase64, pw / 2 - 7, 18, 10);
    doc.setFontSize(14); doc.setFont("times", "bold"); doc.setTextColor(...DARK);
    doc.text(company.name || "Mon Entreprise", pw / 2, 33, { align: "center" });
  } else {
    doc.setFontSize(16); doc.setFont("times", "bold"); doc.setTextColor(...DARK);
    doc.text(company.name || "Mon Entreprise", pw / 2, 28, { align: "center" });
  }

  // "FACTURE" + number
  doc.setFontSize(22); doc.setFont("times", "bolditalic"); doc.setTextColor(...GOLD);
  doc.text("Facture", pw / 2, 50, { align: "center" });
  doc.setFontSize(11); doc.setFont("times", "normal"); doc.setTextColor(...DARK);
  doc.text(`N° ${invoice.invoiceNumber}`, pw / 2, 58, { align: "center" });
  doc.setFontSize(9); doc.setTextColor(...GRAY);
  const cityDate = company.city ? `${company.city}, le ${invoice.date}` : invoice.date;
  doc.text(cityDate, pw / 2, 64, { align: "center" });

  // Ornament line below title
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
  doc.line(60, 68, pw - 60, 68);

  // Company info (left) + Client info (right) in a cream background band
  const elegantClientLines: string[] = [invoice.clientName];
  if (invoice.clientType) elegantClientLines.push(`Type: ${invoice.clientType}`);
  if (invoice.clientAddress) elegantClientLines.push(invoice.clientAddress);
  if (invoice.clientPhone) elegantClientLines.push(invoice.clientPhone);
  if (invoice.clientEmail) elegantClientLines.push(invoice.clientEmail);
  const bandH = Math.max(30, 10 + elegantClientLines.length * 5);
  doc.setFillColor(...CREAM);
  doc.rect(18, 74, pw - 36, bandH, "F");

  let ly = 82;
  doc.setFontSize(8); doc.setFont("times", "bold"); doc.setTextColor(...GOLD);
  doc.text("ÉMETTEUR", 25, ly - 3);
  doc.text("CLIENT", pw / 2 + 10, ly - 3);

  doc.setFont("times", "normal"); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text(company.name || "", 25, ly + 3);
  doc.text(elegantClientLines[0], pw / 2 + 10, ly + 3);
  doc.setFontSize(8); doc.setTextColor(...GRAY);
  if (company.address) doc.text(company.address, 25, ly + 8);
  if (company.phone) doc.text(company.phone, 25, ly + 13);
  for (let i = 1; i < elegantClientLines.length; i++) {
    doc.text(elegantClientLines[i], pw / 2 + 10, ly + 3 + i * 5);
  }

  // Table with gold header
  const subtotal = invoice.quantity * invoice.unitPrice;
  const discount = invoice.discount || 0;
  autoTable(doc, {
    startY: 112,
    head: [["Description", "Quantité", "Prix unitaire", "Montant HT"]],
    body: [
      [`Sel – ${invoice.saltType}`, `${fmt(invoice.quantity)} t`, `${fmt(invoice.unitPrice)} FCFA`, `${fmt(subtotal)} FCFA`],
      ...(discount > 0 ? [["Remise", "", "", `-${fmt(discount)} FCFA`]] : []),
    ],
    headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center", font: "times" },
    bodyStyles: { fontSize: 9, textColor: [...DARK], halign: "center", font: "times" },
    columnStyles: { 0: { halign: "left", cellWidth: 70 }, 3: { halign: "right", fontStyle: "bold" } },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 25, right: 25 },
    styles: { lineColor: [...GOLD], lineWidth: 0.2 },
  });

  const tey = (doc as any).lastAutoTable.finalY + 10;

  // Total in elegant centered box
  const boxW = 90, boxX = pw / 2 - boxW / 2;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);

  let ty = tey;
  doc.setFontSize(9); doc.setFont("times", "normal"); doc.setTextColor(...DARK);
  doc.text("Sous-total HT:", boxX + 5, ty); doc.text(`${fmt(subtotal)} FCFA`, boxX + boxW - 5, ty, { align: "right" }); ty += 7;
  if (discount > 0) { doc.text("Remise:", boxX + 5, ty); doc.text(`-${fmt(discount)} FCFA`, boxX + boxW - 5, ty, { align: "right" }); ty += 7; }

  doc.setFillColor(...DARK_GOLD);
  doc.roundedRect(boxX, ty - 3, boxW, 14, 2, 2, "F");
  doc.setFont("times", "bold"); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text("Total TTC", boxX + 5, ty + 5); doc.text(`${fmt(invoice.totalAmount)} FCFA`, boxX + boxW - 5, ty + 5, { align: "right" });

  // Conditions + Signature
  const condY = ty + 28;
  doc.setFontSize(9); doc.setFont("times", "italic"); doc.setTextColor(...GRAY);
  doc.text(paymentLabel(invoice.paymentStatus), pw / 2, condY, { align: "center" });
  if (invoice.notes) doc.text(invoice.notes, pw / 2, condY + 7, { align: "center" });

  // Signature area
  doc.setFont("times", "bold"); doc.setFontSize(9); doc.setTextColor(...DARK);
  doc.text("Signature et cachet :", pw - 85, condY + 20);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
  doc.rect(pw - 85, condY + 23, 60, 20);

  // Footer with ornamental lines
  const fy = ph - 25;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);
  doc.line(30, fy, pw - 30, fy);
  doc.line(30, fy + 2, pw - 30, fy + 2);
  doc.setFontSize(7); doc.setFont("times", "normal"); doc.setTextColor(...GRAY);
  const fp: string[] = []; if (company.name) fp.push(company.name); if (company.capital) fp.push(`Capital: ${company.capital}`);
  doc.text(fp.join("  ✦  "), pw / 2, fy + 8, { align: "center" });
  const lp: string[] = []; if (company.ninea) lp.push(`NINEA: ${company.ninea}`); if (company.rccm) lp.push(`RCCM: ${company.rccm}`); if (company.managerName) lp.push(`Gérant: ${company.managerName}`);
  if (lp.length) doc.text(lp.join("  ✦  "), pw / 2, fy + 13, { align: "center" });
}

// ═══════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════
export const generateInvoicePdf = async (invoice: InvoiceData, company: CompanyInfo, style: InvoiceStyle = "classic") => {
  const doc = new jsPDF();

  // Load logo if available
  const logoBase64 = company.logoUrl ? await loadImageAsBase64(company.logoUrl) : null;

  switch (style) {
    case "modern": renderModern(doc, invoice, company, logoBase64); break;
    case "minimal": renderMinimal(doc, invoice, company, logoBase64); break;
    case "elegant": renderElegant(doc, invoice, company, logoBase64); break;
    default: renderClassic(doc, invoice, company, logoBase64); break;
  }
  doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
};

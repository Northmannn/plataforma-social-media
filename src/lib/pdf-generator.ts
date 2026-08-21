import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContentScript {
  id: string;
  title: string;
  type: string;
  content: string;
  platform?: string;
  metadata?: {
    generated_with_ai?: boolean;
    profile_username?: string;
    original_prompt?: string;
    posts_analyzed?: number;
    [key: string]: any;
  };
  created_at: string;
}

// Cores da plataforma (HSL → RGB)
const COLORS = {
  primary: [0, 223, 255] as [number, number, number],
  accent: [23, 207, 230] as [number, number, number],
  background: [5, 13, 13] as [number, number, number],
  card: [15, 26, 26] as [number, number, number],
  aiBox: [230, 250, 255] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  textLight: [130, 130, 130] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const typeLabels: Record<string, string> = {
  video: "Roteiro de Vídeo",
  post: "Legenda para Post",
  idea: "Ideia de Conteúdo",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter",
};

const typeIcons: Record<string, string> = {
  video: "🎥",
  post: "📝",
  idea: "💡",
};

// Renderiza texto com suporte a **bold** inline de forma robusta
const renderFormattedLine = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color: [number, number, number],
  baseFontStyle: "normal" | "bold" = "normal",
  fontSize: number = 11
): number => {
  doc.setFontSize(fontSize);
  const lineH = fontSize * 0.55;

  if (!text.includes("**")) {
    doc.setFont("helvetica", baseFontStyle);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], x, y + i * lineH);
    }
    return lines.length * lineH;
  }

  const segments: { text: string; bold: boolean }[] = [];
  const pattern = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  let curX = x;
  let curY = y;

  for (const seg of segments) {
    const fontStyle = seg.bold ? "bold" : baseFontStyle;
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);

    const words = seg.text.split(/( +)/);

    for (const word of words) {
      if (!word) continue;
      const wordWidth = doc.getTextWidth(word);

      if (curX + wordWidth > x + maxWidth && curX > x) {
        curX = x;
        curY += lineH;
      }

      doc.text(word, curX, curY);
      curX += wordWidth;
    }
  }

  return curY - y + lineH;
};

const PARAGRAPH_GAP = 3;

export const generateContentPDF = (script: ContentScript) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkAddPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Header
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Conteúdo Social", margin, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const generatedDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${generatedDate}`, margin, 25);

  yPosition = 50;

  // Tipo de conteúdo
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const typeLabel = `${typeIcons[script.type] || ""} ${typeLabels[script.type] || script.type}`;
  doc.text(typeLabel, margin, yPosition);
  yPosition += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Título:", margin, yPosition);
  doc.setFont("helvetica", "normal");
  const titleLines = doc.splitTextToSize(script.title, contentWidth - 20);
  doc.text(titleLines, margin + 20, yPosition);
  yPosition += titleLines.length * 6 + 5;

  if (script.platform) {
    doc.setFont("helvetica", "bold");
    doc.text("Plataforma:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(platformLabels[script.platform] || script.platform, margin + 30, yPosition);
    yPosition += 7;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Criado em:", margin, yPosition);
  doc.setFont("helvetica", "normal");
  const createdDate = format(new Date(script.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(createdDate, margin + 30, yPosition);
  yPosition += 10;

  // AI metadata box
  if (script.metadata?.generated_with_ai) {
    doc.setFillColor(...COLORS.aiBox);
    const boxHeight = 25;
    doc.rect(margin, yPosition, contentWidth, boxHeight, "F");

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("🤖 Gerado com IA", margin + 5, yPosition + 7);

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "normal");
    if (script.metadata.profile_username) {
      doc.text(`Base: @${script.metadata.profile_username}`, margin + 5, yPosition + 13);
    }
    if (script.metadata.original_prompt) {
      const promptText = `Prompt: ${script.metadata.original_prompt}`;
      const promptLines = doc.splitTextToSize(promptText, contentWidth - 10);
      doc.text(promptLines.slice(0, 1), margin + 5, yPosition + 19);
    }

    yPosition += boxHeight + 10;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("CONTEÚDO", margin, yPosition);
  yPosition += 10;

  // Processar conteúdo
  const contentLines = script.content.split("\n");

  for (const line of contentLines) {
    if (line.trim() === "") {
      yPosition += PARAGRAPH_GAP;
      continue;
    }

    checkAddPage(15);
    const trimmed = line.trim();

    // H1
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      yPosition += 4;
      checkAddPage(12);
      const titleText = trimmed.replace(/^#\s+/, '');
      const h = renderFormattedLine(doc, titleText, margin, yPosition, contentWidth, COLORS.text, "bold", 16);
      yPosition += h + 4;
      continue;
    }

    // H2
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      yPosition += 3;
      checkAddPage(10);
      const sectionText = trimmed.replace(/^##\s+/, '');
      const h = renderFormattedLine(doc, sectionText, margin, yPosition, contentWidth, COLORS.primary, "bold", 13);
      yPosition += h + 3;
      continue;
    }

    // H3
    if (trimmed.startsWith("### ")) {
      yPosition += 2;
      checkAddPage(10);
      const subText = trimmed.replace(/^###\s+/, '');
      const h = renderFormattedLine(doc, subText, margin, yPosition, contentWidth, COLORS.accent, "bold", 11);
      yPosition += h + 2;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...COLORS.textLight);
      const quoteText = trimmed.replace(/^>\s+/, '');
      const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 10);
      doc.setFillColor(240, 245, 248);
      doc.rect(margin, yPosition - 4, contentWidth, quoteLines.length * 5 + 6, "F");
      doc.text(quoteLines, margin + 5, yPosition);
      yPosition += quoteLines.length * 5 + 6;
      continue;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      doc.setDrawColor(...COLORS.accent);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
      continue;
    }

    // Listas não-ordenadas
    if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.startsWith('**'))) {
      const cleanItem = trimmed.replace(/^[-*]\s+/, '').trim();
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.accent);
      doc.text("•", margin + 2, yPosition);
      const h = renderFormattedLine(doc, cleanItem, margin + 8, yPosition, contentWidth - 8, COLORS.text, "normal", 11);
      yPosition += h + 1.5;
      continue;
    }

    // Listas numeradas
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const itemText = numberedMatch[2];
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.accent);
      doc.text(`${num}.`, margin + 1, yPosition);
      const h = renderFormattedLine(doc, itemText, margin + 8, yPosition, contentWidth - 8, COLORS.text, "normal", 11);
      yPosition += h + 1.5;
      continue;
    }

    // Seções especiais (HOOK, CTA, etc.)
    const upperLine = trimmed.toUpperCase();
    const isSection =
      upperLine.startsWith("HOOK") ||
      upperLine.startsWith("DESENVOLVIMENTO") ||
      upperLine.startsWith("CTA") ||
      upperLine.startsWith("INTRODUÇÃO") ||
      upperLine.startsWith("CHAMADA") ||
      upperLine.startsWith("TEMA:") ||
      upperLine.startsWith("FORMATO:");

    if (isSection) {
      yPosition += 2;
      const h = renderFormattedLine(doc, trimmed, margin, yPosition, contentWidth, COLORS.primary, "bold", 11);
      yPosition += h + 2;
    } else {
      const h = renderFormattedLine(doc, trimmed, margin, yPosition, contentWidth, COLORS.text, "normal", 11);
      yPosition += h + 1.5;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i} de ${pageCount}`, margin, pageHeight - 10);
    doc.text("Gerado por Conteúdo Social", pageWidth - margin - 50, pageHeight - 10);
  }

  const sanitizedTitle = script.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);

  const dateStr = format(new Date(), "dd-MM-yyyy");
  const fileName = `${script.type}-${sanitizedTitle}-${dateStr}.pdf`;

  doc.save(fileName);
};

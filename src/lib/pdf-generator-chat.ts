import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PDFMetadata {
  profileName?: string;
  contentType?: string;
  platform?: string;
}

// Cores da plataforma (HSL → RGB)
const COLORS = {
  primary: [0, 223, 255] as [number, number, number],
  accent: [23, 207, 230] as [number, number, number],
  background: [5, 13, 13] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  textLight: [130, 130, 130] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const LINE_HEIGHT = 5.5;
const PARAGRAPH_GAP = 3;

// Renderiza texto com suporte a **bold** inline de forma robusta
const renderFormattedLine = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color: [number, number, number],
  baseFontStyle: "normal" | "bold" = "normal",
  fontSize: number = 10
): number => {
  doc.setFontSize(fontSize);
  const lineH = fontSize * 0.55;

  // Se não tem bold markers, renderizar simples
  if (!text.includes("**")) {
    doc.setFont("helvetica", baseFontStyle);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], x, y + i * lineH);
    }
    return lines.length * lineH;
  }

  // Processar segmentos bold/normal
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
  const spaceWidth = (() => {
    doc.setFont("helvetica", "normal");
    return doc.getTextWidth(" ");
  })();

  for (const seg of segments) {
    const fontStyle = seg.bold ? "bold" : baseFontStyle;
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);

    // Quebrar em palavras para word-wrap manual
    const words = seg.text.split(/( +)/);

    for (const word of words) {
      if (!word) continue;
      const wordWidth = doc.getTextWidth(word);

      // Se a palavra não cabe na linha atual, quebrar
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

const contentTypeLabels: Record<string, string> = {
  video: "Roteiro de Vídeo",
  post: "Legenda para Post",
  idea: "Ideia de Conteúdo",
  carousel: "Carrossel",
  reels: "Roteiro de Reels",
  stories: "Stories",
};

export const generateChatMessagePDF = (
  message: ChatMessage,
  metadata?: PDFMetadata
) => {
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

  // Header escuro
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("Viver de IA", margin, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Conteúdo gerado por IA", margin, 35);

  const dateText = format(new Date(message.timestamp), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(dateText, pageWidth - margin, 25, { align: "right" });

  yPosition = 60;

  // Título dinâmico baseado no tipo de conteúdo
  const titleLabel = metadata?.contentType
    ? contentTypeLabels[metadata.contentType] || metadata.contentType
    : "Conteúdo Gerado";

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(titleLabel, margin, yPosition);
  yPosition += 10;

  // Metadata
  if (metadata) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textLight);

    const metadataLines: string[] = [];
    if (metadata.contentType) metadataLines.push(`Tipo: ${contentTypeLabels[metadata.contentType] || metadata.contentType}`);
    if (metadata.platform) metadataLines.push(`Plataforma: ${metadata.platform}`);
    if (metadata.profileName) metadataLines.push(`Perfil: @${metadata.profileName}`);

    if (metadataLines.length > 0) {
      doc.text(metadataLines.join(" • "), margin, yPosition);
      yPosition += 8;
    }
  }

  // Separador
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Processar conteúdo
  const contentLines = message.content.split('\n');

  for (const line of contentLines) {
    if (line.trim() === '') {
      yPosition += PARAGRAPH_GAP;
      continue;
    }

    checkAddPage(15);
    const trimmed = line.trim();

    // H1: # Título
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      yPosition += 4;
      checkAddPage(12);
      const titleText = trimmed.replace(/^#\s+/, '');
      const h = renderFormattedLine(doc, titleText, margin, yPosition, contentWidth, COLORS.text, "bold", 16);
      yPosition += h + 4;
      continue;
    }

    // H2: ## Seção
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      yPosition += 3;
      checkAddPage(10);
      const sectionText = trimmed.replace(/^##\s+/, '');
      const h = renderFormattedLine(doc, sectionText, margin, yPosition, contentWidth, COLORS.accent, "bold", 13);
      yPosition += h + 3;
      continue;
    }

    // H3: ### Subtítulo
    if (trimmed.startsWith("### ")) {
      yPosition += 2;
      checkAddPage(10);
      const subText = trimmed.replace(/^###\s+/, '');
      const h = renderFormattedLine(doc, subText, margin, yPosition, contentWidth, COLORS.accent, "bold", 11);
      yPosition += h + 2;
      continue;
    }

    // Blockquote: > metadata
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
      doc.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 6;
      continue;
    }

    // Listas não-ordenadas (- ou *)
    if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.startsWith('**'))) {
      const cleanItem = trimmed.replace(/^[-*]\s+/, '').trim();
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.accent);
      doc.text("•", margin + 2, yPosition);
      const h = renderFormattedLine(doc, cleanItem, margin + 8, yPosition, contentWidth - 8, COLORS.text, "normal", 10);
      yPosition += h + 1.5;
      continue;
    }

    // Listas numeradas (1. Item)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const itemText = numberedMatch[2];
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.accent);
      doc.text(`${num}.`, margin + 1, yPosition);
      const h = renderFormattedLine(doc, itemText, margin + 8, yPosition, contentWidth - 8, COLORS.text, "normal", 10);
      yPosition += h + 1.5;
      continue;
    }

    // Detectar títulos legados (termina com :)
    if (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.includes('**')) {
      yPosition += 2;
      const h = renderFormattedLine(doc, trimmed.replace(':', ''), margin, yPosition, contentWidth, COLORS.accent, "bold", 12);
      yPosition += h + 2;
      continue;
    }

    // Parágrafo normal
    const h = renderFormattedLine(doc, trimmed, margin, yPosition, contentWidth, COLORS.text, "normal", 10);
    yPosition += h + 1.5;
  }

  // Footer em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont("helvetica", "normal");
    doc.text("Gerado por Viver de IA", pageWidth / 2, pageHeight - 15, { align: "center" });
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  const fileName = `roteiro-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
};

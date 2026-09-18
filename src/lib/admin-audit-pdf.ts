import {
  auditActionLabels,
  auditEntityLabels,
  formatAuditDateTime,
  formatAuditValue,
  getAuditChangedFields,
} from "@/lib/admin-audit-format";
import type { AuditLogRecord } from "@/lib/admin-audit-api";

export type AuditPdfFilters = {
  action?: string;
  entityType?: string;
  laboratoryName?: string;
  actorEmail?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};

type PdfPage = {
  commands: string[];
  y: number;
};

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 36;
const LINE_HEIGHT = 12;
const FONT_SIZE = 9;
const MAX_VALUE_LENGTH = 220;

function toWinAnsiByte(char: string) {
  const code = char.codePointAt(0) ?? 63;
  if (code <= 255) return code;

  const replacements: Record<string, number> = {
    "€": 128,
    "‚": 130,
    "ƒ": 131,
    "„": 132,
    "…": 133,
    "†": 134,
    "‡": 135,
    "ˆ": 136,
    "‰": 137,
    "Š": 138,
    "‹": 139,
    "Œ": 140,
    "Ž": 142,
    "‘": 145,
    "’": 146,
    "“": 147,
    "”": 148,
    "•": 149,
    "–": 150,
    "—": 151,
    "˜": 152,
    "™": 153,
    "š": 154,
    "›": 155,
    "œ": 156,
    "ž": 158,
    "Ÿ": 159,
  };

  return replacements[char] ?? 63;
}

function latin1Bytes(value: string) {
  const bytes: number[] = [];
  for (const char of value) bytes.push(toWinAnsiByte(char));
  return new Uint8Array(bytes);
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[\r\n\t]+/g, " ");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength = MAX_VALUE_LENGTH) {
  const normalized = normalizeText(value);
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

function wrapText(value: string, maxChars: number) {
  const words = normalizeText(value).split(" ").filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const chunks =
      word.length > maxChars
        ? Array.from({ length: Math.ceil(word.length / maxChars) }, (_, index) =>
            word.slice(index * maxChars, (index + 1) * maxChars),
          )
        : [word];

    for (const chunk of chunks) {
      if (!current) {
        current = chunk;
        continue;
      }

      const candidate = `${current} ${chunk}`;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        lines.push(current);
        current = chunk;
      }
    }
  }

  if (current) lines.push(current);
  return lines;
}

function textCommand(
  text: string,
  x: number,
  y: number,
  options?: { size?: number; bold?: boolean },
) {
  const size = options?.size ?? FONT_SIZE;
  const font = options?.bold ? "F2" : "F1";
  return `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`;
}

function lineCommand(x1: number, y1: number, x2: number, y2: number) {
  return `0.82 G 0.5 w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function createPage(): PdfPage {
  return { commands: [], y: PAGE_HEIGHT - MARGIN };
}

function addWrappedText(
  page: PdfPage,
  text: string,
  x: number,
  maxChars: number,
  options?: { size?: number; bold?: boolean; indent?: number },
) {
  const indent = options?.indent ?? 0;
  const lines = wrapText(text, maxChars);
  for (const line of lines) {
    page.commands.push(textCommand(line, x + indent, page.y, options));
    page.y -= LINE_HEIGHT;
  }
}

function describeFilters(filters: AuditPdfFilters) {
  const parts: string[] = [];

  if (filters.action) parts.push(`Ação: ${auditActionLabels[filters.action] ?? filters.action}`);
  if (filters.entityType) {
    parts.push(`Entidade: ${auditEntityLabels[filters.entityType] ?? filters.entityType}`);
  }
  if (filters.laboratoryName) parts.push(`Laboratório: ${filters.laboratoryName}`);
  if (filters.actorEmail) parts.push(`Ator: ${filters.actorEmail}`);
  if (filters.startDate) parts.push(`De: ${filters.startDate}`);
  if (filters.endDate) parts.push(`Até: ${filters.endDate}`);
  if (filters.search) parts.push(`Busca: ${filters.search}`);

  return parts.length > 0 ? parts.join(" | ") : "Nenhum filtro aplicado";
}

function eventLines(record: AuditLogRecord) {
  const actor =
    record.actorEmail ??
    record.actorUserId ??
    (record.actorRole === "admin"
      ? "Administrador"
      : record.actorRole === "laboratory"
        ? "Laboratório"
        : "Sistema");

  const heading = [
    formatAuditDateTime(record.createdAt),
    auditActionLabels[record.action] ?? record.action,
    auditEntityLabels[record.entityType] ?? record.entityType,
  ].join(" | ");

  const summary = [
    `Laboratório: ${record.laboratoryName ?? "—"}`,
    `Ator: ${actor}`,
    `ID da entidade: ${record.entityId ?? "—"}`,
  ].join(" | ");

  const changes = getAuditChangedFields(record).map((change) => {
    const before = truncate(formatAuditValue(change.before), 90);
    const after = truncate(formatAuditValue(change.after), 90);
    return `${change.label}: ${before} -> ${after}`;
  });

  return { heading, summary, changes };
}

function ensureSpace(
  pages: PdfPage[],
  requiredHeight: number,
  headerFactory: (page: PdfPage, pageNumber: number) => void,
) {
  let page = pages[pages.length - 1];
  if (page.y - requiredHeight >= MARGIN + 20) return page;

  page = createPage();
  pages.push(page);
  headerFactory(page, pages.length);
  return page;
}

function buildDocument(
  records: AuditLogRecord[],
  filters: AuditPdfFilters,
  total: number,
  truncated: boolean,
) {
  const pages: PdfPage[] = [createPage()];
  const generatedAt = formatAuditDateTime(new Date().toISOString());

  const headerFactory = (page: PdfPage, pageNumber: number) => {
    page.commands.push(
      textCommand("Sistema de Agendamento de Provas", MARGIN, page.y, {
        size: 13,
        bold: true,
      }),
    );
    page.y -= 18;
    page.commands.push(
      textCommand("Relatório de Auditoria", MARGIN, page.y, { size: 11, bold: true }),
    );
    page.commands.push(
      textCommand(`Página ${pageNumber}`, PAGE_WIDTH - MARGIN - 55, page.y, {
        size: 8,
      }),
    );
    page.y -= 16;
    page.commands.push(lineCommand(MARGIN, page.y, PAGE_WIDTH - MARGIN, page.y));
    page.y -= 15;
  };

  headerFactory(pages[0], 1);

  let page = pages[0];
  addWrappedText(
    page,
    `Gerado em: ${generatedAt} | Registros exportados: ${records.length} de ${total}${
      truncated ? " (limite de exportação atingido)" : ""
    }`,
    MARGIN,
    130,
    { size: 8 },
  );
  page.y -= 6;

  page.commands.push(
    textCommand("Filtros aplicados", MARGIN, page.y, { size: 8, bold: true }),
  );
  page.y -= LINE_HEIGHT;

  const filterLines = wrapText(describeFilters(filters), 130);
  for (const line of filterLines) {
    if (page.y - LINE_HEIGHT < MARGIN + 20) {
      page = createPage();
      pages.push(page);
      headerFactory(page, pages.length);
      page.commands.push(
        textCommand("Filtros aplicados (continuação)", MARGIN, page.y, {
          size: 8,
          bold: true,
        }),
      );
      page.y -= LINE_HEIGHT;
    }

    page.commands.push(textCommand(line, MARGIN, page.y, { size: 8 }));
    page.y -= LINE_HEIGHT;
  }

  page.y -= 8;

  records.forEach((record, index) => {
    const { heading, summary, changes } = eventLines(record);
    const estimatedLines =
      2 +
      wrapText(summary, 128).length +
      Math.max(1, changes.reduce((sum, change) => sum + wrapText(change, 122).length, 0));
    const estimatedHeight = estimatedLines * LINE_HEIGHT + 22;

    const page = ensureSpace(pages, estimatedHeight, headerFactory);

    page.commands.push(
      textCommand(`${index + 1}. ${heading}`, MARGIN, page.y, {
        size: 9,
        bold: true,
      }),
    );
    page.y -= LINE_HEIGHT;
    addWrappedText(page, summary, MARGIN, 128, { size: 8 });

    if (changes.length === 0) {
      addWrappedText(page, "Alterações: nenhuma alteração de campo identificada.", MARGIN, 124, {
        size: 8,
        indent: 10,
      });
    } else {
      addWrappedText(page, "Alterações:", MARGIN, 124, { size: 8, bold: true });
      for (const change of changes) {
        addWrappedText(page, `• ${change}`, MARGIN, 122, { size: 8, indent: 10 });
      }
    }

    page.y -= 4;
    page.commands.push(lineCommand(MARGIN, page.y, PAGE_WIDTH - MARGIN, page.y));
    page.y -= 10;
  });

  return pages;
}

function pdfObject(id: number, body: string | Uint8Array) {
  const prefix = latin1Bytes(`${id} 0 obj\n`);
  const suffix = latin1Bytes("\nendobj\n");
  const content = typeof body === "string" ? latin1Bytes(body) : body;
  return concatBytes([prefix, content, suffix]);
}

function streamObject(id: number, commands: string[]) {
  const stream = latin1Bytes(commands.join("\n"));
  const header = latin1Bytes(`${id} 0 obj\n<< /Length ${stream.length} >>\nstream\n`);
  const footer = latin1Bytes("\nendstream\nendobj\n");
  return concatBytes([header, stream, footer]);
}

function serializePdf(pages: PdfPage[]) {
  const catalogId = 1;
  const pagesId = 2;
  const regularFontId = 3;
  const boldFontId = 4;
  const firstPageId = 5;

  const objects: Uint8Array[] = [];
  const pageObjectIds: number[] = [];

  objects.push(pdfObject(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`));
  objects.push(new Uint8Array());
  objects.push(
    pdfObject(
      regularFontId,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ),
  );
  objects.push(
    pdfObject(
      boldFontId,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ),
  );

  pages.forEach((page, index) => {
    const pageId = firstPageId + index * 2;
    const contentId = pageId + 1;
    pageObjectIds.push(pageId);

    objects.push(
      pdfObject(
        pageId,
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      ),
    );
    objects.push(streamObject(contentId, page.commands));
  });

  objects[1] = pdfObject(
    pagesId,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] >>`,
  );

  const header = latin1Bytes("%PDF-1.4\n%âãÏÓ\n");
  const offsets: number[] = [0];
  let cursor = header.length;

  for (const object of objects) {
    offsets.push(cursor);
    cursor += object.length;
  }

  const xrefOffset = cursor;
  const xrefLines = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`,
    `startxref\n${xrefOffset}\n%%EOF\n`,
  ];

  return concatBytes([header, ...objects, latin1Bytes(xrefLines.join(""))]);
}

export function createAuditPdfBlob(
  records: AuditLogRecord[],
  filters: AuditPdfFilters,
  total: number,
  truncated: boolean,
) {
  const pages = buildDocument(records, filters, total, truncated);
  const bytes = serializePdf(pages);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new Blob([buffer], { type: "application/pdf" });
}

export function downloadAuditPdf(
  records: AuditLogRecord[],
  filters: AuditPdfFilters,
  total: number,
  truncated: boolean,
) {
  const blob = createAuditPdfBlob(records, filters, total, truncated);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

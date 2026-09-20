const PAGE_HEIGHT = 842;
const PAGE_WIDTH = 595;
const MARGIN_X = 42;
const START_Y = 800;
const LINE_HEIGHT = 14;
const MAX_LINE_COUNT = 54;
const MAX_VISUAL_LENGTH = 44;

const splitByVisualLength = (line) => {
  const chars = Array.from(line);
  if (chars.length === 0) return [""];
  const chunks = [];
  for (let index = 0; index < chars.length; index += MAX_VISUAL_LENGTH) {
    chunks.push(chars.slice(index, index + MAX_VISUAL_LENGTH).join(""));
  }
  return chunks;
};

const buildLines = (text) =>
  String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .flatMap(splitByVisualLength);

const unicodeHex = (text) => {
  let result = "FEFF";
  for (const char of Array.from(text)) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xffff) {
      result += codePoint.toString(16).toUpperCase().padStart(4, "0");
      continue;
    }

    const adjusted = codePoint - 0x10000;
    const high = 0xd800 + (adjusted >> 10);
    const low = 0xdc00 + (adjusted & 0x3ff);
    result += high.toString(16).toUpperCase().padStart(4, "0");
    result += low.toString(16).toUpperCase().padStart(4, "0");
  }
  return result;
};

const buildPageStream = (lines) => {
  const parts = ["BT", "/F1 9 Tf", `${MARGIN_X} ${START_Y} Td`, `${LINE_HEIGHT} TL`];
  lines.forEach((line) => {
    parts.push(`<${unicodeHex(line)}> Tj`);
    parts.push("T*");
  });
  parts.push("ET");
  return parts.join("\n");
};

const stringToArrayBuffer = (value) => {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes.buffer;
};

const buildPdfArrayBuffer = (reportText) => {
  const lines = buildLines(reportText);
  const pages = [];
  for (let index = 0; index < lines.length; index += MAX_LINE_COUNT) {
    pages.push(lines.slice(index, index + MAX_LINE_COUNT));
  }
  if (pages.length === 0) pages.push([""]);

  const objects = [];
  const addObject = (value) => {
    objects.push(value);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject(
    "<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [4 0 R] >>",
  );
  addObject(
    "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 2 >> /DW 1000 >>",
  );

  const pageIds = pages.map((pageLines) => {
    const stream = buildPageStream(pageLines);
    const contentId = addObject(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
    return addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  });
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return stringToArrayBuffer(pdf);
};

module.exports = { buildPdfArrayBuffer };

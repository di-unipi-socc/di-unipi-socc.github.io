const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BIB_FILE = path.join(ROOT, "_scripts", "sync-publications", "bibs", "bibliography.bib");
const OUTPUT_FILE = path.join(ROOT, "assets", "publications.json");

function readBibFile() {
  if (!fs.existsSync(BIB_FILE)) {
    throw new Error(`Missing bibliography source: ${BIB_FILE}`);
  }
  return fs.readFileSync(BIB_FILE, "utf8");
}

function parseBibtex(text) {
  const entries = [];
  let index = 0;

  while (index < text.length) {
    const at = text.indexOf("@", index);
    if (at === -1) break;

    let typeEnd = at + 1;
    while (typeEnd < text.length && /[A-Za-z]/.test(text[typeEnd])) {
      typeEnd += 1;
    }

    const entryType = text
      .slice(at + 1, typeEnd)
      .trim()
      .toLowerCase();
    const opener = text[typeEnd];
    const closer = opener === "(" ? ")" : "}";
    if (!entryType || (opener !== "{" && opener !== "(")) {
      index = typeEnd + 1;
      continue;
    }

    let depth = 1;
    let cursor = typeEnd + 1;
    let inQuotes = false;

    while (cursor < text.length && depth > 0) {
      const char = text[cursor];

      if (char === '"' && text[cursor - 1] !== "\\") {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === opener) depth += 1;
        if (char === closer) depth -= 1;
      }

      cursor += 1;
    }

    const raw = text.slice(at, cursor).trim();
    const body = text.slice(typeEnd + 1, cursor - 1).trim();
    const entry = parseEntryBody(entryType, body, raw);
    if (entry) entries.push(entry);

    index = cursor;
  }

  return entries;
}

function parseEntryBody(entryType, body, raw) {
  const keySeparator = findTopLevelComma(body);
  if (keySeparator === -1) return null;

  const key = body.slice(0, keySeparator).trim();
  const fieldsText = body.slice(keySeparator + 1);

  return {
    type: entryType,
    key,
    raw,
    fields: parseFields(fieldsText),
  };
}

function findTopLevelComma(text) {
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"' && text[i - 1] !== "\\") {
      inQuotes = !inQuotes;
      continue;
    }

    if (inQuotes) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (char === "," && depth === 0) return i;
  }

  return -1;
}

function parseFields(text) {
  const fields = {};
  let index = 0;

  while (index < text.length) {
    while (index < text.length && /[\s,]/.test(text[index])) index += 1;
    if (index >= text.length) break;

    let nameEnd = index;
    while (nameEnd < text.length && /[^\s=]/.test(text[nameEnd])) nameEnd += 1;
    const name = text.slice(index, nameEnd).trim().toLowerCase();
    index = nameEnd;

    while (index < text.length && /[\s=]/.test(text[index])) index += 1;
    if (!name || index >= text.length) break;

    const { value, nextIndex } = readValue(text, index);
    fields[name] = cleanValue(value);
    index = nextIndex;
  }

  return fields;
}

function readValue(text, start) {
  const first = text[start];

  if (first === "{") {
    let depth = 1;
    let cursor = start + 1;

    while (cursor < text.length && depth > 0) {
      if (text[cursor] === "{") depth += 1;
      if (text[cursor] === "}") depth -= 1;
      cursor += 1;
    }

    return {
      value: text.slice(start + 1, cursor - 1),
      nextIndex: skipDelimiter(text, cursor),
    };
  }

  if (first === '"') {
    let cursor = start + 1;
    while (cursor < text.length) {
      if (text[cursor] === '"' && text[cursor - 1] !== "\\") break;
      cursor += 1;
    }

    return {
      value: text.slice(start + 1, cursor),
      nextIndex: skipDelimiter(text, cursor + 1),
    };
  }

  let cursor = start;
  while (cursor < text.length && text[cursor] !== "," && text[cursor] !== "\n")
    cursor += 1;

  return {
    value: text.slice(start, cursor),
    nextIndex: skipDelimiter(text, cursor),
  };
}

function skipDelimiter(text, index) {
  let cursor = index;
  while (cursor < text.length && /[\s,]/.test(text[cursor])) cursor += 1;
  return cursor;
}

function cleanValue(value) {
  return (value || "")
    .replace(/[{}]/g, "")
    .replace(/\\&/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAuthors(authorField) {
  return (authorField || "")
    .split(/\s+and\s+/i)
    .map((author) => author.trim())
    .filter(Boolean)
    .map((author) => {
      if (!author.includes(",")) return author;

      const parts = author
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length < 2) return author;

      return `${parts.slice(1).join(" ")} ${parts[0]}`.trim();
    });
}

function deriveVenue(entryType, fields) {
  if (entryType === "article") return fields.journal || "";
  if (entryType === "conference") return fields.journal || fields.booktitle || "";
  if (
    entryType === "inproceedings" ||
    entryType === "incollection" ||
    entryType === "proceedings"
  ) {
    return fields.booktitle || "";
  }
  if (entryType === "phdthesis" || entryType === "mastersthesis") {
    return fields.type || fields.school || "";
  }
  if (entryType === "book") return fields.publisher || "";

  return (
    fields.journal ||
    fields.booktitle ||
    fields.school ||
    fields.publisher ||
    ""
  );
}

function deriveType(entryType, fields, venue) {
  const keywordText = (fields.keywords || "").toLowerCase();
  const venueText = (venue || "").toLowerCase();

  if (keywordText.includes("journal") || entryType === "article")
    return "journal";
  if (keywordText.includes("conference") || keywordText.includes("workshop"))
    return "conference";
  if (["conference", "inproceedings", "proceedings"].includes(entryType))
    return "conference";
  if (entryType === "incollection") return "collection";
  if (
    entryType === "phdthesis" ||
    entryType === "mastersthesis" ||
    entryType === "book"
  )
    return "books";
  if (venueText.includes("reference")) return "reference";
  if (venueText.includes("data")) return "data";

  return "informal";
}

function deriveLink(fields) {
  if (fields.doi) return `https://doi.org/${fields.doi}`;
  return fields.url || "";
}

function monthNumber(fields) {
  const raw = String(fields.month || "")
    .trim()
    .toLowerCase();
  const months = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  if (/^\d+$/.test(raw)) return Number(raw);
  return months[raw] || 0;
}

function normaliseEntry(entry) {
  const title = cleanValue(entry.fields.title || "").replace(/\.+$/, "");
  const year = String(entry.fields.year || "").trim();
  const authors = parseAuthors(entry.fields.author);
  const venue = deriveVenue(entry.type, entry.fields);

  if (!title || !/^\d{4}$/.test(year) || !authors.length) return null;

  return {
    key: entry.key,
    title,
    year,
    month: monthNumber(entry.fields),
    authors,
    venue,
    url: deriveLink(entry.fields),
    type: deriveType(entry.type, entry.fields, venue),
  };
}

function compareEntries(a, b) {
  return (
    Number(b.year) - Number(a.year) ||
    b.month - a.month ||
    a.title.localeCompare(b.title)
  );
}

function main() {
  const entries = parseBibtex(readBibFile())
    .map(normaliseEntry)
    .filter(Boolean)
    .sort(compareEntries)
    .map((entry) => ({
      key: entry.key,
      title: entry.title,
      year: entry.year,
      month: entry.month,
      authors: entry.authors,
      venue: entry.venue,
      url: entry.url,
      type: entry.type,
    }));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(entries, null, 2)}\n`);

  console.log(`Wrote ${entries.length} publications to ${OUTPUT_FILE}\n`);
}

main();

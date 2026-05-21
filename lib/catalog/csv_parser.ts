/**
 * Parser CSV minimale (RFC 4180 subset).
 *
 * Gestisce:
 *   - quote `"..."` per campi con virgole o newline
 *   - escaping `""` per double-quote dentro un campo
 *   - line ending CRLF e LF
 *   - header automatico (prima riga) → ritorna array di oggetti chiave→valore
 *
 * Estratto da awin_feed_importer.ts per riuso anche dall'endpoint
 * di upload manuale (/api/admin/catalog/upload).
 *
 * Non aggiunge dipendenze npm: dipenderebbe da papaparse/csv-parse
 * ma per il volume previsto (<10k righe per upload) un parser
 * stand-alone e' piu' semplice da audita e debuggare.
 */

export function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuote = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inQuote) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuote = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuote = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (field !== "" || cur.length > 0) {
        cur.push(field);
        rows.push(cur);
      }
      cur = [];
      field = "";
      if (ch === "\r" && content[i + 1] === "\n") i += 2;
      else i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field !== "" || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = (row[idx] ?? "").trim();
    });
    return obj;
  });
}

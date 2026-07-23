function parseCSVLine(line, separator) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === separator && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function detectSeparator(line) {
  const comma = (line.match(/,/g) || []).length;
  const semicolon = (line.match(/;/g) || []).length;
  return semicolon > comma ? ';' : ',';
}

function csvToObjects(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const separator = detectSeparator(lines[0]);
  const header = parseCSVLine(lines[0], separator).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator);
    const row = {};
    for (let c = 0; c < header.length && c < values.length; c++) {
      row[header[c]] = values[c];
    }
    if (Object.keys(row).length) rows.push(row);
  }
  return rows;
}

module.exports = { csvToObjects };

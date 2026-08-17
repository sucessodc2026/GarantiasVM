// Nomes de coluna que reconhecemos — usados para saber se a 1a linha é
// cabeçalho ou já é dado (planilha colada costuma vir sem cabeçalho).
const COLUNAS_CONHECIDAS = new Set([
  'nome', 'name', 'produto', 'codigo', 'sku', 'referencia', 'ref',
  'descricao', 'description', 'desc',
  'categoria', 'category', 'grupo', 'tipo', 'departamento',
  'cliente', 'razao_social', 'telefone', 'phone', 'celular', 'fone',
  'whatsapp', 'email', 'e-mail', 'mail', 'endereco', 'address', 'logradouro',
]);

// Ordem posicional assumida quando não há cabeçalho.
const COLUNAS_PADRAO = ['nome', 'descricao', 'categoria'];

function semAcento(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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

// Planilha colada do Excel costuma envolver a linha inteira em aspas e deixar
// TAB grudado no separador. Nada disso é dado — é formatação.
function limparLinha(linha) {
  let s = linha.trim();
  if (s.length > 1 && s.startsWith('"') && s.endsWith('"') && !s.slice(1, -1).includes('"')) {
    s = s.slice(1, -1);
  }
  return s.replace(/\t*,\t*/g, ',').replace(/\t*;\t*/g, ';');
}

function detectSeparator(line) {
  const candidatos = [
    { sep: ',',  n: (line.match(/,/g)  || []).length },
    { sep: ';',  n: (line.match(/;/g)  || []).length },
    { sep: '\t', n: (line.match(/\t/g) || []).length },
  ];
  candidatos.sort((a, b) => b.n - a.n);
  return candidatos[0].n > 0 ? candidatos[0].sep : ',';
}

function csvToObjects(text) {
  const linhas = text.split(/\r?\n/).map(limparLinha).filter((l) => l.trim());
  if (!linhas.length) return [];

  const separator = detectSeparator(linhas[0]);
  const primeira = parseCSVLine(linhas[0], separator).map((h) => semAcento(h.toLowerCase()));

  // Só é cabeçalho se alguma coluna tiver nome que conhecemos.
  const temCabecalho = primeira.some((c) => COLUNAS_CONHECIDAS.has(c));
  const header = temCabecalho ? primeira : [];
  const dados = (temCabecalho ? linhas.slice(1) : linhas).map((l) => parseCSVLine(l, separator));
  if (!dados.length) return [];

  // Colunas vazias no meio desalinham os dados em relação ao cabeçalho.
  const maxCols = Math.max(...dados.map((v) => v.length), header.length);
  if (header.length && maxCols > header.length) {
    const vazias = [];
    for (let c = 0; c < maxCols; c++) {
      if (dados.every((v) => !v[c] || !v[c].trim())) vazias.push(c);
    }
    const remover = new Set(vazias.slice(0, maxCols - header.length));
    if (remover.size) {
      for (let i = 0; i < dados.length; i++) {
        dados[i] = dados[i].filter((_, c) => !remover.has(c));
      }
    }
  }

  const rows = [];
  for (const values of dados) {
    const row = {};
    for (let c = 0; c < values.length; c++) {
      let nome;
      if (header.length) {
        nome = header[c] && header[c].trim() ? header[c] : `col_${c + 1}`;
      } else {
        // Sem cabeçalho: assume nome, descrição, categoria pela posição.
        nome = COLUNAS_PADRAO[c] || `col_${c + 1}`;
      }
      row[nome] = values[c];
    }
    if (Object.keys(row).length) rows.push(row);
  }
  return rows;
}

module.exports = { csvToObjects };

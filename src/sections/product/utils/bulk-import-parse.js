import * as XLSX from 'xlsx';

// ----------------------------------------------------------------------

export function createEmptyRow() {
  return {
    key: `${Date.now()}-${Math.random()}`,
    name: '',
    category_id: null,
    pending_category_name: '',
    quantity: '1',
    costPrice: '',
    price: '',
    taxes: '0',
    product_kind: 'sellable',
    is_pack: false,
    quantity_per_pack: '',
    cost_price_per_pack: '',
    pack_sell_price: '',
    allow_variable_price: false,
    variable_price_min: '',
    variable_price_max: '',
  };
}

function normKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * Best-effort match for an imported category label against existing categories
 * (exact match is handled by callers; this covers typos and close names).
 */
export function matchCategoryFromList(rawName, categories) {
  const list = categories || [];
  const needle = normKey(rawName);
  if (!needle) return null;

  const MIN_SCORE = 0.82;
  let best = null;
  let bestScore = 0;

  for (let i = 0; i < list.length; i += 1) {
    const c = list[i];
    const hay = normKey(c.name);
    if (hay) {
      let score = 0;
      const shorter = needle.length <= hay.length ? needle : hay;
      const longer = needle.length <= hay.length ? hay : needle;
      if (shorter.length >= 4 && longer.includes(shorter)) {
        score = 0.88 + 0.1 * (shorter.length / longer.length);
        if (score > 0.98) score = 0.98;
      } else {
        const d = levenshtein(needle, hay);
        const maxLen = Math.max(needle.length, hay.length) || 1;
        score = 1 - d / maxLen;
      }

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }

  if (bestScore >= MIN_SCORE) return best;
  return null;
}

/** First matching non-empty value for any of the candidate header names (exact key match after normalize). */
function pick(record, ...candidates) {
  const keyMap = Object.fromEntries(
    Object.keys(record).map((k) => [normKey(k), k])
  );
  return candidates.reduce((found, cand) => {
    if (found) return found;
    const origKey = keyMap[normKey(cand)];
    if (!origKey) return found;
    const v = record[origKey];
    if (v === '' || v == null) return found;
    return String(v).trim();
  }, '');
}

function parseBool(v) {
  const s = String(v || '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y' || s === 'on';
}

const POSITIONAL_KEYS = [
  'Name',
  'Category',
  'Qty',
  'Cost Price',
  'Selling Price',
  'Is Pack',
  'Qty per Pack',
  'Cost per Pack',
];

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((c) => c.replace(/^"|"$/g, ''));
}

function looksLikeHeaderRow(cells) {
  const n0 = normKey(cells[0] || '');
  if (['name', 'product name', 'item', 'title', 'product'].includes(n0)) return true;
  return cells.some((c) => {
    const n = normKey(c || '');
    return ['category', 'quantity', 'qty', 'price', 'selling price', 'cost'].includes(n);
  });
}

function linesToPositionalRecords(lines) {
  return lines
    .map((line) => parseCsvLine(line))
    .filter((cols) => {
      const firstCol = (cols[0] || '').toLowerCase();
      const isHeader =
        firstCol === 'name' || firstCol === 'product name' || firstCol === 'item';
      return !isHeader && Boolean(cols[0]);
    })
    .map((cols) =>
      POSITIONAL_KEYS.reduce((acc, key, i) => {
        acc[key] = cols[i] ?? '';
        return acc;
      }, {})
    );
}

/**
 * Map one sheet row (object keys = column headers) to a bulk table row.
 */
export function mapRecordToBulkRow(record, categories) {
  const list = categories || [];

  const name = pick(record, 'name', 'product name', 'product', 'item', 'title');
  if (!name) return null;

  const categoryStr = pick(record, 'category', 'category name', 'cat');
  let category_id = null;
  let pending_category_name = '';
  if (categoryStr.trim()) {
    const exact = list.find((c) => normKey(c.name) === normKey(categoryStr));
    if (exact) {
      category_id = exact.id;
    } else {
      const near = matchCategoryFromList(categoryStr, list);
      if (near) {
        category_id = near.id;
      } else {
        pending_category_name = categoryStr.trim();
      }
    }
  }

  const qPerPack = pick(
    record,
    'qty per pack',
    'units per pack',
    'quantity per pack',
    'pack size',
    'units in pack'
  );
  const costPerPack = pick(record, 'cost per pack', 'pack cost', 'purchase cost per pack');

  let isPack = parseBool(pick(record, 'is pack', 'pack', 'pack product', 'packed'));
  if (!isPack && qPerPack && Number(qPerPack) > 0 && costPerPack !== '' && Number(costPerPack) >= 0) {
    isPack = true;
  }

  const allowVar = parseBool(
    pick(record, 'variable price', 'allow variable', 'variable', 'variable pricing')
  );
  const vmin = pick(record, 'min price', 'variable min', 'price min', 'min');
  const vmax = pick(record, 'max price', 'variable max', 'price max', 'max');

  const prodInput = parseBool(
    pick(record, 'input only', 'production input', 'raw material', 'not sold', 'ingredient')
  );

  const quantity =
    pick(record, 'quantity', 'qty', 'stock', 'number of packs', 'pack count', 'packs') || '1';

  const costUnit = pick(record, 'unit cost', 'cost', 'cost price', 'purchase cost');
  const selling =
    pick(record, 'selling price', 'sale price', 'selling', 'retail price') ||
    pick(record, 'price', 'amount');

  const taxes = pick(record, 'tax', 'taxes', 'tax %', 'vat') || '0';

  return {
    ...createEmptyRow(),
    name,
    category_id,
    pending_category_name,
    quantity,
    costPrice: costUnit,
    price: selling,
    taxes,
    product_kind: prodInput ? 'production_input' : 'sellable',
    is_pack: isPack && !prodInput,
    quantity_per_pack: qPerPack,
    cost_price_per_pack: costPerPack,
    allow_variable_price: allowVar && !prodInput,
    variable_price_min: vmin,
    variable_price_max: vmax,
  };
}

/** Paste: positional columns (same order as legacy paste). */
export function parsePositionalPasteText(text, categories) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const records = linesToPositionalRecords(lines);
  return records.map((r) => mapRecordToBulkRow(r, categories)).filter(Boolean);
}

function csvTextToRecordObjects(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const firstCells = parseCsvLine(lines[0]);
  if (looksLikeHeaderRow(firstCells)) {
    const headers = firstCells;
    return lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      return headers.reduce((acc, h, i) => {
        acc[String(h).trim()] = cols[i] ?? '';
        return acc;
      }, {});
    });
  }
  return linesToPositionalRecords(lines);
}

/**
 * Parse a .csv, .xlsx, or .xls file into bulk table rows (with unique keys).
 */
export async function parseBulkUploadFile(file, categories) {
  const lower = (file.name || '').toLowerCase();
  let records = [];

  if (lower.endsWith('.csv')) {
    const text = await file.text();
    records = csvTextToRecordObjects(text);
  } else {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    if (!wb.SheetNames.length) return [];
    const sheet = wb.Sheets[wb.SheetNames[0]];
    records = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  }

  return records
    .map((rec) => mapRecordToBulkRow(rec, categories))
    .filter((row) => row && row.name);
}

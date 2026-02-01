
import fs from 'fs';

// Mock File API
class File {
  constructor(content, name) {
    this.content = content;
    this.name = name;
  }
  async text() { return this.content; }
}

// EXACT Logic from utils/importHelpers.ts
const parseImportFile = async (file) => {
  const text = await file.text();

  const parseCSV = (text, delimiter) => {
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0 || currentCell.length > 0) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    return rows;
  };

  const detectDelimiter = (text) => {
    const firstLineEnd = text.indexOf('\n');
    const sample = text.substring(0, firstLineEnd === -1 ? Math.min(text.length, 1000) : firstLineEnd);
    const candidates = [',', ';', '\t', '|'];
    let best = ',';
    let max = 0;
    candidates.forEach(d => {
      const count = sample.split(d).length - 1;
      if (count > max) { max = count; best = d; }
    });
    return best;
  };

  const delimiter = detectDelimiter(text);
  const rows = parseCSV(text, delimiter);

  // Header cleaning mock
  const cleanHeader = (h) => h.toLowerCase().trim().replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '');
  const headers = rows[0].map(cleanHeader);

  // Row object mapping
  const dataRows = rows.slice(1).map(cells => {
    const rowObj = {};
    headers.forEach((h, i) => {
      rowObj[h] = cells[i] || '';
    });
    return rowObj;
  });

  return { headers, rows: dataRows };
};

(async () => {
  console.log("--- Running Parser Torture Test ---");
  const content = fs.readFileSync('fixtures/torture_test.csv', 'utf8');
  const file = new File(content, 'torture_test.csv');
  const result = await parseImportFile(file);

  console.log("Headers:", result.headers);
  console.log("Total Rows Found:", result.rows.length);

  // Expect 5 rows
  if (result.rows.length === 5) {
    console.log("SUCCESS: Correct number of rows.");
  } else {
    console.error(`FAILURE: Expected 5 rows, got ${result.rows.length}`);
  }

  // Verify Multiline Storage
  // Row index 3 (0-indexed dataRows) -> "Multiline Store"
  // 'store name', 'website', 'description', 'tags'
  const multilineRow = result.rows.find(r => r['store name'].includes('Multiline'));
  if (multilineRow) {
    console.log("Multiline Row Name:", multilineRow['store name'].replace(/\n/g, '\\n'));
    console.log("Multiline Row Desc:", multilineRow['description'].replace(/\n/g, '\\n'));
    if (multilineRow['store name'].includes('Store') && multilineRow['description'].includes('newlines')) {
      console.log("SUCCESS: Multiline content preserved.");
    } else {
      console.error("FAILURE: Multiline content corrupted.");
    }
  } else {
    console.error("FAILURE: Multiline row not found or merged.");
  }
})();

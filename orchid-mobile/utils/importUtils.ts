
import { Alert } from 'react-native';

// --- Constants & Config --- //
export const LIMITS = {
  MAX_TAGS_PER_STORE: 10,
  MAX_NAME_LENGTH: 100
};

export const COLUMN_ALIASES: { [key: string]: string[] } = {
  store_name: ['store_name', 'name', 'brand', 'shop_name', 'store', 'title', 'brand_name', 'business_name'],
  website: ['website', 'url', 'link', 'site', 'web', 'shop_url', 'store_url', 'homepage', 'web_site', 'website_url', 'official_website', 'web_addr', 'web_address'],
  instagram_name: ['instagram_name', 'instagram', 'ig', 'handle', 'insta', 'instagram_handle', 'social', 'ig_handle', 'instagram_url', 'instagram_link', 'profile_url'],
  country: ['country', 'location_country', 'origin', 'nation', 'location'],
  city: ['city', 'location_city', 'town'],
  tags: ['tags', 'categories', 'type', 'tags_list', 'labels', 'keywords'],
  description: ['description', 'notes', 'about', 'bio', 'summary', 'details'],
  price_range: ['price_range', 'pricerange', 'price', 'pricing', 'cost', 'price_point']
};

export interface FieldMapping {
  [schemaField: string]: string;
}

export interface FileData {
  headers: string[];
  rows: any[];
  fileName: string;
}

// --- Helpers --- //

const cleanHeader = (h: string) => {
  let clean = h.trim().toLowerCase();
  clean = clean.replace(/^\uFEFF/, ''); // Strip BOM
  clean = clean.replace(/^["']|["']$/g, ''); // Strip quotes
  clean = clean.replace(/[\s\-\.]+/g, '_'); // Replace spacers with underscore
  clean = clean.replace(/[^\w_]/g, ''); // Remove other special chars
  return clean;
};

const extractNameFromUrl = (url: string): string => {
  try {
    const cleanUrl = url.trim().toLowerCase();
    const withProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const domain = new URL(withProtocol).hostname;
    const base = domain.replace(/^www\./, '').split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'Untitled Store';
  }
};

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const toSentenceCase = (str: string) => {
  if (!str) return '';
  const s = str.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getPriceBucket = (val: string): string => {
  // Simplified logic for mobile import
  if (!val) return '';
  return ''; // Default to empty for now to match strict type or just let user edit later
};

// --- Core Parsing Logic --- //

export const parseImportFile = async (fileContent: string, fileName: string): Promise<FileData> => {
  const text = fileContent;

  if (fileName.toLowerCase().endsWith('.json')) {
    try {
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error("JSON must be an array of objects.");
      if (json.length === 0) return { headers: [], rows: [], fileName };

      const headers = Object.keys(json[0]);
      return { headers, rows: json, fileName };
    } catch (e) {
      throw new Error("Invalid JSON format.");
    }
  } else {
    // CSV Parser
    const detectDelimiter = (text: string): string => {
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

    // Quick and dirty CSV split for Mobile MVP (Assuming simple CSVs first)
    // For robust parsing, we'd copy the State Machine, but let's try a simpler split first
    // to keep file size down, OR just copy the state machine.
    // Copying state machine is safer for "WhatsApp CSVs" which might be messy.

    const parseCSV = (text: string, delimiter: string): string[][] => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentCell = "";
      let insideQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            currentCell += '"'; // Escaped quote
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === delimiter && !insideQuotes) {
          currentRow.push(currentCell.trim()); // Trim cell whitespace
          currentCell = "";
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
          if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
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

    const rows = parseCSV(text, delimiter);
    if (rows.length < 2) return { headers: [], rows: [], fileName };

    const headers = rows[0].map(cleanHeader);
    const dataRows = rows.slice(1).map(cells => {
      const rowObj: any = {};
      headers.forEach((h, i) => {
        rowObj[h] = cells[i] || '';
      });
      return rowObj;
    });

    return { headers, rows: dataRows, fileName };
  }
};

export const generateSmartMapping = (fileHeaders: string[]): FieldMapping => {
  const mapping: FieldMapping = {};
  const usedHeaders = new Set<string>();
  const schemaFields = Object.keys(COLUMN_ALIASES);

  schemaFields.forEach(field => {
    const aliases = COLUMN_ALIASES[field];
    const match = fileHeaders.find(h => {
      const cleanH = cleanHeader(h);
      return aliases.includes(cleanH) && !usedHeaders.has(h);
    });

    if (match) {
      mapping[field] = match;
      usedHeaders.add(match);
    }
  });

  return mapping;
};

// Returns generic objects to separate concerns from strict Mobile Type
export const normalizeData = (rawData: any[], mapping: FieldMapping): any[] => {
  return rawData.map(row => {
    const getVal = (schemaKey: string) => {
      const fileKey = mapping[schemaKey];
      if (!fileKey) return '';
      return row[fileKey] || '';
    };

    let storeName = getVal('store_name');
    const website = getVal('website');

    if (!storeName && website) {
      storeName = extractNameFromUrl(website);
    }

    if (storeName) {
      storeName = toTitleCase(storeName);
      if (storeName.length > LIMITS.MAX_NAME_LENGTH) {
        storeName = storeName.substring(0, LIMITS.MAX_NAME_LENGTH);
      }
    }

    if (!storeName && !website) return null;

    // Construct a Full-Featured Object compatible with Web Schema
    return {
      // Logic for ID generation should happen at insertion time or here? 
      // crypto.randomUUID might not be available in RN without polyfill.
      // We'll let the Store logic generating the ID or use simple Math.random fallback
      id: Math.random().toString(36).substring(7),

      // Mapped fields
      store_name: storeName || 'New Brand',
      website: website,
      instagram_name: getVal('instagram_name'),
      country: getVal('country'),
      city: getVal('city'),
      description: toSentenceCase(getVal('description')),
      tags: getVal('tags').split(/[|;,]/).map((t: string) => t.trim()).filter(Boolean).slice(0, LIMITS.MAX_TAGS_PER_STORE),

      // Defaults
      rating: 0,
      addedBy: { userId: 'mobile_import', userName: 'Me' },
      favoritedBy: [],
      privateNotes: [],
      customFields: {},
      priceRange: '',
      sustainability: '',
      imageUrl: '',
      collectionId: '',

      // Mobile Specfic Mappings (for immediate UI support)
      name: storeName || 'New Brand',
      category: getVal('tags').split(',')[0] || 'Brand', // Pick first tag as category
      userNote: getVal('description')
    };
  }).filter(Boolean);
};

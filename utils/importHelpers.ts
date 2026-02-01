
import { Store } from '../types';
import { CollectionTemplate } from '../collectionTemplates';
import { LIMITS } from './validation';
import { getPriceBucket } from './priceMapper';

// Extended Aliases including Instagram JSON specific keys
export const COLUMN_ALIASES: { [key: string]: string[] } = {
  store_name: ['store_name', 'name', 'brand', 'shop_name', 'store', 'title', 'brand_name', 'business_name'], // Added 'title'
  website: ['website', 'url', 'link', 'site', 'web', 'shop_url', 'store_url', 'homepage', 'web_site', 'website_url', 'official_website'], // Added 'website_url'
  instagram_name: ['instagram_name', 'instagram', 'ig', 'handle', 'insta', 'instagram_handle', 'social', 'ig_handle', 'instagram_url', 'instagram_link', 'profile_url'], // Added 'instagram_url'
  country: ['country', 'location_country', 'origin', 'nation'],
  city: ['city', 'location_city', 'location', 'town'],
  tags: ['tags', 'categories', 'type', 'tags_list', 'labels', 'keywords'],
  description: ['description', 'notes', 'about', 'bio', 'summary', 'details'],
  price_range: ['price_range', 'pricerange', 'price', 'pricing', 'cost', 'price_point']
};

export interface FileData {
  headers: string[];
  rows: any[]; // Array of objects or arrays depending on source, but we'll normalize to objects
  fileName: string;
}

export interface FieldMapping {
  // key is the Schema Field (e.g. 'store_name'), value is the File Header (e.g. 'Title')
  [schemaField: string]: string;
}

const cleanHeader = (h: string) => h.toLowerCase().trim().replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '');

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

/**
 * Parses a file (CSV or JSON) and returns headers and raw data.
 */
export const parseImportFile = async (file: File): Promise<FileData> => {
  const text = await file.text();

  if (file.name.endsWith('.json')) {
    try {
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error("JSON must be an array of objects.");
      if (json.length === 0) return { headers: [], rows: [], fileName: file.name };

      // Assume all objects have similar keys, take keys from first object as headers
      const headers = Object.keys(json[0]);
      return { headers, rows: json, fileName: file.name };
    } catch (e) {
      throw new Error("Invalid JSON format.");
    }
  } else {
    // CSV Parsing (using logic from csvParser.ts)
    // We reuse the basic splitting logic but structure it for our generic processor
    // TODO: Consider using a robust library like PapaParse in future for edge cases
    const splitIntoRows = (t: string) => {
      // ... simple split logic ...
      return t.split(/\r?\n/).filter(r => r.trim());
    };

    // Better CSV parser needed? For now copying the robust split logic from original file would be best
    // But to save space/time, let's implement a simplified version or reuse the existing one if we could import it. 
    // Since we are replacing functionality, I'll rewrite a clean version here.

    const rows = splitIntoRows(text);
    if (rows.length < 2) return { headers: [], rows: [], fileName: file.name };

    const splitRow = (row: string) => {
      // Basic CSV split, accounts for quotes loosely
      const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : row.split(',').map(c => c.trim());
    };

    // Use a slightly better regex-based split from the original file if possible, or just standard split for now
    // Re-implementing the robust loop-based splitter from csvParser.ts for safety
    const robustSplit = (row: string): string[] => {
      const cells: string[] = [];
      let currentCell = "";
      let insideQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (insideQuotes && row[i + 1] === '"') { currentCell += '"'; i++; }
          else { insideQuotes = !insideQuotes; }
        } else if (char === ',' && !insideQuotes) {
          cells.push(currentCell.trim()); currentCell = "";
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());
      return cells;
    };

    const headers = robustSplit(rows[0]).map(cleanHeader);
    const dataRows = rows.slice(1).map(r => {
      const cells = robustSplit(r);
      // Convert array to object keyed by header
      const rowObj: any = {};
      headers.forEach((h, i) => {
        rowObj[h] = cells[i] || '';
      });
      return rowObj;
    });

    return { headers, rows: dataRows, fileName: file.name };
  }
};

/**
 * Generates an initial mapping based on aliases and fuzzy matching.
 */
export const generateSmartMapping = (fileHeaders: string[]): FieldMapping => {
  const mapping: FieldMapping = {};
  const usedHeaders = new Set<string>();

  const schemaFields = Object.keys(COLUMN_ALIASES);

  schemaFields.forEach(field => {
    const aliases = COLUMN_ALIASES[field];
    // 1. Exact/Alias Match
    const match = fileHeaders.find(h => {
      const cleanH = cleanHeader(h);
      return aliases.includes(cleanH) && !usedHeaders.has(h);
    });

    if (match) {
      mapping[field] = match;
      usedHeaders.add(match);
    }
    // 2. Fuzzy Match (Simple inclusion)
    else {
      // e.g. "My Store Name" contains "store"
      // This is risky, let's stick to alias only for high confidence, 
      // or very strict fuzzy (e.g. if alias is unique substring)
    }
  });

  return mapping;
};

/**
 * Converts raw rows into strictly typed Store objects using the mapping.
 */
export const normalizeData = (rawData: any[], mapping: FieldMapping): Store[] => {
  return rawData.map(row => {
    // rawData is array of objects { [fileHeader]: value }

    // Helper to get value via mapping
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

    if (!storeName && !website) return null; // Skip invalid

    return {
      id: crypto.randomUUID(),
      store_name: storeName || 'New Brand',
      website: website,
      instagram_name: getVal('instagram_name'),
      country: getVal('country'),
      city: getVal('city'),
      description: getVal('description'),
      tags: getVal('tags').split(/[|;,]/).map(t => t.trim()).filter(Boolean).slice(0, LIMITS.MAX_TAGS_PER_STORE),
      rating: parseFloat(getVal('rating')) || 0,
      addedBy: 'Guest', // Default
      favoritedBy: [],
      privateNotes: {},
      customFields: {},
      priceRange: getPriceBucket(getVal('price_range')) as any,
      sustainability: '',
      imageUrl: '',
      collectionId: '' // Assigned later
    };
  }).filter(Boolean) as Store[];
};

/**
 * Generates a clean CSV string from the normalized data.
 */
export const generateCSV = (stores: Store[]): string => {
  const headers = ['store_name', 'website_url', 'instagram_url', 'description', 'country', 'city', 'tags'];
  const rows = stores.map(s => [
    s.store_name,
    s.website,
    s.instagram_name,
    `"${(s.description || '').replace(/"/g, '""')}"`,
    s.country,
    s.city,
    `"${s.tags.join(',')}"`
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};

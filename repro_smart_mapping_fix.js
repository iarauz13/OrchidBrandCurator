
// Mock strict aliases from importHelpers.ts
const COLUMN_ALIASES = {
  store_name: ['store_name', 'name', 'brand', 'shop_name', 'store', 'title', 'brand_name', 'business_name'],
  website: ['website', 'url', 'link', 'site', 'web', 'shop_url', 'store_url', 'homepage', 'web_site', 'website_url', 'official_website', 'web_addr', 'web_address'], // Added web_addr
  instagram_name: ['instagram_name', 'instagram', 'ig', 'handle', 'insta', 'instagram_handle', 'social', 'ig_handle', 'instagram_url', 'instagram_link', 'profile_url'],
  country: ['country', 'location_country', 'origin', 'nation', 'location'], // Added location
  city: ['city', 'location_city', 'town'], // Removed location
  tags: ['tags', 'categories', 'type', 'tags_list', 'labels', 'keywords'],
  description: ['description', 'notes', 'about', 'bio', 'summary', 'details'],
  price_range: ['price_range', 'pricerange', 'price', 'pricing', 'cost', 'price_point']
};

// Proposed cleanHeader: normalize spaces/hyphens to underscores
const cleanHeader = (h) => {
  // 1. Lowercase and trim
  let clean = h.toLowerCase().trim();
  // 2. Remove BOM and quotes
  clean = clean.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '');
  // 3. Replace spaces, hyphens, dots with underscores
  clean = clean.replace(/[\s\-\.]+/g, '_');
  // 4. Remove any other non-alphanumeric chars (except underscore)
  clean = clean.replace(/[^\w_]/g, '');
  return clean;
};

const generateSmartMapping = (fileHeaders) => {
  const mapping = {};
  const usedHeaders = new Set();
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

// Test Case: weird_headers.csv
const testHeaders = ['Brand Name', 'Web Addr', 'IG Handle', 'Notes', 'Location'];

const result = generateSmartMapping(testHeaders);
console.log("Mapping Result:", result);

// Expected:
// store_name: 'Brand Name' -> clean: 'brand_name' (MATCHES 'brand_name' alias)
// website: 'Web Addr' -> clean: 'web_addr' (matches new alias)
// instagram_name: 'IG Handle' -> clean: 'ig_handle' (MATCHES 'ig_handle' alias)
// description: 'Notes' -> clean: 'notes'
// country: 'Location' -> clean: 'location' (matches new alias)

const missing = [];
if (!result.store_name) missing.push('store_name');
if (!result.website) missing.push('website');
if (!result.instagram_name) missing.push('instagram_name');
if (!result.country) missing.push('country'); // Should be mapped now

if (missing.length > 0) {
  console.log("FAILED: Missing mappings for:", missing.join(', '));
  process.exit(1);
} else {
  console.log("SUCCESS: All critical fields mapped.");
}

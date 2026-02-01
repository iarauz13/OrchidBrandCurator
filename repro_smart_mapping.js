
// Mock strict aliases from importHelpers.ts
const COLUMN_ALIASES = {
  store_name: ['store_name', 'name', 'brand', 'shop_name', 'store', 'title', 'brand_name', 'business_name'],
  website: ['website', 'url', 'link', 'site', 'web', 'shop_url', 'store_url', 'homepage', 'web_site', 'website_url', 'official_website'],
  instagram_name: ['instagram_name', 'instagram', 'ig', 'handle', 'insta', 'instagram_handle', 'social', 'ig_handle', 'instagram_url', 'instagram_link', 'profile_url'],
  country: ['country', 'location_country', 'origin', 'nation'],
  city: ['city', 'location_city', 'location', 'town'],
  tags: ['tags', 'categories', 'type', 'tags_list', 'labels', 'keywords'],
  description: ['description', 'notes', 'about', 'bio', 'summary', 'details'],
  price_range: ['price_range', 'pricerange', 'price', 'pricing', 'cost', 'price_point']
};

// Current implementation of cleanHeader
const cleanHeader = (h) => h.toLowerCase().trim().replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '');

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
// store_name: 'Brand Name'
// website: 'Web Addr'
// instagram_name: 'IG Handle'
// description: 'Notes'
// city/country: 'Location'

const missing = [];
if (!result.store_name) missing.push('store_name');
if (!result.website) missing.push('website');
if (!result.instagram_name) missing.push('instagram_name');

if (missing.length > 0) {
  console.log("FAILED: Missing mappings for:", missing.join(', '));
  process.exit(1);
} else {
  console.log("SUCCESS: All critical fields mapped.");
}

import axios from 'axios';
import * as cheerio from 'cheerio';

const TEST_URLS = [
  'https://www.nike.com',
  'https://www.apple.com',
  'https://www.patagonia.com',
  'https://www.glossier.com', // Beauty brand
  'https://www.bluebottlecoffee.com', // Coffee
];

async function extractMetadata(url) {
  try {
    console.log(`\nAnalyzing: ${url}...`);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(data);

    // Tier 1: Open Graph / Twitter Cards
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');

    // Tier 2: Favicon / Logo (Simple heuristic)
    const icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');

    // Tier 3: First large image (Very naive fallback)
    let firstBodyImage = null;
    $('img').each((i, el) => {
      if (firstBodyImage) return;
      const src = $(el).attr('src');
      if (src && !src.endsWith('.svg') && !src.includes('logo')) {
        // In a real agent we'd check dimensions here
        firstBodyImage = src;
      }
    });

    return {
      success: true,
      ogImage,
      twitterImage,
      icon,
      fallback: firstBodyImage
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runSpike() {
  console.log("=== AI Enrichment Spike: OG Tag Extraction ===");

  for (const url of TEST_URLS) {
    const result = await extractMetadata(url);
    if (result.success) {
      console.log(`[SUCCESS] ${url}`);
      console.log(`   OG Image: ${result.ogImage || 'MISSING'}`);
      console.log(`   Fallback: ${result.fallback || 'MISSING'}`);
    } else {
      console.log(`[FAILED] ${url}: ${result.error}`);
    }
  }
}

runSpike();

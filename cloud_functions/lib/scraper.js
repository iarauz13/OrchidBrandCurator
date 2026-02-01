"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeStore = void 0;
const puppeteer = require("puppeteer");
async function scrapeStore(url) {
    console.log(`[Scraper] Launching browser for: ${url}`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Cloud Functions environment
    });
    try {
        const page = await browser.newPage();
        // Set a realistic User Agent to avoid being blocked by simple bot detectors
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        // Block images/fonts to speed up loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        // Navigate with a timeout
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // Extract Open Graph and Meta data
        const metadata = await page.evaluate(() => {
            const getMeta = (prop) => document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
                document.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');
            return {
                title: getMeta('og:title') || document.title,
                description: (getMeta('og:description') || getMeta('description')) ?? undefined,
                image: getMeta('og:image') ?? undefined
            };
        });
        console.log(`[Scraper] Success:`, metadata);
        return metadata;
    }
    catch (error) {
        console.error(`[Scraper] Failed to scrape ${url}:`, error);
        // Return empty on failure to prevent crashing the whole function
        return {};
    }
    finally {
        await browser.close();
    }
}
exports.scrapeStore = scrapeStore;
//# sourceMappingURL=scraper.js.map
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { scrapeStore } from "./scraper";

admin.initializeApp();

// Gen 2 Configuration
setGlobalOptions({ maxInstances: 10, memory: "2GiB", timeoutSeconds: 300 });

export const enrichNewStore = onDocumentCreated(
  "collections/{collectionId}/stores/{storeId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const store = snap.data();
    const storeId = event.params.storeId;

    if (!store) return null;

    // 1. Validation: Do we have a website?
    // In the future (Phase 3.1), we will add Search logic here if website is missing.
    const url = store.website;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      console.log(`[Enrichment] Skipping ${storeId}: No valid URL provided.`);
      return null;
    }

    // 2. Optimization: Do we already have data?
    // If the user manually entered a description or image, don't overwrite it immediately.
    // Logic: Only enrich if description is "short" (placeholder) or missing.
    const hasDescription = store.description && store.description.length > 50;
    const hasImage = !!store.imageUrl;

    if (hasDescription && hasImage) {
      console.log(`[Enrichment] Skipping ${storeId}: Already enriched.`);
      return null;
    }

    console.log(`[Enrichment] Processing ${storeId} - URL: ${url}`);

    try {
      // 3. Execution: Scrape
      const metadata = await scrapeStore(url);

      // 4. Update: Write back to Firestore
      const updates: any = {};

      if (!hasDescription && metadata.description) {
        updates.description = metadata.description;
      }

      // If we got a title and the user's title was generic (optional optimization), we could update it.
      // For now, we trust the user's specific store name, but maybe add a 'metaTitle' field?
      // tailored for now to just description and image.

      if (!hasImage && metadata.image) {
        updates.imageUrl = metadata.image;
      }

      if (Object.keys(updates).length > 0) {
        updates.enrichedAt = admin.firestore.FieldValue.serverTimestamp();
        await snap.ref.update(updates);
        console.log(`[Enrichment] Updated ${storeId} with:`, Object.keys(updates));
      } else {
        console.log(`[Enrichment] No useful metadata found for ${storeId}.`);
      }

    } catch (error) {
      console.error(`[Enrichment] Critical Error processing ${storeId}:`, error);
    }

    return null;
  });

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// Config from your recent setup
const firebaseConfig = {
  apiKey: "AIzaSyAOzFVAZLQd_p8yymLQ8uRQ-n5HXMV48oY",
  authDomain: "orchid-40c23.firebaseapp.com",
  projectId: "orchid-40c23",
  storageBucket: "orchid-40c23.firebasestorage.app",
  messagingSenderId: "90319793030",
  appId: "1:90319793030:web:a54f328b741a26e69fda07"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runVerification() {
  const storeId = "test-glossier-" + Date.now();
  const docRef = doc(db, "collections", "verification-test", "stores", storeId);

  console.log(`[Test] 1. Creating Store: Glossier (${storeId})...`);
  console.log(`[Test]    Data: { name: "Glossier", website: "https://www.glossier.com" }`);

  // Create initial store (without image/description)
  await setDoc(docRef, {
    name: "Glossier",
    website: "https://www.glossier.com",
    createdAt: new Date().toISOString()
  });

  console.log(`[Test] 2. Store created. Listening for AI Enrichment (timeout: 30s)...`);

  const unsubscribe = onSnapshot(docRef, (snap) => {
    const data = snap.data();
    if (data?.imageUrl || data?.description) {
      console.log("\n✅ [SUCCESS] AI Enrichment Received!");
      console.log("---------------------------------------------------");
      console.log(`Top Image:   ${data.imageUrl || "N/A"}`);
      console.log(`Description: ${data.description || "N/A"}`);
      console.log("---------------------------------------------------");
      unsubscribe();
      process.exit(0);
    }
  });

  // Timeout after 30 seconds
  setTimeout(() => {
    console.error("\n❌ [TIMEOUT] No enrichment received after 30s.");
    console.error("Possible causes: Cloud Function failed, Website blocked scraper, or Cold Start delay.");
    unsubscribe();
    process.exit(1);
  }, 30000);
}

runVerification();

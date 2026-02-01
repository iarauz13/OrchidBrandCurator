import fs from 'fs';
import path from 'path';

/**
 * ORCHID ASSET JANITOR
 * Standardizes messy frame names (e.g. orchid_001_delay...png -> orchid_001.png)
 * Execute from project root: node clean_assets.js
 */

const targetDir = path.join(process.cwd(), 'public', 'orchid');

console.log('--- ARCHIVE CLEANUP STARTING ---');
console.log(`Directory: ${targetDir}`);

if (!fs.existsSync(targetDir)) {
  console.error('Error: public/orchid folder not found. Please ensure it exists.');
  process.exit(1);
}

// 1. Read all files
const files = fs.readdirSync(targetDir);

// 2. Filter for PNGs and sort them naturally (handles 001 before 100)
const pngFiles = files
  .filter(f => f.toLowerCase().endsWith('.png'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

if (pngFiles.length === 0) {
  console.warn('No PNG files found to process.');
  process.exit(0);
}

console.log(`Found ${pngFiles.length} frames. Standardizing names...`);

// 3. Rename sequence
pngFiles.forEach((oldName, index) => {
  const frameNumber = (index + 1).toString().padStart(3, '0');
  const newName = `orchid_${frameNumber}.png`;
  
  const oldPath = path.join(targetDir, oldName);
  const newPath = path.join(targetDir, newName);

  if (oldName !== newName) {
    fs.renameSync(oldPath, newPath);
    if (index % 10 === 0 || index === pngFiles.length - 1) {
      console.log(`[RENAMED] ${oldName} -> ${newName}`);
    }
  }
});

console.log('--- CLEANUP COMPLETE ---');
console.log(`Registry ready: orchid_001.png through orchid_${pngFiles.length.toString().padStart(3, '0')}.png`);

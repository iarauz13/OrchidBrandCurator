const fs = require('fs');
const path = require('path');

// Target directory: [Project Root]/public/orchid
const dir = path.join(process.cwd(), 'public', 'orchid');

console.log(`📂 Scanning directory: ${dir}`);

if (!fs.existsSync(dir)) {
  console.error(`❌ Error: Folder not found at ${dir}`);
  console.log('Suggestion: Ensure your folder is named "orchid" and is inside the "public" directory.');
  process.exit(1);
}

// 1. Get files and filter for images
const files = fs.readdirSync(dir)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.webp' || ext === '.png' || ext === '.jpg' || ext === '.jpeg';
  })
  // 2. Natural sort to preserve animation order (handles 029 vs 100 correctly)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

if (files.length === 0) {
  console.error('❌ Error: No image files found in the orchid folder.');
  process.exit(1);
}

console.log(`🚀 Found ${files.length} files. Starting sequential rename...`);

// 3. Sequential Rename starting at 001
files.forEach((oldName, index) => {
  const ext = path.extname(oldName).toLowerCase();
  const newName = `orchid_${String(index + 1).padStart(3, '0')}${ext}`;
  
  const oldPath = path.join(dir, oldName);
  const newPath = path.join(dir, newName);
  
  fs.renameSync(oldPath, newPath);

  // Diagnostic check for the user
  if (index === 0) {
    if (ext === '.png') {
      console.log('\n⚠️  NOTICE: Your files are PNGs.');
      console.log('Change ".webp" to ".png" in components/LandingPage.tsx on line 63.\n');
    } else {
      console.log(`✅ Sequence established using ${ext} extension.\n`);
    }
  }
});

console.log(`✨ Processed ${files.length} files. Your frames are now orchid_001 through orchid_${String(files.length).padStart(3, '0')}.`);

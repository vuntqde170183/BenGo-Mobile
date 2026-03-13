const fs = require('fs');
const files = [
  'c:/Users/DELL/Videos/BenGo/BenGo-Native/app/(driver)/tabs/history.tsx',
  'c:/Users/DELL/Videos/BenGo/BenGo-Native/app/(driver)/history/[id].tsx',
  'c:/Users/DELL/Videos/BenGo/BenGo-Native/components/Driver/ActivityScreen/TripCard/index.tsx',
  'c:/Users/DELL/Videos/BenGo/BenGo-Native/lib/driver.ts'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`Checking ${file}...`);
    // Simple check for illegal characters
    const nonAscii = content.match(/[^\x00-\x7F]/g);
    if (nonAscii) {
      console.log(`Found non-ASCII in ${file}:`, nonAscii.join(''));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
});

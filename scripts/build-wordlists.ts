import { words } from 'popular-english-words';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../public/words');

const VALID_WORD = /^[a-z]{3,10}$/;

const allWords = words.getMostPopular(1_000_000);

// valid.json: top 100k by popularity → ~82k words after filter
const valid = allWords.slice(0, 100_000).filter(w => VALID_WORD.test(w)).sort();

// daily.json: top 5k by popularity → ~4.3k words after filter, sorted alphabetically
const daily = allWords.slice(0, 5_000).filter(w => VALID_WORD.test(w)).sort();

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'valid.json'), JSON.stringify(valid));
writeFileSync(resolve(outDir, 'daily.json'), JSON.stringify(daily));

console.log(`valid.json: ${valid.length} words`);
console.log(`daily.json: ${daily.length} words`);

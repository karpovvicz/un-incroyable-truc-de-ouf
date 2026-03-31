import { PrismaClient, WordType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

// Prisma 7 requires an adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Parse 2000 most common French words
  const wordsFilePath = join(process.cwd(), 'data', '2000_most_common_french_words.txt');
  const wordsFileContent = readFileSync(wordsFilePath, 'utf-8');
  const wordsLines = wordsFileContent.split('\n');

  const words: Array<{ rank: number; french: string; english: string }> = [];

  for (const line of wordsLines) {
    // Match pattern: "NUMBER | FRENCH | ENGLISH"
    const match = line.match(/^(\d+)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
    if (match) {
      const [, rankStr, french, english] = match;
      words.push({
        rank: parseInt(rankStr, 10),
        french: french.trim(),
        english: english.trim(),
      });
    }
  }

  console.log(`📚 Parsed ${words.length} common words`);

  // Parse 100 French conversation fillers
  const fillersFilePath = join(process.cwd(), 'data', '100_french_conversation_fillers.txt');
  const fillersFileContent = readFileSync(fillersFilePath, 'utf-8');
  const fillersLines = fillersFileContent.split('\n');

  const fillers: Array<{ french: string; english: string; category: string; hint?: string }> = [];
  let currentCategory = '';

  for (const line of fillersLines) {
    // Check if this is a category header
    const categoryMatch = line.match(/^CATEGORY \d+:\s*(.+?)(?:\s*\(.*\))?$/i);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Match filler entry pattern: "NUMBER. french - english (optional hint)"
    const fillerMatch = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+?)(\s*\((.+)\))?$/);
    if (fillerMatch) {
      const [, french, englishWithHint, , hint] = fillerMatch;

      // Split english and extract hint if present in parentheses within the english part
      let english = englishWithHint.trim();
      let extractedHint = hint?.trim();

      // Check if there's a hint in parentheses at the end of the english part
      const hintInEnglish = english.match(/^(.+?)\s*\((.+)\)$/);
      if (hintInEnglish && !extractedHint) {
        english = hintInEnglish[1].trim();
        extractedHint = hintInEnglish[2].trim();
      }

      fillers.push({
        french: french.trim(),
        english: english,
        category: currentCategory,
        hint: extractedHint,
      });
    }
  }

  console.log(`💬 Parsed ${fillers.length} conversation fillers`);

  // Upsert words into database
  let wordsCount = 0;
  for (const word of words) {
    await prisma.word.upsert({
      where: {
        french_type: {
          french: word.french,
          type: WordType.WORD,
        },
      },
      update: {
        english: word.english,
        rank: word.rank,
      },
      create: {
        french: word.french,
        english: word.english,
        rank: word.rank,
        type: WordType.WORD,
      },
    });
    wordsCount++;

    if (wordsCount % 100 === 0) {
      console.log(`  ✓ Inserted ${wordsCount}/${words.length} words`);
    }
  }

  console.log(`✅ Inserted ${wordsCount} words`);

  // Upsert fillers into database
  let fillersCount = 0;
  for (const filler of fillers) {
    await prisma.word.upsert({
      where: {
        french_type: {
          french: filler.french,
          type: WordType.FILLER,
        },
      },
      update: {
        english: filler.english,
        category: filler.category,
        hint: filler.hint,
      },
      create: {
        french: filler.french,
        english: filler.english,
        type: WordType.FILLER,
        category: filler.category,
        hint: filler.hint,
      },
    });
    fillersCount++;
  }

  console.log(`✅ Inserted ${fillersCount} fillers`);
  console.log(`\n🎉 Seed complete! Total: ${wordsCount + fillersCount} items`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
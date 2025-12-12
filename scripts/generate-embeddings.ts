/**
 * Embedding Generation Script
 *
 * This script generates vector embeddings for all existing adisos
 * that don't have embeddings yet.
 *
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 *
 * Options:
 *   --batch-size <number>  Process this many items at once (default: 50)
 *   --limit <number>       Process at most this many items (default: all)
 *   --force                Regenerate embeddings even if they exist
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

// import { batchGenerateEmbeddings } from '../lib/ai/embeddings';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface Options {
  batchSize: number;
  limit: number | null;
  force: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    batchSize: 50,
    limit: null,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch-size':
        options.batchSize = parseInt(args[i + 1]);
        i++;
        break;
      case '--limit':
        options.limit = parseInt(args[i + 1]);
        i++;
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: npx tsx scripts/generate-embeddings.ts [options]

Options:
  --batch-size <number>  Process this many items at once (default: 50)
  --limit <number>       Process at most this many items (default: all)
  --force                Regenerate embeddings even if they exist
  --help, -h             Show this help message

Example:
  npx tsx scripts/generate-embeddings.ts --batch-size 100 --limit 500
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main() {
  console.log('🚀 ADIS AI - Embedding Generation Script');
  console.log('==========================================\n');

  // Parse command line arguments
  const options = parseArgs();

  console.log('Configuration:');
  console.log(`  Batch size: ${options.batchSize}`);
  console.log(`  Limit: ${options.limit || 'none (process all)'}`);
  console.log(`  Force regenerate: ${options.force ? 'yes' : 'no'}`);
  console.log('');

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment');
    console.error('   Please set it in .env.local');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Supabase credentials not found');
    console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }

  console.log('✅ Environment validated\n');

  // Start processing
  const { batchGenerateEmbeddings } = await import('../lib/ai/embeddings');
  try {
    let totalProcessed = 0;
    let batchNumber = 1;

    while (true) {
      const remainingLimit = options.limit
        ? options.limit - totalProcessed
        : options.batchSize;

      if (remainingLimit <= 0) {
        console.log(`\n✅ Reached limit of ${options.limit} items`);
        break;
      }

      const batchSize = Math.min(options.batchSize, remainingLimit);

      console.log(`📦 Processing batch ${batchNumber} (${batchSize} items)...`);

      const processed = await batchGenerateEmbeddings(batchSize);

      if (processed === 0) {
        console.log('\n✅ No more items to process!');
        break;
      }

      totalProcessed += processed;
      batchNumber++;

      console.log(`   Processed: ${processed} items`);
      console.log(`   Total so far: ${totalProcessed} items\n`);

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('==========================================');
    console.log(`✨ Complete! Processed ${totalProcessed} items total`);
    console.log('==========================================\n');

    // Estimate cost
    const avgTokensPerItem = 100; // Rough estimate
    const totalTokens = totalProcessed * avgTokensPerItem;
    const estimatedCost = (totalTokens / 1_000_000) * 0.02; // $0.02 per 1M tokens

    console.log('💰 Estimated cost:');
    console.log(`   Tokens used: ~${totalTokens.toLocaleString()}`);
    console.log(`   Cost: ~$${estimatedCost.toFixed(4)} USD`);
    console.log('');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error during processing:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

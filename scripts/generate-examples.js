/**
 * Generate 4 writing example articles using the admin API.
 *
 * Prerequisites:
 *   1. Run the SQL in supabase-migration.sql (writing_examples table) in Supabase SQL Editor
 *   2. Set BLOG_ADMIN_SECRET in .env
 *   3. Deploy or run dev server
 *
 * Usage:
 *   node scripts/generate-examples.js [base-url] [admin-secret]
 *
 * Default base-url: http://localhost:3000
 * For production: node scripts/generate-examples.js https://www.citeplex.io YOUR_SECRET
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const BASE_URL = process.argv[2] || "http://localhost:3000";
const ADMIN_SECRET = process.argv[3] || process.env.BLOG_ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("ERROR: BLOG_ADMIN_SECRET not set. Pass as 3rd argument or set in .env");
  console.error("Usage: node scripts/generate-examples.js <base-url> <admin-secret>");
  process.exit(1);
}

const EXAMPLES = [
  {
    brandName: "Ahrefs",
    brandUrl: "https://ahrefs.com",
    industry: "SEO Software",
    keyword: "link building strategy",
    title: "The Data-Driven Link Building Strategy: How to Build Authority in 2026",
  },
  {
    brandName: "SurferSEO",
    brandUrl: "https://surferseo.com",
    industry: "Content Optimization Software",
    keyword: "content optimization",
    title: "Content Optimization Framework: How to Rank Higher with Data-Driven Writing",
  },
  {
    brandName: "Semrush",
    brandUrl: "https://semrush.com",
    industry: "Digital Marketing Software",
    keyword: "seo competitor analysis",
    title: "SEO Competitor Analysis: How to Find and Exploit Ranking Gaps",
  },
  {
    brandName: "Writesonic",
    brandUrl: "https://writesonic.com",
    industry: "AI Content Creation Software",
    keyword: "ai content writing",
    title: "AI Content Writing at Scale: How to Maintain Quality and Brand Voice",
  },
];

async function generateExample(example, index) {
  const label = `[${index + 1}/${EXAMPLES.length}] ${example.brandName}`;
  console.log(`\n${label}: Starting...`);
  console.log(`  Title: "${example.title}"`);
  console.log(`  Keyword: "${example.keyword}"`);

  try {
    const res = await fetch(`${BASE_URL}/api/admin/generate-example`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify(example),
    });

    const data = await res.json();

    if (!res.ok) {
      console.log(`  ERROR (${res.status}): ${data.error}`);
      return false;
    }

    console.log(`  Done! Slug: ${data.slug}, Words: ${data.wordCount}, Cover: ${data.coverImage ? "yes" : "no"}`);
    return true;
  } catch (err) {
    console.log(`  FETCH ERROR: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Generating ${EXAMPLES.length} writing examples...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Secret: ${ADMIN_SECRET.slice(0, 4)}...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < EXAMPLES.length; i++) {
    const ok = await generateExample(EXAMPLES[i], i);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n--- Results ---`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nView at: ${BASE_URL}/examples`);
}

main();

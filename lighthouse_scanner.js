import fs from 'fs-extra';
import axios from 'axios';
import xml2js from 'xml2js';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { URL } from 'url';
import readline from 'readline';

// Constants
const OUTPUT_FILE = 'lighthouse_results.json';
const PAUSE_TIME = 5000;
const TIMEOUT = 120000;

// Utility functions
export function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

export function askQuestion(rl, query) {
  return new Promise(resolve => rl.question(query, resolve));
}

export function normalizeUrl(inputUrl) {
  let url = inputUrl.trim().toLowerCase();

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Remove 'www.' if present
    if (parsedUrl.hostname.startsWith('www.')) {
      parsedUrl.hostname = parsedUrl.hostname.slice(4);
    }

    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL provided');
  }
}

export async function getSitemapUrl(inputUrl) {
  const normalizedUrl = normalizeUrl(inputUrl);
  
  if (normalizedUrl.endsWith('sitemap.xml')) {
    return normalizedUrl;
  }
  
  const url = new URL(normalizedUrl);
  const possibleSitemaps = [
    `${url.origin}/sitemap.xml`,
    `${url.origin}/sitemap_index.xml`,
    `${url.origin}/sitemap`,
    `${url.origin}/sitemap.php`,
  ];

  for (const sitemapUrl of possibleSitemaps) {
    try {
      await axios.head(sitemapUrl);
      return sitemapUrl;
    } catch (error) {
      // If not found, continue to the next possible sitemap URL
      continue;
    }
  }

  throw new Error(`Sitemap not found for ${normalizedUrl}`);
}

export async function getSitemapUrls(sitemapUrl) {
  const normalizedSitemapUrl = normalizeUrl(sitemapUrl);
  const response = await axios.get(normalizedSitemapUrl);
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(response.data);

  if (result.urlset && result.urlset.url) {
    return result.urlset.url.map(url => normalizeUrl(url.loc[0]));
  } else if (result.sitemapindex && result.sitemapindex.sitemap) {
    const firstSitemapUrl = result.sitemapindex.sitemap[0].loc[0];
    return getSitemapUrls(firstSitemapUrl);
  } else {
    console.error('Unsupported sitemap structure');
    return [];
  }
}

export async function runLighthouseForUrl(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined
  });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: (new URL(browser.wsEndpoint())).port,
    chromeFlags: ['--headless'],
  };

  try {
    const runnerResult = await Promise.race([
      lighthouse(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Lighthouse timed out')), TIMEOUT))
    ]);
    
    await browser.close();
    return JSON.parse(runnerResult.report);
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export function printLighthouseResults(result) {
  console.log('\n📊 Lighthouse Results:');
  console.log(`🚀 Performance: ${(result.categories.performance.score * 100).toFixed(0)}%`);
  console.log(`♿ Accessibility: ${(result.categories.accessibility.score * 100).toFixed(0)}%`);
  console.log(`👍 Best Practices: ${(result.categories['best-practices'].score * 100).toFixed(0)}%`);
  console.log(`🔍 SEO: ${(result.categories.seo.score * 100).toFixed(0)}%`);

  console.log('\n🔧 Improvement Suggestions:');
  Object.values(result.audits).forEach(audit => {
    if (audit.score !== 1 && audit.details && audit.details.type === 'opportunity') {
      console.log(`- ${audit.title}: ${audit.description}`);
    }
  });

  if (result.audits['bf-cache']) {
    console.log('\n🔄 Back/Forward Cache (BFCache) Failures:');
    const bfCacheAudit = result.audits['bf-cache'];
    if (bfCacheAudit.details && bfCacheAudit.details.items) {
      bfCacheAudit.details.items.forEach(item => {
        console.log(`- ${item.failureReason}: ${item.details}`);
      });
    } else {
      console.log('No BFCache failures detected.');
    }
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function processUrl(url, results) {
  console.log(`🏃 Running Lighthouse for ${url}`);
  try {
    const result = await runLighthouseForUrl(url);
    const urlResult = {
      url,
      performance: result.categories.performance.score,
      accessibility: result.categories.accessibility.score,
      bestPractices: result.categories['best-practices'].score,
      seo: result.categories.seo.score,
    };
    results.push(urlResult);
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`💾 Updated results saved to ${OUTPUT_FILE}`);

    printLighthouseResults(result);
  } catch (error) {
    console.error(`❌ Error running Lighthouse for ${url}:`, error.message);
    results.push({
      url,
      error: error.message
    });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  }
}

export async function main() {
  console.log("🚀 Welcome to the Lighthouse Scanner! 🚀");
  console.log("This tool will analyze your website's performance, accessibility, best practices, and SEO.");
  console.log("Let's get started! 🏁\n");

  const rl = createReadlineInterface();

  try {
    const inputUrl = await askQuestion(rl, "🌐 Please enter the URL of your website: ");
    rl.close();

    const sitemapUrl = await getSitemapUrl(inputUrl);
    console.log(`📍 Using sitemap: ${sitemapUrl}`);

    const urls = await getSitemapUrls(sitemapUrl);
    
    if (urls.length === 0) {
      console.log("❌ No URLs found in the sitemap. Exiting.");
      return;
    }

    console.log(`🔍 Found ${urls.length} URLs in the sitemap.`);
    let results = [];

    if (fs.existsSync(OUTPUT_FILE)) {
      const existingData = fs.readFileSync(OUTPUT_FILE, 'utf8');
      results = JSON.parse(existingData);
      console.log(`📂 Loaded ${results.length} existing results.`);
    }

    for (const url of urls) {
      if (results.some(result => result.url === url)) {
        console.log(`⏭️  Skipping already processed URL: ${url}`);
        continue;
      }

      await processUrl(url, results);

      console.log(`\n⏳ Waiting for ${PAUSE_TIME / 1000} seconds before the next run...`);
      await sleep(PAUSE_TIME);
    }

    console.log(`🎉 All results saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  }
}


// Only run main if this file is being run directly
// if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
//}
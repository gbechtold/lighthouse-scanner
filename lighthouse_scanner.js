import fs from 'fs';
import axios from 'axios';
import xml2js from 'xml2js';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { URL } from 'url';
import readline from 'readline';

const outputFile = 'lighthouse_results.json';
const pauseTime = 5000; // Pause between runs in milliseconds (5 seconds here)
const timeout = 120000; // Increased timeout to 2 minutes (120 seconds)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getSitemapUrl(inputUrl) {
  if (inputUrl.endsWith('sitemap.xml')) {
    return inputUrl;
  }
  
  const url = new URL(inputUrl);
  const sitemapUrl = `${url.origin}/sitemap.xml`;
  
  try {
    await axios.head(sitemapUrl);
    return sitemapUrl;
  } catch (error) {
    throw new Error(`Sitemap not found at ${sitemapUrl}`);
  }
}

async function getSitemapUrls(sitemapUrl) {
  const response = await axios.get(sitemapUrl);
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(response.data);

  if (result.urlset && result.urlset.url) {
    return result.urlset.url.map(url => url.loc[0]);
  } else if (result.sitemapindex && result.sitemapindex.sitemap) {
    const firstSitemapUrl = result.sitemapindex.sitemap[0].loc[0];
    return getSitemapUrls(firstSitemapUrl);
  } else {
    console.error('Unsupported sitemap structure');
    return [];
  }
}

async function runLighthouseForUrl(url) {
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
      new Promise((_, reject) => setTimeout(() => reject(new Error('Lighthouse timed out')), timeout))
    ]);
    
    await browser.close();
    return JSON.parse(runnerResult.report);
  } catch (error) {
    await browser.close();
    throw error;
  }
}

function printLighthouseResults(result) {
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

  // Output BFCache failures
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("🚀 Welcome to the Lighthouse Scanner! 🚀");
  console.log("This tool will analyze your website's performance, accessibility, best practices, and SEO.");
  console.log("Let's get started! 🏁\n");

  try {
    const inputUrl = await askQuestion("🌐 Please enter the URL of your website or sitemap: ");
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

    if (fs.existsSync(outputFile)) {
      const existingData = fs.readFileSync(outputFile, 'utf8');
      results = JSON.parse(existingData);
      console.log(`📂 Loaded ${results.length} existing results.`);
    }

    for (const url of urls) {
      if (results.some(result => result.url === url)) {
        console.log(`⏭️  Skipping already processed URL: ${url}`);
        continue;
      }

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
        
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
        console.log(`💾 Updated results saved to ${outputFile}`);

        printLighthouseResults(result);
      } catch (error) {
        console.error(`❌ Error running Lighthouse for ${url}:`, error.message);
        results.push({
          url,
          error: error.message
        });
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      }

      console.log(`\n⏳ Waiting for ${pauseTime / 1000} seconds before the next run...`);
      await sleep(pauseTime);
    }

    console.log(`🎉 All results saved to ${outputFile}`);
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  }
}

main().catch(console.error);
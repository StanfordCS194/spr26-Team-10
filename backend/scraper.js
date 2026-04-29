const { chromium } = require('playwright');
const fs = require('fs');

// Function to scrape each individual page
async function scrapePage(page) {
  await page.waitForLoadState('networkidle');
  return await page.evaluate(() => {
    document.querySelectorAll('script, style').forEach(el => el.remove());
    return document.body.innerText;
  });
}

// Function to scrape every sublink/subtitle within a page
async function scrapeAllLinks(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let allText = '';

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // Scrape main page
  const mainText = await scrapePage(page);
  allText += `=== MAIN PAGE ===\n${mainText}\n\n`;

  // Dynamically grab all links on the page
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(el => ({ text: el.innerText.trim(), href: el.href }))
      .filter(link => link.text && link.href && !link.href.startsWith('mailto'));
  });

  console.log(`Found ${links.length} links`);

  // Scrape each link
  for (const link of links) {
    try {
      console.log(`Scraping: ${link.text}`);

      await page.goto(link.href);
      await page.waitForLoadState('networkidle');

      const text = await scrapePage(page);
      allText += `=== ${link.text.toUpperCase()} ===\n${text}\n\n`;

    } catch (err) {
      console.log(`Could not scrape "${link.text}":`, err.message);
      allText += `=== ${link.text.toUpperCase()} ===\nCould not load this page.\n\n`;
    }
  }

  // Save to a unique file each run, based on time of scraping 
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `output-${timestamp}.txt`;
  fs.writeFileSync(filename, allText);
  console.log(`Done! Saved to ${filename}`);

  await browser.close();
}

// links to scrape
scrapeAllLinks('https://www.ssa.gov/prepare');


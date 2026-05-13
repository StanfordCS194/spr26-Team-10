const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Directory to save PDFs — routes to /pdfs from repo root
const PDF_DIR = path.resolve(__dirname, '../pdfs');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const OUTPUT_DIR = path.resolve(__dirname, '../scraper_output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });  

// checks if a pdf is valid or corrupted, only download if its not corrupted
function checkPDF(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.request(url, { method: 'HEAD' }, (res) => {
      // follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return checkPDF(res.headers.location).then(resolve);
      }
      const contentType = res.headers['content-type'] || '';
      const contentLength = parseInt(res.headers['content-length'] || '0');
      const valid = res.statusCode === 200
        && contentType.includes('application/pdf')
        && contentLength > 1000;  // anything under 1kb is probably an error page
      resolve(valid);
    }).on('error', () => resolve(false)).end();
  });
}

// Download a PDF from a URL and save it to /pdfs
function downloadPDF(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(PDF_DIR, filename);
    if (fs.existsSync(filepath)) {
      console.log(`Already have: ${filename}, skipping`);
      return resolve(filepath);
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadPDF(response.headers.location, filename).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', (err) => {
      fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

// Sanitize a string to be a safe filename
function toFilename(text, url) {
  const urlBasename = path.basename(new URL(url).pathname);
  if (urlBasename.endsWith('.pdf')) return urlBasename;
  const safe = text.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 60);
  return `${safe}.pdf`;
}

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
  const downloadedPDFs = []; 

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

    // --- PDF: download it instead of scraping ---
    if (link.href.toLowerCase().includes('.pdf')) {
      try {
        const filename = toFilename(link.text, link.href);
        const valid = await checkPDF(link.href);
        if (!valid) {
          console.log(`Skipping invalid PDF: ${filename}`);
          allText += `=== ${link.text.toUpperCase()} ===\n[PDF skipped — invalid]\n\n`;
          continue;
        }
        console.log(`Downloading PDF: ${filename}`);
        const savedPath = await downloadPDF(link.href, filename);
        downloadedPDFs.push({ text: link.text, url: link.href, file: savedPath });
        allText += `=== ${link.text.toUpperCase()} ===\n[PDF downloaded → ${savedPath}]\n\n`;
      } catch (err) {
        console.log(`Could not download PDF "${link.text}":`, err.message);
        allText += `=== ${link.text.toUpperCase()} ===\nCould not download PDF.\n\n`;
      }
      continue; // skip navigating to it as a page
    }

    // scraping text regularly 
    try {
      console.log(`Scraping: ${link.text}`);

      await page.goto(link.href);
      await page.waitForLoadState('networkidle');

      const subPDFLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]'))
          .map(el => ({ text: el.innerText.trim() || el.href, href: el.href }));
      });

      // check for pdfs in subpages 
      for (const pdf of subPDFLinks) {
        try {
          const filename = toFilename(pdf.text, pdf.href);
          const valid = await checkPDF(pdf.href);
          if (!valid) {
            console.log(`  Skipping invalid sub-PDF: ${filename}`);
            continue;
          }
          console.log(`  Found sub-PDF: ${filename}`);
          const savedPath = await downloadPDF(pdf.href, filename);
          downloadedPDFs.push({ text: pdf.text, url: pdf.href, file: savedPath });
        } catch (err) {
          console.log(`  Could not download sub-PDF "${pdf.text}":`, err.message);
        }
      }

      const text = await scrapePage(page);
      allText += `=== ${link.text.toUpperCase()} ===\n${text}\n\n`;

    } catch (err) {
      console.log(`Could not scrape "${link.text}":`, err.message);
      allText += `=== ${link.text.toUpperCase()} ===\nCould not load this page.\n\n`;
    }
  }

  // Append a PDF manifest to the bottom of the text output
  if (downloadedPDFs.length > 0) {
    allText += `=== PDF MANIFEST ===\n`;
    downloadedPDFs.forEach(p => {
      allText += `${p.text}\n  URL: ${p.url}\n  Saved: ${p.file}\n\n`;
    });
    console.log(`\nDownloaded ${downloadedPDFs.length} PDFs to ${PDF_DIR}`);
  }

  // Save to a unique file each run, based on time of scraping 
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `output-${timestamp}.txt`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, allText);
  console.log(`Done! Saved to ${outputPath}`);
  await browser.close();
}

// links to scrape
scrapeAllLinks('https://www.ssa.gov/prepare');


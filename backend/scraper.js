const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const PDFParser = require('pdf2json');

// ── Directories ───────────────────────────────────────────────────────────────
const PDF_DIR = path.resolve(__dirname, '../pdfs');
const OUTPUT_DIR = path.resolve(__dirname, '../scraper_output');
const VECTOR_FILES_DIR = path.resolve(__dirname, '../vector_files');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(VECTOR_FILES_DIR)) fs.mkdirSync(VECTOR_FILES_DIR, { recursive: true });

// ── Vector file output ────────────────────────────────────────────────────────
// Writes one .txt file per page/chunk, formatted for OpenAI vector store ingestion.
// Each file has a metadata header followed by the content body.
function writeVectorFile({ sourceTitle, sourceUrl, pageNumber, formKey, content }) {
  const slug = (sourceTitle || sourceUrl)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 60);
  const suffix = pageNumber != null ? `_p${pageNumber}` : '';
  const filename = `${slug}${suffix}.txt`;
  const filepath = path.join(VECTOR_FILES_DIR, filename);

  const lines = [
    `title: ${sourceTitle || sourceUrl}`,
    `source_url: ${sourceUrl || ''}`,
    pageNumber != null ? `page: ${pageNumber}` : null,
    formKey ? `form_key: ${formKey}` : null,
    '',
    content.trim(),
  ].filter((l) => l !== null).join('\n');

  fs.writeFileSync(filepath, lines, 'utf8');
  return filepath;
}

// ── PDF parsing ───────────────────────────────────────────────────────────────
function parsePDF(filePath) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataReady', (data) => {
      const pages = data.Pages.map((page) =>
        page.Texts.map((t) => {
          try { return decodeURIComponent(t.R.map((r) => r.T).join('')); }
          catch { return t.R.map((r) => r.T).join(''); }
        }).join(' ')
      );
      resolve(pages);
    });
    parser.on('pdfParser_dataError', reject);
    parser.loadPDF(filePath);
  });
}

async function extractAndWritePDF({ filePath, linkText, url }) {
  let pages;
  try {
    pages = await parsePDF(filePath);
  } catch (e) {
    console.log(`  Could not parse PDF: ${e.message}`);
    return;
  }

  const usefulPages = pages.filter((p) => p.trim().length >= 100);
  if (!usefulPages.length) {
    console.log(`  Skipping ${path.basename(filePath)} — no readable content`);
    return;
  }

  const sourceTitle = linkText.trim() || path.basename(url);
  usefulPages.forEach((content, i) => {
    const outPath = writeVectorFile({
      sourceTitle,
      sourceUrl: url,
      pageNumber: i + 1,
      formKey: null,
      content,
    });
    console.log(`  Wrote vector file: ${path.basename(outPath)}`);
  });
}

// ── Web page chunking ─────────────────────────────────────────────────────────
function extractAndWriteWebPage({ title, url, content }) {
  const clean = content.trim();
  if (clean.length < 150) return;

  const chunkSize = 1400;
  let part = 1;
  for (let i = 0; i < clean.length; i += chunkSize) {
    const chunk = clean.slice(i, i + chunkSize).trim();
    if (chunk.length < 150) continue;
    const outPath = writeVectorFile({
      sourceTitle: title || url,
      sourceUrl: url,
      pageNumber: Math.ceil(clean.length / chunkSize) > 1 ? part : null,
      formKey: null,
      content: chunk,
    });
    console.log(`  Wrote vector file: ${path.basename(outPath)}`);
    part++;
  }
}

// ── PDF validity check ────────────────────────────────────────────────────────
function checkPDF(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return checkPDF(res.headers.location).then(resolve);
      }
      const contentType = res.headers['content-type'] || '';
      const contentLength = parseInt(res.headers['content-length'] || '0');
      resolve(res.statusCode === 200 && contentType.includes('application/pdf') && contentLength > 1000);
    }).on('error', () => resolve(false)).end();
  });
}

// ── PDF download ──────────────────────────────────────────────────────────────
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
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadPDF(response.headers.location, filename).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', (err) => {
      try { fs.unlinkSync(filepath); } catch {}
      reject(err);
    });
  });
}

function toFilename(text, url) {
  const urlBasename = path.basename(new URL(url).pathname);
  if (urlBasename.endsWith('.pdf')) return urlBasename;
  return text.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 60) + '.pdf';
}

// ── Web page scraping ─────────────────────────────────────────────────────────
async function scrapePage(page) {
  await page.waitForLoadState('networkidle');
  return page.evaluate(() => {
    document.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove());
    return (document.querySelector('main') || document.body).innerText
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  });
}

// ── Main scrape loop ──────────────────────────────────────────────────────────
async function scrapeAllLinks(startUrl) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let allText = '';
  const downloadedPDFs = [];

  console.log(`\nScraping: ${startUrl}\n`);
  await page.goto(startUrl);
  await page.waitForLoadState('networkidle');

  const mainText = await scrapePage(page);
  allText += `=== MAIN PAGE ===\n${mainText}\n\n`;
  extractAndWriteWebPage({ title: 'Main page', url: startUrl, content: mainText });

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .map((el) => ({ text: el.innerText.trim(), href: el.href }))
      .filter((l) => l.text && l.href && !l.href.startsWith('mailto'))
  );
  console.log(`Found ${links.length} links\n`);

  const seenUrls = new Set([startUrl]);

  for (const link of links) {
    if (seenUrls.has(link.href)) continue;
    seenUrls.add(link.href);

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
        await extractAndWritePDF({ filePath: savedPath, linkText: link.text, url: link.href });
        allText += `=== ${link.text.toUpperCase()} ===\n[PDF downloaded → ${savedPath}]\n\n`;
      } catch (err) {
        console.log(`Could not download PDF "${link.text}":`, err.message);
        allText += `=== ${link.text.toUpperCase()} ===\nCould not download PDF.\n\n`;
      }
      continue;
    }

    try {
      console.log(`Scraping: ${link.text}`);
      await page.goto(link.href);
      await page.waitForLoadState('networkidle');

      const subPDFLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]'))
          .map((el) => ({ text: el.innerText.trim() || el.href, href: el.href }))
      );
      for (const pdf of subPDFLinks) {
        if (seenUrls.has(pdf.href)) continue;
        seenUrls.add(pdf.href);
        try {
          const filename = toFilename(pdf.text, pdf.href);
          const valid = await checkPDF(pdf.href);
          if (!valid) continue;
          console.log(`  Found sub-PDF: ${filename}`);
          const savedPath = await downloadPDF(pdf.href, filename);
          downloadedPDFs.push({ text: pdf.text, url: pdf.href, file: savedPath });
          await extractAndWritePDF({ filePath: savedPath, linkText: pdf.text, url: pdf.href });
        } catch (err) {
          console.log(`  Could not download sub-PDF "${pdf.text}":`, err.message);
        }
      }

      const text = await scrapePage(page);
      allText += `=== ${link.text.toUpperCase()} ===\n${text}\n\n`;
      extractAndWriteWebPage({ title: link.text, url: link.href, content: text });
    } catch (err) {
      console.log(`Could not scrape "${link.text}":`, err.message);
      allText += `=== ${link.text.toUpperCase()} ===\nCould not load this page.\n\n`;
    }
  }

  if (downloadedPDFs.length > 0) {
    allText += `=== PDF MANIFEST ===\n`;
    downloadedPDFs.forEach((p) => {
      allText += `${p.text}\n  URL: ${p.url}\n  Saved: ${p.file}\n\n`;
    });
    console.log(`\nDownloaded ${downloadedPDFs.length} PDFs to ${PDF_DIR}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(OUTPUT_DIR, `output-${timestamp}.txt`);
  fs.writeFileSync(outputPath, allText);
  console.log(`\nDone! Scraper output saved to ${outputPath}`);
  console.log(`Vector files written to ${VECTOR_FILES_DIR}`);
  await browser.close();
}

const target = process.argv[2] || 'https://www.ssa.gov/prepare';
scrapeAllLinks(target);

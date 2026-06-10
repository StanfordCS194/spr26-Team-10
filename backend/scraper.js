/**
 * scraper.js
 *
 * Scrapes a government forms page (default: ssa.gov/prepare) and all its sublinks:
 *   - Web pages  → scraped text is chunked and inserted into form_reference immediately
 *   - PDFs       → downloaded to /pdfs, then parsed page-by-page and inserted into form_reference
 *
 * Usage:
 *   node backend/scraper.js
 *   node backend/scraper.js https://www.irs.gov/forms-instructions
 *
 * Env (loaded automatically from my-app/.env.local if not already set):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const PDFParser = require('pdf2json');

// ── Load env ────────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../my-app/.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// ── Directories ──────────────────────────────────────────────────────────────
const PDF_DIR = path.resolve(__dirname, '../pdfs');
const OUTPUT_DIR = path.resolve(__dirname, '../scraper_output');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── PDF content filter ───────────────────────────────────────────────────────
// Skip PDFs that are administrative documents, not form guidance.
const JUNK_PATTERNS = [
  /audit/i,
  /overpayment/i,
  /semiannual\s+report/i,
  /report\s+to\s+congress/i,
  /memorandum\s+for\s+the\s+heads/i,
  /office\s+of\s+inspector\s+general/i,
  /cost.benefit\s+analysis/i,
  /web\s+measurement\s+and\s+customization/i,
  /plain\s+writing\s+act/i,
];

function looksLikeJunk(linkText, url, firstPageContent) {
  const combined = `${linkText} ${url} ${firstPageContent}`.toLowerCase();
  return JUNK_PATTERNS.some((re) => re.test(combined));
}

// ── Form key inference ───────────────────────────────────────────────────────
function inferFormKey(text, url) {
  const value = `${text} ${url}`.toLowerCase();

  if (value.includes('i-765') || value.includes('i765') ||
      (value.includes('employment authorization') && (value.includes('uscis') || value.includes('i-765')))) return 'i-765';
  if (value.includes('i-9') || value.includes('employment eligibility verification')) return 'i-9';
  if (value.includes('ss-5') || value.includes('social security card') || value.includes('ssnumber') || value.includes('number-card')) return 'ss-5';
  if (value.includes('supplemental security income') || value.includes('/ssi')) return 'ssi';
  if (value.includes('cms-40b') || value.includes('cms40b')) return 'cms-40b';
  if (value.includes('cms-l564') || value.includes('cmsl564')) return 'cms-l564';
  if (value.includes('cms-1763') || value.includes('cms1763')) return 'cms-1763';
  if (value.includes('medicare')) return 'medicare';
  if (value.includes('ss-4') || value.includes('fss4') || value.includes('employer identification number')) return 'ss-4';
  if (value.includes('w-4v') || value.includes('fw4v') || value.includes('voluntary withholding')) return 'w-4v';
  if (value.includes('w-4') || value.includes('fw4')) return 'w-4';
  return null;
}

// ── DB helpers ───────────────────────────────────────────────────────────────
async function deleteRowsForUrl(sourceUrl) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const { error, count } = await supabase
    .from('form_reference')
    .delete({ count: 'exact' })
    .eq('source_url', sourceUrl);
  if (error) console.log(`  Delete error for ${sourceUrl}:`, error.message);
  else console.log(`  Deleted ${count ?? 0} existing rows for ${sourceUrl}`);
}

async function insertRows(rows) {
  if (!rows.length || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const { error } = await supabase.from('form_reference').insert(rows);
  if (error) console.log(`  DB insert error:`, error.message);
}

// ── PDF helpers ──────────────────────────────────────────────────────────────
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

async function seedPDF({ filePath, linkText, url, replace = false }) {
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

  // Use the first page content to detect junk before committing to the DB
  if (looksLikeJunk(linkText, url, usefulPages[0])) {
    console.log(`  Skipping ${path.basename(filePath)} — looks like an administrative document`);
    return;
  }

  const formKey = inferFormKey(`${linkText} ${url}`, url);
  const sourceTitle = linkText.trim() || path.basename(url);

  const rows = usefulPages.map((content, i) => {
    // Use "Document Title — Page N" for multi-page docs, just title for single page
    const sectionTitle = usefulPages.length > 1 ? `${sourceTitle} — Page ${i + 1}` : sourceTitle;
    return {
      source: `${path.basename(filePath)} page ${i + 1}`,
      source_url: url,
      source_title: sourceTitle,
      section_title: sectionTitle,
      page_number: i + 1,
      form_key: formKey,
      content: content.trim(),
    };
  });

  console.log(`  Seeding ${rows.length} pages from PDF: ${sourceTitle}`);
  if (replace) await deleteRowsForUrl(url);
  await insertRows(rows);
}

// ── HTTP PDF download ────────────────────────────────────────────────────────
function checkPDF(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return checkPDF(res.headers.location).then(resolve);
      }
      const ct = res.headers['content-type'] || '';
      const cl = parseInt(res.headers['content-length'] || '0');
      resolve(res.statusCode === 200 && ct.includes('application/pdf') && cl > 1000);
    }).on('error', () => resolve(false)).end();
  });
}

function downloadPDFHttp(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(PDF_DIR, filename);
    if (fs.existsSync(filepath)) {
      console.log(`  Already have: ${filename}`);
      return resolve(filepath);
    }
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close(); fs.unlinkSync(filepath);
        return downloadPDFHttp(response.headers.location, filename).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', (err) => { try { fs.unlinkSync(filepath); } catch {} reject(err); });
  });
}

// Fallback: use Playwright to capture the PDF response bytes (handles CDN blocks)
async function downloadPDFPlaywright(browserContext, url, filename) {
  const filepath = path.join(PDF_DIR, filename);
  if (fs.existsSync(filepath)) {
    console.log(`  Already have: ${filename}`);
    return filepath;
  }
  const page = await browserContext.newPage();
  let buf = null;
  page.on('response', async (res) => {
    try {
      if (res.url() === url && res.status() === 200) {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('pdf') || ct.includes('octet')) buf = await res.body();
      }
    } catch {}
  });
  await page.goto(url, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.close();
  if (buf && buf.length > 1000) {
    fs.writeFileSync(filepath, buf);
    return filepath;
  }
  return null;
}

function toFilename(text, url) {
  const base = path.basename(new URL(url).pathname);
  if (base.endsWith('.pdf')) return base;
  return text.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 60) + '.pdf';
}

// ── Web page scraping ────────────────────────────────────────────────────────
async function scrapePage(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  return page.evaluate(() => {
    document.querySelectorAll('script, style, nav, header, footer, [role=navigation]').forEach((el) => el.remove());
    return (document.querySelector('main, [role=main], #main-content') || document.body)
      .innerText.replace(/\n{3,}/g, '\n\n').trim();
  });
}

async function seedWebPage({ title, url, content, replace = false }) {
  const clean = content.trim();
  if (clean.length < 150) return;
  if (looksLikeJunk(title, url, clean)) {
    console.log(`  Skipping web page "${title}" — looks like administrative content`);
    return;
  }

  const formKey = inferFormKey(`${title} ${clean.slice(0, 500)}`, url);
  const chunkSize = 1400;
  const rows = [];

  for (let i = 0; i < clean.length; i += chunkSize) {
    const chunk = clean.slice(i, i + chunkSize).trim();
    if (chunk.length < 150) continue;
    const part = Math.floor(i / chunkSize) + 1;
    const totalParts = Math.ceil(clean.length / chunkSize);
    rows.push({
      source: part > 1 ? `${url} (part ${part})` : url,
      source_url: url,
      source_title: title || url,
      section_title: totalParts > 1 ? `${title} (${part}/${totalParts})` : title,
      form_key: formKey,
      content: chunk,
    });
  }

  if (rows.length) {
    console.log(`  Seeding ${rows.length} chunk(s) from: ${title}`);
    if (replace) await deleteRowsForUrl(url);
    await insertRows(rows);
  }
}

// ── Main scrape loop ─────────────────────────────────────────────────────────
async function scrapeAllLinks(startUrl, replace = false) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let allText = '';

  console.log(`\nScraping: ${startUrl}\n`);
  await page.goto(startUrl);
  await page.waitForLoadState('networkidle');

  const mainText = await scrapePage(page);
  allText += `=== MAIN PAGE ===\n${mainText}\n\n`;
  await seedWebPage({ title: 'Main page', url: startUrl, content: mainText, replace });

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

    // ── PDF link ──────────────────────────────────────────────────────────
    if (link.href.toLowerCase().includes('.pdf')) {
      const filename = toFilename(link.text, link.href);
      console.log(`PDF: ${link.text} → ${filename}`);

      // Try HTTP first (fast), fall back to Playwright (handles CDN blocks)
      let savedPath = null;
      const valid = await checkPDF(link.href);
      if (valid) {
        savedPath = await downloadPDFHttp(link.href, filename).catch(() => null);
      }
      if (!savedPath) {
        console.log(`  HTTP download failed, trying Playwright…`);
        savedPath = await downloadPDFPlaywright(context, link.href, filename).catch(() => null);
      }

      if (savedPath) {
        await seedPDF({ filePath: savedPath, linkText: link.text, url: link.href, replace });
        allText += `=== ${link.text.toUpperCase()} ===\n[PDF → ${savedPath}]\n\n`;
      } else {
        console.log(`  Could not download: ${filename}`);
        allText += `=== ${link.text.toUpperCase()} ===\n[PDF download failed]\n\n`;
      }
      continue;
    }

    // ── Web page link ─────────────────────────────────────────────────────
    try {
      console.log(`Scraping: ${link.text}`);
      await page.goto(link.href);
      await page.waitForLoadState('networkidle');

      // Catch any PDFs linked from this subpage
      const subPDFs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]'))
          .map((el) => ({ text: el.innerText.trim() || el.href, href: el.href }))
      );
      for (const pdf of subPDFs) {
        if (seenUrls.has(pdf.href)) continue;
        seenUrls.add(pdf.href);
        const filename = toFilename(pdf.text, pdf.href);
        console.log(`  Sub-PDF: ${pdf.text} → ${filename}`);
        let savedPath = null;
        const valid = await checkPDF(pdf.href);
        if (valid) savedPath = await downloadPDFHttp(pdf.href, filename).catch(() => null);
        if (!savedPath) savedPath = await downloadPDFPlaywright(context, pdf.href, filename).catch(() => null);
        if (savedPath) await seedPDF({ filePath: savedPath, linkText: pdf.text, url: pdf.href, replace });
      }

      const text = await scrapePage(page);
      allText += `=== ${link.text.toUpperCase()} ===\n${text}\n\n`;
      await seedWebPage({ title: link.text, url: link.href, content: text, replace });

    } catch (err) {
      console.log(`Could not scrape "${link.text}": ${err.message}`);
      allText += `=== ${link.text.toUpperCase()} ===\nCould not load.\n\n`;
    }
  }

  // Save text output
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(OUTPUT_DIR, `output-${timestamp}.txt`);
  fs.writeFileSync(outFile, allText);
  console.log(`\nDone! Output saved to ${outFile}`);

  await browser.close();
}

const target = process.argv[2] || 'https://www.ssa.gov/prepare';
const replace = process.argv.includes('--replace');
if (replace) console.log('--replace mode: existing rows for each URL will be deleted before re-seeding\n');
scrapeAllLinks(target, replace);

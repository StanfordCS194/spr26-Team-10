const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const PDFParser = require('pdf2json');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PDF_DIR = path.resolve(__dirname, '../pdfs');

const PDF_METADATA = {
  '072403.pdf': {
    sourceUrl: 'https://www.ssa.gov/pubs/EN-05-10002.pdf',
    sourceTitle: 'Social Security number and card guidance',
    formKey: 'ss-5',
  },
  'cms-l564e.pdf': {
    sourceUrl:
      'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564e.pdf',
    sourceTitle: 'Medicare Request for Employment Information',
    formKey: 'cms-l564',
  },
  'cms-l564s.pdf': {
    sourceUrl:
      'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564s.pdf',
    sourceTitle: 'Medicare Request for Employment Information',
    formKey: 'cms-l564',
  },
  'cms1763.pdf': {
    sourceUrl:
      'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms1763.pdf',
    sourceTitle: 'Request for Termination of Premium Hospital and Medical Insurance',
    formKey: 'cms-1763',
  },
  'cms40b-e.pdf': {
    sourceUrl:
      'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms40b-e.pdf',
    sourceTitle: 'Application for Enrollment in Medicare Part B',
    formKey: 'cms-40b',
  },
  'cms40b-s.pdf': {
    sourceUrl:
      'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms40b-s.pdf',
    sourceTitle: 'Application for Enrollment in Medicare Part B',
    formKey: 'cms-40b',
  },
  'fss4.pdf': {
    sourceUrl: 'https://www.irs.gov/pub/irs-pdf/fss4.pdf',
    sourceTitle: 'Application for Employer Identification Number',
    formKey: 'ss-4',
  },
  'fss4sp.pdf': {
    sourceUrl: 'https://www.irs.gov/pub/irs-pdf/fss4sp.pdf',
    sourceTitle: 'Application for Employer Identification Number',
    formKey: 'ss-4',
  },
  'fw4v.pdf': {
    sourceUrl: 'https://www.irs.gov/pub/irs-pdf/fw4v.pdf',
    sourceTitle: 'Voluntary Withholding Request',
    formKey: 'w-4v',
  },
  'm10-22.pdf': {
    sourceUrl: 'https://www.uscis.gov/sites/default/files/document/forms/m-10-22.pdf',
    sourceTitle: 'USCIS citizenship and immigration guide',
    formKey: 'uscis',
  },
  'PLAW-111publ274.pdf': {
    sourceUrl: 'https://www.congress.gov/111/plaws/publ274/PLAW-111publ274.pdf',
    sourceTitle: 'Public Law 111-274',
    formKey: 'public-law',
  },
  'i-765.pdf': {
    sourceUrl: 'https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf',
    sourceTitle: 'Application for Employment Authorization (Form I-765)',
    formKey: 'i-765',
  },
};

function inferPdfMetadata(file) {
  const fromMap = PDF_METADATA[file];
  if (fromMap) return fromMap;

  const base = file.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
  return {
    sourceUrl: null,
    sourceTitle: base,
    formKey: base.toLowerCase().split(/\s+/)[0] || null,
  };
}

function parsePDF(filePath) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataReady', (data) => {
      const pages = data.Pages.map((page) =>
        page.Texts.map((t) => {
          try {
            return decodeURIComponent(t.R.map((r) => r.T).join(''));
          } catch {
            return t.R.map((r) => r.T).join('');
          }
        }).join(' ')
      );
      resolve(pages);
    });
    parser.on('pdfParser_dataError', reject);
    parser.loadPDF(filePath);
  });
}

// These files contain no useful form-guidance content — skip them when seeding.
// - 072403.pdf, 772631-635.pdf, semiannual-report: SSA internal audit reports / memos
// - m10-22.pdf: OMB memorandum about website cookies (unrelated to any form)
// - PLAW-111publ274.pdf: Plain Writing Act of 2010 (not form guidance)
const SKIP_PDFS = new Set([
  '072403.pdf',
  '772631.pdf',
  '772632.pdf',
  '772635.pdf',
  '2025-fall-semiannual-report-to-congress.pdf',
  'm10-22.pdf',
  'PLAW-111publ274.pdf',
]);

async function seedFromPDFs() {
  const files = fs.readdirSync(PDF_DIR).filter((f) => f.endsWith('.pdf') && !SKIP_PDFS.has(f));
  console.log(`Found ${files.length} PDFs (${SKIP_PDFS.size} skipped)`);

  for (const file of files) {
    try {
      const pages = await parsePDF(path.join(PDF_DIR, file));
      const metadata = inferPdfMetadata(file);
      const rows = pages
        .map((content, index) => ({
          source: `${file} page ${index + 1}`,
          source_url: metadata.sourceUrl,
          source_title: metadata.sourceTitle,
          section_title: `Page ${index + 1}`,
          page_number: index + 1,
          form_key: metadata.formKey,
          content: content.trim(),
        }))
        .filter((row) => row.content.length >= 100);

      if (rows.length === 0) {
        console.log(`Skipping ${file} - too short`);
        continue;
      }

      console.log(`Inserting ${rows.length} page chunks for ${file}`);
      const { error } = await supabase.from('form_reference').insert(rows);
      if (error) console.error(`Error inserting ${file}:`, error.message);
      else console.log(`Inserted ${file}`);
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err.message);
    }
  }

  console.log('Done!');
}

seedFromPDFs();

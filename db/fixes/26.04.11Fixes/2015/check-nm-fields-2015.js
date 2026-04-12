#!/usr/bin/env node

/**
 * NM Field Investigation — 2015
 *
 * For each 2015 award, checks the six measurement fields that may carry
 * "NM" (Not Measured) in the source HTML:
 *   PETW, PETL, LSW, LSL, LIPW, LIPL
 *
 * For each field it reports three states:
 *   html_nm   — HTML source contains "NM" for that field
 *   json_val  — what the JSON has (number, or absent/null)
 *   db_val    — what is stored in orchid_awards.sqlite (number or null)
 *
 * Output: reports/nm-fields-2015-<timestamp>.json
 *
 * Usage:
 *   node check-nm-fields-2015.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const repoRoot = path.join(__dirname, '..', '..', '..');
const dbPath = path.join(repoRoot, 'db', 'orchid_awards.sqlite');
const awardsRoot = path.join(repoRoot, 'scraper', 'copilot', 'localCopy', 'paccentraljc.org', 'awards');
const reportDir = path.join(__dirname, 'reports');

const YEAR = 2015;
const NM_FIELDS = ['PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'];

// HTML label variants the scraper uses for each field
const HTML_LABELS = {
  PETW: ['PETW'],
  PETL: ['PETL'],
  LSW: ['LSW'],
  LSL: ['LSL'],
  LIPW: ['LIPW'],
  LIPL: ['LIPL']
};

function htmlContainsNmForField(htmlContent, field) {
  const labels = HTML_LABELS[field];
  for (const label of labels) {
    // Match pattern: label appears, then NM appears within the next ~200 chars
    const labelIndex = htmlContent.indexOf(label);
    if (labelIndex === -1) continue;
    const slice = htmlContent.slice(labelIndex, labelIndex + 300);
    if (/\bNM\b/i.test(slice)) {
      return true;
    }
  }
  return false;
}

function fieldPresentInHtml(htmlContent, field) {
  const labels = HTML_LABELS[field];
  return labels.some((label) => htmlContent.includes(label));
}

function loadJsonRecords() {
  const jsonDir = path.join(awardsRoot, String(YEAR), 'data', 'json');
  if (!fs.existsSync(jsonDir)) {
    throw new Error(`JSON directory not found: ${jsonDir}`);
  }
  const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith('.json')).sort();
  const records = new Map();
  files.forEach((file) => {
    const raw = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const parsed = JSON.parse(raw);
    records.set(String(parsed.awardNum), parsed);
  });
  return records;
}

function loadDbRows() {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db.prepare(`
      SELECT awardNum, PETW, PETL, LSW, LSL, LIPW, LIPL, sourceUrl
      FROM awards
      WHERE year = ?
      ORDER BY awardNum ASC
    `).all(YEAR);
    const map = new Map();
    rows.forEach((row) => map.set(String(row.awardNum), row));
    return map;
  } finally {
    db.close();
  }
}

function main() {
  console.log(`NM Field Investigation — ${YEAR}`);
  console.log('================================');

  const jsonRecords = loadJsonRecords();
  const dbRows = loadDbRows();
  const htmlDir = path.join(awardsRoot, String(YEAR), 'html');

  const results = [];

  // Counters
  const fieldStats = {};
  NM_FIELDS.forEach((f) => {
    fieldStats[f] = { nmInHtml: 0, nullInJson: 0, nullInDb: 0, mismatch: 0 };
  });

  for (const [awardNum, jsonRecord] of jsonRecords) {
    const dbRow = dbRows.get(awardNum);
    const htmlPath = path.join(htmlDir, `${awardNum}.html`);
    const htmlExists = fs.existsSync(htmlPath);
    const htmlContent = htmlExists ? fs.readFileSync(htmlPath, 'utf8') : '';

    const fieldResults = {};
    let hasAnyIssue = false;

    for (const field of NM_FIELDS) {
      const measurements = jsonRecord.measurements || {};
      const jsonVal = measurements[field] !== undefined ? measurements[field] : null;
      const dbVal = dbRow ? (dbRow[field] !== undefined ? dbRow[field] : null) : null;
      const nmInHtml = htmlExists ? htmlContainsNmForField(htmlContent, field) : null;
      const fieldInHtml = htmlExists ? fieldPresentInHtml(htmlContent, field) : null;

      if (nmInHtml) fieldStats[field].nmInHtml += 1;
      if (jsonVal === null) fieldStats[field].nullInJson += 1;
      if (dbVal === null) fieldStats[field].nullInDb += 1;

      // Flag a mismatch: HTML has a real value but JSON/DB is null
      const realValueInHtml = fieldInHtml && !nmInHtml;
      const missingFromJsonOrDb = jsonVal === null || dbVal === null;
      const mismatch = realValueInHtml && missingFromJsonOrDb;

      if (mismatch) {
        fieldStats[field].mismatch += 1;
        hasAnyIssue = true;
      }

      fieldResults[field] = {
        nmInHtml,
        fieldPresentInHtml: fieldInHtml,
        jsonValue: jsonVal,
        dbValue: dbVal,
        mismatch
      };
    }

    results.push({
      awardNum,
      sourceUrl: dbRow ? dbRow.sourceUrl : (jsonRecord.sourceUrl ?? null),
      htmlExists,
      fields: fieldResults,
      hasAnyMismatch: hasAnyIssue
    });
  }

  const mismatches = results.filter((r) => r.hasAnyMismatch);

  // Build report
  const report = {
    createdAt: new Date().toISOString(),
    year: YEAR,
    totalAwards: results.length,
    awardsWithMismatch: mismatches.length,
    fieldSummary: NM_FIELDS.reduce((acc, f) => {
      acc[f] = fieldStats[f];
      return acc;
    }, {}),
    mismatches,
    allResults: results
  };

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const now = new Date();
  const ts = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  const outputPath = path.join(reportDir, `nm-fields-${YEAR}-${ts}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

  // Console summary
  console.log(`\nTotal 2015 awards checked: ${results.length}`);
  console.log(`Awards with potential mismatch (HTML has value, JSON/DB is null): ${mismatches.length}`);
  console.log('\nField breakdown:');
  NM_FIELDS.forEach((f) => {
    const s = fieldStats[f];
    console.log(`  ${f}: NM in HTML=${s.nmInHtml}, null in JSON=${s.nullInJson}, null in DB=${s.nullInDb}, mismatch=${s.mismatch}`);
  });
  console.log(`\nReport saved to: ${outputPath}`);
}

try {
  main();
} catch (err) {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
}

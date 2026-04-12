#!/usr/bin/env node

/**
 * Apply audit-based recommendations to orchid_awards.sqlite.
 *
 * Rules implemented:
 * 1) If mismatch has jsonValue === 0 and dbValue === null, update DB field to 0.
 * 2) If mismatch is exhibitor text difference like "A and B" vs "A & B", skip with no DB edits.
 *
 * Usage:
 *   node apply-audit-recommendations.js <path-to-audit-report.json>
 *
 * Example:
 *   node apply-audit-recommendations.js reports/audit-2015-2026-04-12T02-37-08-147Z.json
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const repoRoot = path.join(__dirname, '..', '..', '..');
const dbPath = path.join(repoRoot, 'db', 'orchid_awards.sqlite');

const MEASUREMENT_FIELD_MAP = {
  type: 'measurementType',
  description: 'description',
  numFlowers: 'numFlowers',
  numBuds: 'numBuds',
  numInflorescences: 'numInflorescences',
  NS: 'NS',
  NSV: 'NSV',
  DSW: 'DSW',
  DSL: 'DSL',
  PETW: 'PETW',
  PETL: 'PETL',
  LSW: 'LSW',
  LSL: 'LSL',
  LIPW: 'LIPW',
  LIPL: 'LIPL',
  SYNSW: 'SYNSW',
  SYNSL: 'SYNSL',
  PCHW: 'PCHW',
  PCHL: 'PCHL'
};

// Safety guard: keep updates constrained to the single approved DB column.
const ALLOWED_COLUMNS = new Set(['numBuds']);

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeExhibitor(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\s+(and|&)\s+/g, ' and ')
    .replace(/\./g, '');
}

function isAndAmpersandExhibitorEquivalent(jsonValue, dbValue) {
  if (typeof jsonValue !== 'string' || typeof dbValue !== 'string') return false;
  if (!/(\sand\s|\s&\s)/i.test(jsonValue) && !/(\sand\s|\s&\s)/i.test(dbValue)) {
    return false;
  }
  return normalizeExhibitor(jsonValue) === normalizeExhibitor(dbValue);
}

function mismatchFieldToDbColumn(field) {
  if (!field) return null;
  if (field.startsWith('measurements.')) {
    const measurementName = field.slice('measurements.'.length);
    return MEASUREMENT_FIELD_MAP[measurementName] || null;
  }
  return field;
}

function loadReport(reportPathArg) {
  if (!reportPathArg) {
    throw new Error('Missing report path. Usage: node apply-audit-recommendations.js <report.json>');
  }

  const fullPath = path.isAbsolute(reportPathArg)
    ? reportPathArg
    : path.resolve(process.cwd(), reportPathArg);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Report file not found: ${fullPath}`);
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || !parsed.details || !Array.isArray(parsed.details.fieldMismatches)) {
    throw new Error('Invalid report format: missing details.fieldMismatches');
  }

  return { parsed, fullPath };
}

function main() {
  const reportArg = process.argv[2];
  const { parsed: report, fullPath: reportPath } = loadReport(reportArg);

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found: ${dbPath}`);
  }

  const db = new Database(dbPath);

  const stats = {
    reportPath,
    dbPath,
    totalAwardsInReport: report.details.fieldMismatches.length,
    totalMismatchesInReport: 0,
    updatesApplied: 0,
    awardsUpdated: new Set(),
    skippedExhibitorAndAmpersand: 0,
    skippedNotRuleMatch: 0,
    skippedUnknownField: 0,
    updateErrors: []
  };

  try {
    const updateStatements = new Map();

    function getUpdateStmt(column) {
      if (!updateStatements.has(column)) {
        updateStatements.set(
          column,
          db.prepare(`UPDATE awards SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE awardNum = ?`)
        );
      }
      return updateStatements.get(column);
    }

    const tx = db.transaction(() => {
      report.details.fieldMismatches.forEach((awardEntry) => {
        const awardNum = String(awardEntry.awardNum);
        const mismatches = Array.isArray(awardEntry.mismatches) ? awardEntry.mismatches : [];

        mismatches.forEach((mismatch) => {
          stats.totalMismatchesInReport += 1;
          const { field, jsonValue, dbValue } = mismatch;

          if (field === 'exhibitor' && isAndAmpersandExhibitorEquivalent(jsonValue, dbValue)) {
            stats.skippedExhibitorAndAmpersand += 1;
            return;
          }

          if (!(jsonValue === 0 && dbValue === null)) {
            stats.skippedNotRuleMatch += 1;
            return;
          }

          const column = mismatchFieldToDbColumn(field);
          if (!column || !ALLOWED_COLUMNS.has(column)) {
            stats.skippedUnknownField += 1;
            return;
          }

          try {
            const stmt = getUpdateStmt(column);
            const result = stmt.run(0, awardNum);
            if (result.changes > 0) {
              stats.updatesApplied += 1;
              stats.awardsUpdated.add(awardNum);
            }
          } catch (error) {
            stats.updateErrors.push({ awardNum, field, error: error.message });
          }
        });
      });
    });

    tx();

    const summary = {
      reportPath: stats.reportPath,
      dbPath: stats.dbPath,
      totalAwardsInReport: stats.totalAwardsInReport,
      totalMismatchesInReport: stats.totalMismatchesInReport,
      updatesApplied: stats.updatesApplied,
      awardsUpdatedCount: stats.awardsUpdated.size,
      awardsUpdated: Array.from(stats.awardsUpdated).sort(),
      skippedExhibitorAndAmpersand: stats.skippedExhibitorAndAmpersand,
      skippedNotRuleMatch: stats.skippedNotRuleMatch,
      skippedUnknownField: stats.skippedUnknownField,
      updateErrors: stats.updateErrors
    };

    const outputName = `apply-recommendations-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const outputPath = path.join(__dirname, 'reports', outputName);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log('Audit Recommendations Applied');
    console.log('============================');
    console.log(`Report: ${reportPath}`);
    console.log(`Database: ${dbPath}`);
    console.log(`Total mismatches in report: ${summary.totalMismatchesInReport}`);
    console.log(`Updates applied: ${summary.updatesApplied}`);
    console.log(`Awards updated: ${summary.awardsUpdatedCount}`);
    console.log(`Skipped exhibitor and/& equivalents: ${summary.skippedExhibitorAndAmpersand}`);
    console.log(`Skipped (not rule match): ${summary.skippedNotRuleMatch}`);
    console.log(`Skipped (unknown field): ${summary.skippedUnknownField}`);
    console.log(`Update errors: ${summary.updateErrors.length}`);
    console.log(`Summary saved to: ${outputPath}`);
  } finally {
    db.close();
  }
}

try {
  if (require.main === module) {
    main();
  }
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
}

module.exports = {
  isAndAmpersandExhibitorEquivalent,
  mismatchFieldToDbColumn
};

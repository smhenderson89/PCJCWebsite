#!/usr/bin/env node

/**
 * Award Audit Tool
 * Compares scraped JSON/HTML artifacts against rows in orchid_awards.sqlite.
 *
 * Default usage:
 *   node index.js
 *
 * Year-specific usage:
 *   node index.js 2017
 *
 * Output:
 *   - Console summary
 *   - JSON report in db/fixes/26.04.11Fixes/reports
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_YEAR = 2017;

const repoRoot = path.join(__dirname, '..', '..', '..', '..');
const dbPath = path.join(repoRoot, 'db', 'orchid_awards.sqlite');
const awardsRoot = path.join(repoRoot, 'scraper', 'copilot', 'localCopy', 'paccentraljc.org', 'awards');
const reportDir = path.join(__dirname, 'reports');

const CORE_FIELDS = [
	'award',
	'awardpoints',
	'location',
	'date',
	'genus',
	'species',
	'clone',
	'cross',
	'exhibitor',
	'photographer',
	'sourceUrl',
	'htmlReference',
	'year'
];

const MEASUREMENT_FIELDS = [
	['type', 'measurementType'],
	['description', 'description'],
	['numFlowers', 'numFlowers'],
	['numBuds', 'numBuds'],
	['numInflorescences', 'numInflorescences'],
	['NS', 'NS'],
	['NSV', 'NSV'],
	['DSW', 'DSW'],
	['DSL', 'DSL'],
	['PETW', 'PETW'],
	['PETL', 'PETL'],
	['LSW', 'LSW'],
	['LSL', 'LSL'],
	['LIPW', 'LIPW'],
	['LIPL', 'LIPL'],
	['SYNSW', 'SYNSW'],
	['SYNSL', 'SYNSL'],
	['PCHW', 'PCHW'],
	['PCHL', 'PCHL']
];

const ASSUMED_CORRECT_FIELDS = new Set(['location', 'exhibitor']);

function normalizeValue(value) {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed === '' ? null : trimmed;
	}
	return value;
}

function numericLike(value) {
	if (value === null || value === undefined || value === '') return null;
	const n = Number(value);
	return Number.isNaN(n) ? value : n;
}

function valuesEqual(a, b) {
	const left = normalizeValue(a);
	const right = normalizeValue(b);

	if (left === null && right === null) return true;

	const leftNum = numericLike(left);
	const rightNum = numericLike(right);

	if (typeof leftNum === 'number' && typeof rightNum === 'number') {
		return Math.abs(leftNum - rightNum) < 0.000001;
	}

	return left === right;
}

function photoMatchesAwardNumber(photoValue, awardNum) {
	const normalized = normalizeValue(photoValue);
	if (!normalized || typeof normalized !== 'string') return false;

	const baseName = path.basename(normalized.replace(/\\/g, '/'));
	const stem = baseName.replace(/\.[^.]+$/, '');

	if (stem === String(awardNum)) return true;
	if (stem.startsWith(`${awardNum}-`) || stem.startsWith(`${awardNum}_`)) return true;
	return stem.includes(String(awardNum));
}

function getYearFromArg() {
	const yearArg = process.argv[2];
	if (!yearArg) return DEFAULT_YEAR;

	const parsedYear = Number.parseInt(yearArg, 10);
	if (Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > new Date().getFullYear()) {
		throw new Error(`Invalid year: ${yearArg}. Use a year between 2000 and ${new Date().getFullYear()}.`);
	}
	return parsedYear;
}

function getYearPaths(year) {
	return {
		jsonDir: path.join(awardsRoot, String(year), 'data', 'json'),
		htmlDir: path.join(awardsRoot, String(year), 'html')
	};
}

function readJsonRecords(jsonDir) {
	if (!fs.existsSync(jsonDir)) {
		throw new Error(`JSON directory not found: ${jsonDir}`);
	}

	const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith('.json')).sort();
	const recordMap = new Map();
	const parseErrors = [];

	files.forEach((fileName) => {
		const fullPath = path.join(jsonDir, fileName);
		try {
			const raw = fs.readFileSync(fullPath, 'utf8');
			const parsed = JSON.parse(raw);
			if (!parsed.awardNum) {
				parseErrors.push({ fileName, error: 'Missing awardNum field' });
				return;
			}
			recordMap.set(String(parsed.awardNum), parsed);
		} catch (error) {
			parseErrors.push({ fileName, error: error.message });
		}
	});

	return { recordMap, fileCount: files.length, parseErrors };
}

function readHtmlAwardNums(htmlDir) {
	if (!fs.existsSync(htmlDir)) {
		throw new Error(`HTML directory not found: ${htmlDir}`);
	}

	const files = fs.readdirSync(htmlDir).filter((name) => name.endsWith('.html')).sort();
	const awardNums = new Set();

	files.forEach((fileName) => {
		const match = fileName.match(/^(\d+)\.html$/);
		if (match) {
			awardNums.add(match[1]);
		}
	});

	return { files, awardNums };
}

function readDbRows(year) {
	if (!fs.existsSync(dbPath)) {
		throw new Error(`Database file not found: ${dbPath}`);
	}

	const db = new Database(dbPath, { readonly: true });
	try {
		const rows = db.prepare(`
			SELECT
				awardNum,
				award,
				awardpoints,
				location,
				date,
				genus,
				species,
				clone,
				cross,
				exhibitor,
				photographer,
				photo,
				sourceUrl,
				htmlReference,
				year,
				measurementType,
				description,
				numFlowers,
				numBuds,
				numInflorescences,
				NS,
				NSV,
				DSW,
				DSL,
				PETW,
				PETL,
				LSW,
				LSL,
				LIPW,
				LIPL,
				SYNSW,
				SYNSL,
				PCHW,
				PCHL
			FROM awards
			WHERE year = ?
			ORDER BY awardNum ASC
		`).all(year);

		const rowMap = new Map();
		rows.forEach((row) => {
			rowMap.set(String(row.awardNum), row);
		});

		return { rowMap, count: rows.length };
	} finally {
		db.close();
	}
}

function compareRecord(awardNum, jsonRecord, dbRecord, htmlDir, year) {
	const mismatches = [];

	CORE_FIELDS.forEach((field) => {
		if (ASSUMED_CORRECT_FIELDS.has(field)) {
			return;
		}

		if (!valuesEqual(jsonRecord[field], dbRecord[field])) {
			mismatches.push({
				field,
				jsonValue: jsonRecord[field] ?? null,
				dbValue: dbRecord[field] ?? null
			});
		}
	});

	const measurements = jsonRecord.measurements || {};
	MEASUREMENT_FIELDS.forEach(([jsonField, dbField]) => {
		if (!valuesEqual(measurements[jsonField], dbRecord[dbField])) {
			mismatches.push({
				field: `measurements.${jsonField}`,
				jsonValue: measurements[jsonField] ?? null,
				dbValue: dbRecord[dbField] ?? null
			});
		}
	});

	const jsonPhotoMatches = photoMatchesAwardNumber(jsonRecord.photo, awardNum);
	const dbPhotoMatches = photoMatchesAwardNumber(dbRecord.photo, awardNum);
	if (!jsonPhotoMatches || !dbPhotoMatches) {
		mismatches.push({
			field: 'photo',
			jsonValue: jsonRecord.photo ?? null,
			dbValue: dbRecord.photo ?? null
		});
	}

	const expectedHtmlRelativeSuffix = path.join('awards', String(year), 'html', `${awardNum}.html`).replace(/\\/g, '/');
	const sourceUrlPattern = new RegExp(`^https://www\\.paccentraljc\\.org/\\d{8}/${awardNum}\\.html$`);
	const htmlPath = path.join(htmlDir, `${awardNum}.html`);

	const referenceIssues = [];
	if (!dbRecord.sourceUrl || !sourceUrlPattern.test(dbRecord.sourceUrl)) {
		referenceIssues.push({
			field: 'sourceUrl',
			issue: 'Unexpected sourceUrl format',
			value: dbRecord.sourceUrl ?? null
		});
	}

	const normalizedHtmlReference = String(dbRecord.htmlReference || '').replace(/\\/g, '/');
	if (!normalizedHtmlReference.endsWith(expectedHtmlRelativeSuffix)) {
		referenceIssues.push({
			field: 'htmlReference',
			issue: 'htmlReference does not point to expected year/award path',
			value: dbRecord.htmlReference ?? null,
			expectedSuffix: expectedHtmlRelativeSuffix
		});
	}

	if (!dbPhotoMatches) {
		referenceIssues.push({
			field: 'photo',
			issue: 'Photo filename does not appear to match award number',
			value: dbRecord.photo ?? null
		});
	}

	if (!fs.existsSync(htmlPath)) {
		referenceIssues.push({
			field: 'htmlFile',
			issue: 'Expected HTML file missing from scraped folder',
			value: htmlPath
		});
	}

	return { mismatches, referenceIssues };
}

function buildAudit(year) {
	const { jsonDir, htmlDir } = getYearPaths(year);
	const jsonResult = readJsonRecords(jsonDir);
	const htmlResult = readHtmlAwardNums(htmlDir);
	const dbResult = readDbRows(year);

	const jsonAwardNums = new Set(jsonResult.recordMap.keys());
	const dbAwardNums = new Set(dbResult.rowMap.keys());

	const missingInDb = [];
	const extraInDb = [];
	const htmlWithoutJson = [];
	const fieldMismatches = [];
	const referenceIssues = [];

	jsonAwardNums.forEach((awardNum) => {
		if (!dbAwardNums.has(awardNum)) {
			missingInDb.push(awardNum);
			return;
		}

		const jsonRecord = jsonResult.recordMap.get(awardNum);
		const dbRecord = dbResult.rowMap.get(awardNum);
		const comparison = compareRecord(awardNum, jsonRecord, dbRecord, htmlDir, year);
		const sourceUrl = dbRecord.sourceUrl ?? jsonRecord.sourceUrl ?? null;

		if (comparison.mismatches.length > 0) {
			fieldMismatches.push({ awardNum, sourceUrl, mismatches: comparison.mismatches });
		}
		if (comparison.referenceIssues.length > 0) {
			referenceIssues.push({ awardNum, sourceUrl, issues: comparison.referenceIssues });
		}
	});

	dbAwardNums.forEach((awardNum) => {
		if (!jsonAwardNums.has(awardNum)) {
			extraInDb.push(awardNum);
		}
	});

	htmlResult.awardNums.forEach((awardNum) => {
		if (!jsonAwardNums.has(awardNum)) {
			htmlWithoutJson.push(awardNum);
		}
	});

	const summary = {
		year,
		totals: {
			jsonFiles: jsonResult.fileCount,
			jsonRecords: jsonResult.recordMap.size,
			dbRows: dbResult.count,
			htmlFiles: htmlResult.files.length,
			htmlAwardFiles: htmlResult.awardNums.size
		},
		issues: {
			jsonParseErrors: jsonResult.parseErrors.length,
			missingInDb: missingInDb.length,
			extraInDb: extraInDb.length,
			fieldMismatches: fieldMismatches.length,
			referenceIssues: referenceIssues.length,
			htmlWithoutJson: htmlWithoutJson.length
		}
	};

	return {
		createdAt: new Date().toISOString(),
		paths: {
			dbPath,
			jsonDir,
			htmlDir
		},
		summary,
		details: {
			jsonParseErrors: jsonResult.parseErrors,
			missingInDb,
			extraInDb,
			htmlWithoutJson,
			fieldMismatches,
			referenceIssues
		}
	};
}

function saveReport(report) {
	if (!fs.existsSync(reportDir)) {
		fs.mkdirSync(reportDir, { recursive: true });
	}

	const now = new Date();
	const yyyy = String(now.getFullYear());
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	const hh = String(now.getHours()).padStart(2, '0');
	const min = String(now.getMinutes()).padStart(2, '0');
	const ss = String(now.getSeconds()).padStart(2, '0');
	const fileName = `${DEFAULT_YEAR}-${yyyy}.${mm}.${dd}-${hh}${min}${ss}.json`;
	const outputPath = path.join(reportDir, fileName);
	fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
	return outputPath;
}

function printSummary(report, outputPath) {
	const { totals, issues } = report.summary;
	console.log('Award Audit Summary');
	console.log('===================');
	console.log(`Year: ${report.summary.year}`);
	console.log(`JSON files: ${totals.jsonFiles}`);
	console.log(`JSON records: ${totals.jsonRecords}`);
	console.log(`DB rows: ${totals.dbRows}`);
	console.log(`HTML files (all): ${totals.htmlFiles}`);
	console.log(`HTML files (award pages): ${totals.htmlAwardFiles}`);
	console.log('');
	console.log('Issue counts:');
	console.log(`- JSON parse errors: ${issues.jsonParseErrors}`);
	console.log(`- Missing in DB: ${issues.missingInDb}`);
	console.log(`- Extra in DB: ${issues.extraInDb}`);
	console.log(`- Field mismatches: ${issues.fieldMismatches}`);
	console.log(`- Reference/path issues: ${issues.referenceIssues}`);
	console.log(`- HTML award pages without JSON: ${issues.htmlWithoutJson}`);
	console.log('');
	console.log(`Report saved to: ${outputPath}`);
}

function main() {
	try {
		const year = getYearFromArg();
		const report = buildAudit(year);
		const outputPath = saveReport(report);
		printSummary(report, outputPath);
	} catch (error) {
		console.error(`Audit failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	buildAudit
};


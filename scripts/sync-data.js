'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeHolidayRecord } = require('../packages/npm/src/utils');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const TARGET_DATA_DIRS = [
  path.join(ROOT_DIR, 'packages', 'npm', 'data'),
  path.join(ROOT_DIR, 'packages', 'laravel', 'data'),
  path.join(ROOT_DIR, 'packages', 'dotnet', 'SriLankaHolidays', 'Data'),
  path.join(ROOT_DIR, 'packages', 'rust', 'data'),
  path.join(ROOT_DIR, 'packages', 'go', 'data'),
  path.join(ROOT_DIR, 'packages', 'python', 'sri_lanka_holidays', 'data')
];

function syncHolidayData() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error('No YYYY.json files found in root data/ directory.');
  }

  const combinedByYear = {};

  for (const file of files) {
    const year = Number(file.slice(0, 4));
    const filePath = path.join(DATA_DIR, file);
    const rawList = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!Array.isArray(rawList)) {
      throw new Error(`${file} must contain a JSON array of holidays.`);
    }

    const normalized = rawList
      .map((item) => {
        const record = normalizeHolidayRecord(item);
        return {
          date: record.date,
          day: record.day,
          name: record.name,
          types: record.types,
          isPoya: record.isPoya
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    combinedByYear[year] = normalized;
  }

  // Copy individual YYYY.json files and combined holidays.json to each target package
  for (const targetDir of TARGET_DATA_DIRS) {
    fs.mkdirSync(targetDir, { recursive: true });

    for (const [year, holidays] of Object.entries(combinedByYear)) {
      fs.writeFileSync(
        path.join(targetDir, `${year}.json`),
        JSON.stringify(holidays, null, 2) + '\n',
        'utf8'
      );
    }

    // Write combined holidays.json for packages that embed a single file (e.g. .NET)
    if (!targetDir.endsWith(path.join('packages', 'npm', 'data'))) {
      fs.writeFileSync(
        path.join(targetDir, 'holidays.json'),
        JSON.stringify(combinedByYear, null, 2) + '\n',
        'utf8'
      );
    }
  }

  // Generate Dart embedded data file so Dart/Flutter works synchronously on all platforms
  const dartDataDir = path.join(ROOT_DIR, 'packages', 'dart', 'lib', 'src');
  fs.mkdirSync(dartDataDir, { recursive: true });
  const dartSource = `// GENERATED FILE - DO NOT EDIT MANUALLY.
// Run \`npm run sync\` from the repository root to regenerate from data/*.json.

const Map<int, List<Map<String, Object>>> defaultHolidaysByYear = ${JSON.stringify(
    combinedByYear,
    null,
    2
  ).replace(/"(\d{4})":/g, '$1:')};
`;
  fs.writeFileSync(path.join(dartDataDir, 'holidays_data.dart'), dartSource, 'utf8');

  console.log(
    `Synced years [${Object.keys(combinedByYear).join(', ')}] across all 7 language packages (npm, laravel, dotnet, rust, go, python, dart).`
  );
}

syncHolidayData();

'use strict';

const holidays2026 = require('./2026.json');
const holidays2027 = require('./2027.json');

const holidayDataByYear = {
  2026: holidays2026,
  2027: holidays2027
};

// Automatically discover any additional YYYY.json files added to the `data/` directory in future updates
try {
  const fs = require('fs');
  const path = require('path');
  if (fs && typeof fs.readdirSync === 'function') {
    const files = fs.readdirSync(__dirname);
    for (const file of files) {
      const match = /^(\d{4})\.json$/.exec(file);
      if (match) {
        const year = Number(match[1]);
        if (!holidayDataByYear[year]) {
          holidayDataByYear[year] = require(path.join(__dirname, file));
        }
      }
    }
  }
} catch (_) {
  // Safe fallback for browser/bundler environments without `fs`
}

module.exports = holidayDataByYear;


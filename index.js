const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const spawnSync = require('child_process').spawnSync;

const TESTS_DIR = path.resolve(__dirname, '__tests__');
const MOCHA_BIN = path.resolve(__dirname, 'node_modules/.bin/mocha');
const JEST_BIN = path.resolve(__dirname, 'node_modules/.bin/jest');
const TESTS_PER_FILE = 40;
const OUTPUT_FILE = path.resolve(__dirname, 'result.js');

const IT_BLOCK = `
it('works', () => {
  const secret = Math.random().toString();
  for (let i = 0; i <= 5000; i++) {
    crypto.createHmac('sha256', secret).update(Math.random().toString()).digest('hex');
  }
});
`;

const TEST_CONTENT = `
'use strict';

const crypto = require('crypto');

${[...Array(TESTS_PER_FILE)].map(() => IT_BLOCK).join('')}
`

const createTestFiles = n => {
  [...Array(n)].map((_, n) => path.resolve(__dirname, TESTS_DIR, `${n}-test.js`)).forEach(file => {
    fs.writeFileSync(file, TEST_CONTENT);
  })
}

const runMocha = (n) => createTestFiles(n) || spawnSync(MOCHA_BIN, ['__tests__/*']);
const runJest = (n) => createTestFiles(n) || spawnSync(JEST_BIN);

const measure = fn => {
  const before = Date.now();
  fn();
  return Math.round((Date.now() - before) / 1000);
}

rimraf.sync(TESTS_DIR);
mkdirp.sync(TESTS_DIR);

const result = [];

for (let n = 1; n <= 30; n++) {
  result.push({
    tests: n * TESTS_PER_FILE,
    jest: measure(() => runJest(n)),
    mocha: measure(() => runMocha(n)),
  });
  console.log(`done measuring n = ${n}`)
}

fs.writeFileSync(OUTPUT_FILE, `var DATA = ${JSON.stringify(result, null, 2)};`);
console.log(`Results are written to: ${OUTPUT_FILE}`)
console.log(result);

#!/usr/bin/env node

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fetchCommits } from './lib/fetchGitHubCommits.js';
import { extractJDKIssues } from './lib/extractJDKIssues.js';

// parse CLI arguments
const options = {
  repository: {
    type: 'string',
  },
  baseTag: {
    type: 'string',
  },
  tag: {
    type: 'string',
  },
  filename: {
    type: 'string',
  },
};

const {
  repository,
  baseTag,
  tag,
  filename,
} = parseArgs({
  options,
}).values;

const commitsJson = await fetchCommits({
  repository,
  baseTag,
  tag,
});
console.log(`Fetched ${commitsJson.length} commits`);
const JDK_ISSUES = await extractJDKIssues(commitsJson);

console.log(`Writing JDK issues to ${filename}`);
fs.writeFileSync(path.resolve(process.cwd(), `${filename}`), JSON.stringify(JDK_ISSUES, null, 2));

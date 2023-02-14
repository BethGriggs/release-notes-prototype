#!/usr/bin/env node

/* This script is used to fetch OpenJDK release notes from the bugs.openjdk.org */

import {
  parseArgs,
} from 'node:util';

import fs from 'node:fs';
import path from 'node:path';
import fetchJiraIssues from './lib/fetchJiraIssues.js';

// parseArgs is used to parse command line arguments
const options = {
  commitList: { type: 'string', alias: 'c' },
  filename: { type: 'string', alias: 'f' },
  version: { type: 'string', alias: 'v' },
};

const { commitList, filename, version } = parseArgs({ options }).values;

const commits = JSON.parse(fs.readFileSync(commitList));

const output = [];

const JIRA_ISSUES = await fetchJiraIssues(version);

// loop through the commits and add the release notes to the output
for (const commit of commits) {
  let releaseNote = JIRA_ISSUES
    .find((issue) => issue.id === commit.id || issue.backportOf === commit.id);

  if (!releaseNote) {
    releaseNote = {
      id: commit.id,
      title: commit.title,
      priority: null,
      component: null,
      subcomponent: null,
      link: `https://bugs.openjdk.java.net/browse/${commit.id}`,
      type: null,
      backportOf: null,
    };
  }

  output.push(releaseNote);
}

fs.writeFileSync(path.resolve(process.cwd(), `${filename}`), JSON.stringify(output, null, 2));

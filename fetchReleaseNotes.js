#!/usr/bin/env node

/* This script is used to fetch OpenJDK release notes from the bugs.openjdk.org */

import {
  parseArgs,
} from 'node:util';

import fs from 'node:fs';
import path from 'node:path';

// parseArgs is used to parse command line arguments
const options = {
  commitList: { type: 'string', alias: 'c' },
  filename: { type: 'string', alias: 'f' },
  version: { type: 'string', alias: 'v' },
};

const { commitList, filename, version } = parseArgs({ options }).values;

const commits = JSON.parse(fs.readFileSync(commitList));

const output = [];

// fetch the release notes from the bugs.openjdk.org
const baseUrl = 'https://bugs.openjdk.java.net/rest/api/2/search?jql=';
const jql = `project=JDK AND (status in (Closed, Resolved)) AND (resolution not in ("Won't Fix", "Duplicate", "Cannot Reproduce", "Not an Issue", "Withdrawn")) AND (labels not in (release-note, testbug, openjdk-na, testbug) OR labels is EMPTY) AND (summary !~ "testbug") AND (summary !~ "problemlist") AND (summary !~ "problem list") AND (summary !~ "release note") AND (issuetype != CSR) AND fixVersion=${version}`;
// execute the initial fetch to get the total number of issues
const totalQuery = await fetch(`${baseUrl + jql}&startAt=1&maxResults=1`);
const initialRes = await totalQuery.json();
const { total } = initialRes;

const JIRA_ISSUES = [];

// fetch all the issues by page
for (let startAt = 0; startAt <= total + 50; startAt += 50) {
  const query = await fetch(`${baseUrl + jql}&startAt=${startAt}&maxResults=50`);
  const pageRes = await query.json();

  pageRes.issues.forEach((issue) => {
    let parent = '';

    // if the issue is a backport, get the parent issue JDK number
    if (issue.fields.issuetype.name === 'Backport') {
      const linkedIssues = issue.fields.issuelinks;

      linkedIssues.forEach((linkedIssue) => {
        if (linkedIssue.type.name === 'Backport') {
          parent = linkedIssue.inwardIssue.key;
        }
      });
    }

    JIRA_ISSUES.push({
      id: issue.key,
      title: issue.fields.summary,
      priority: issue.fields.priority.id,
      component: issue.fields.components[0].name,
      subcomponent: `${issue.fields.components[0].name}${issue.fields.customfield_10008?.name ? `/${issue.fields.customfield_10008?.name}` : ''}`,
      link: `https://bugs.openjdk.java.net/browse/${issue.key}`,
      type: issue.fields.issuetype.name,
      backportOf: parent || null,
    });
  });
}

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

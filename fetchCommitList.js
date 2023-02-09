#!/usr/bin/env node

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

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

let page = 1;
const pageSize = 100;
let hasNextPage = true;
const JDK_ISSUES = [];

function isJDKIssue(line) {
  return (/^[0-9]+:/).test(line);
}

while (hasNextPage) {
  const githubQuery = `https://api.github.com/repos/${repository}/compare/${baseTag}...${tag}?per_page=${pageSize}&page=${page}`;
  console.log(`Fetching commits for ${repository} between ${baseTag} and ${tag}...`);
  console.log(`Fetching commits from ${githubQuery}`);
  const githubResponse = await fetch(githubQuery);
  const githubResponseJson = await githubResponse.json();
  if (!githubResponse.ok) {
    console.error(githubResponseJson);
    throw new Error(`Failed to fetch commits from ${githubQuery}`);
  }

  hasNextPage = (githubResponse.headers.get("link") || "").includes("rel=\"next\"");

  for (const commit of githubResponseJson.commits) {
    const commitLines = commit.commit.message.split('\n');
    commitLines.forEach((line) => {
      if (isJDKIssue(line)) {
        JDK_ISSUES.push({
          id: `JDK-${line.split(':')[0]}`,
          commit: commit.sha,
          title: line,
        });
      }
    });
  }

  page += 1;
}

fs.writeFileSync(path.resolve(process.cwd(), `${filename}`), JSON.stringify(JDK_ISSUES, null, 2));

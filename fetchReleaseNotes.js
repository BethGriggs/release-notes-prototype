#!/usr/bin/env node

/* This script is used to fetch OpenJDK release notes from the bugs.openjdk.org */ 

// parse the version from the command-line
const version = process.argv[2];

// object to store the release notes
let output = [];

// fetch the release notes from the bugs.openjdk.org
const baseUrl = "https://bugs.openjdk.java.net/rest/api/2/search?jql=";
const jql = "project=JDK AND (status in (Closed, Resolved)) AND (resolution not in (\"Won't Fix\", \"Duplicate\", \"Cannot Reproduce\", \"Not an Issue\", \"Withdrawn\")) AND (labels not in (release-note, testbug, openjdk-na, testbug) OR labels is EMPTY) AND (summary !~ \"testbug\") AND (summary !~ \"problemlist\") AND (summary !~ \"problem list\") AND (summary !~ \"release note\") AND (issuetype != CSR) AND fixVersion=" + version;

// execute the initial fetch to get the total number of issues
const totalQuery = await fetch(baseUrl + jql + "&startAt=1&maxResults=1");
const res = await totalQuery.json();
const total = res.total;

// fetch all the issues by page
for (let startAt = 0; startAt <= total + 50; startAt += 50) {
    const query = await fetch(baseUrl + jql + "&startAt=" + startAt + "&maxResults=50");
    const res = await query.json();

    res.issues.forEach(issue => {
        output.push(
            {
                "id": issue.key,
                "title": issue.fields.summary,
                "priority": issue.fields.priority.id,
                "component": issue.fields.components[0].name,
                "subcomponent": `${issue.fields.components[0].name}${issue.fields.customfield_10008?.name ? '/' + issue.fields.customfield_10008?.name : ''}`,
                "link": "https://bugs.openjdk.java.net/browse/" + issue.key,
                "type": issue.fields.issuetype.name,
            }
        )
    });
 }

 console.log(JSON.stringify(output, null, 2));
# Release Notes Prototype

Prototype of fetching OpenJDK release notes. 

# Usage 

```console 
nvm install 18
node fetchReleaseNotes.js <version>
```

# Current Output

* Writes a file in the format `RELEASE-NOTES-${version.json}`

JSON Format: 

```json
  {
    "id": "JDK-8281211",
    "title": "Correct signer logic for jars signed with multiple digest algorithms",
    "description": null,
    "priority": "3",
    "component": "security-libs",
    "subcomponent": "security-libs/java.security",
    "link": "https://bugs.openjdk.java.net/browse/JDK-8281211",
    "type": "Backport"
  },
  ...
```

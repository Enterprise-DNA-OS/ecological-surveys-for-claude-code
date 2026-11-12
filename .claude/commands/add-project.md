---
description: "add project for ecological survey records"
---

# add-project

Read CLAUDE.md and docs/cli.md. Read the affected project or survey first. Use the operator name as an audit label and only supplied facts. Run:

```bash
npm run surveys -- add-project --code=PROJECT --name="Project name" --owner="Name" --jurisdiction=NZ --actor="Name"
```

Present the result with record codes. Use --json for untrimmed values. List ambiguity candidates and stop instead of selecting a record by guess.

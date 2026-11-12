---
description: "add survey for ecological survey records"
---

# add-survey

Read CLAUDE.md and docs/cli.md. Read the affected project or survey first. Use the operator name as an audit label and only supplied facts. Run:

```bash
npm run surveys -- add-survey --project=PROJECT --code=SURVEY --site="Site" --surveyed-on=YYYY-MM-DD --observer="Name" --method="Method" --review-due=YYYY-MM-DD --actor="Name"
```

Present the result with record codes. Use --json for untrimmed values. List ambiguity candidates and stop instead of selecting a record by guess.

---
description: "add observation for ecological survey records"
---

# add-observation

Read CLAUDE.md and docs/cli.md. Read the affected project or survey first. Use the operator name as an audit label and only supplied facts. Run:

```bash
npm run surveys -- add-observation --survey=SURVEY --code=OBS --species="Scientific name" --count=1 --identification=provisional --evidence="archive reference" --actor="Name"
```

Present the result with record codes. Use --json for untrimmed values. List ambiguity candidates and stop instead of selecting a record by guess.

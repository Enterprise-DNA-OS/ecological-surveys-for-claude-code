---
description: "revise observation for ecological survey records"
---

# revise-observation

Read CLAUDE.md and docs/cli.md. Read the affected project or survey first. Use the operator name as an audit label and only supplied facts. Run:

```bash
npm run surveys -- revise-observation --observation=OBS --identification=confirmed --reason="Identification evidence" --actor="Name"
```

Present the result with record codes. Use --json for untrimmed values. List ambiguity candidates and stop instead of selecting a record by guess.

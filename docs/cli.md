# CLI reference

Run npm run surveys -- COMMAND. Add --json for full values. Flags use --name=value. Quote spaces. Every mutation needs --actor="Name". Help returns all command names. Unknown commands and ambiguous references exit 1.

## Reads

- projects
- surveys
- review-queue
- evidence-gaps
- permit-check
- species-register
- provisional-identifications
- actions-due
- owner-workload
- stale-surveys
- sensitive-records
- survey-effort
- review-history
- compliance
- attention
- notes
- audit
- imports

project PROJECT returns its surveys. survey SURVEY returns source fields, observations, actions, reviews, notes and record checks. References accept exact codes, unique code or UUID prefixes, and case-insensitive names.

## Writes

### add-project

```bash
npm run surveys -- add-project --code=PROJECT --name="Project name" --owner="Name" --jurisdiction=NZ --actor="Name"
```

### add-survey

```bash
npm run surveys -- add-survey --project=PROJECT --code=SURVEY --site="Site" --surveyed-on=YYYY-MM-DD --observer="Name" --method="Method" --review-due=YYYY-MM-DD --actor="Name"
```

### revise-survey

```bash
npm run surveys -- revise-survey --survey=SURVEY --reason="Why this changed" --evidence-ref="archive reference" --actor="Name"
```

### add-observation

```bash
npm run surveys -- add-observation --survey=SURVEY --code=OBS --species="Scientific name" --count=1 --identification=provisional --evidence="archive reference" --actor="Name"
```

### revise-observation

```bash
npm run surveys -- revise-observation --observation=OBS --identification=confirmed --reason="Identification evidence" --actor="Name"
```

### add-action

```bash
npm run surveys -- add-action --survey=SURVEY --code=ACTION --description="Work needed" --owner="Name" --due=YYYY-MM-DD --actor="Name"
```

### complete-action

```bash
npm run surveys -- complete-action --action=ACTION --evidence="What proves completion" --actor="Name"
```

### review-survey

```bash
npm run surveys -- review-survey --survey=SURVEY --evidence="Checks performed against original evidence" --actor="Reviewer name"
```

### log

```bash
npm run surveys -- log --survey=SURVEY --body="Factual note" --actor="Name"
```

### import

```bash
npm run surveys -- import wildnote --project=PROJECT --file=imports/pivot.xlsx --mapping=imports/mapping.json --dry-run --actor="Name"
```

add-survey and revise-survey accept site, surveyed-on, observer, method, latitude, longitude, effort-minutes, evidence-ref, permit-required, permit-ref, permit-from, permit-until, permit-scope, applicability-basis and review-due. Dates are real YYYY-MM-DD values. Coordinates are decimal WGS84 degrees, always a pair. Missing coordinates and effort are allowed into the evidence queue but block review. Missing permission applicability also blocks review. Never assume a missing permission flag means no permission is needed.

New surveys require project, code, site, surveyed-on, observer, method and review-due. Revisions require survey and reason. Survey codes are immutable. All survey edits increment revision, even an unchanged value, to keep review invalidation conservative.

add-observation requires survey, code, species and count. Optional identification is provisional or confirmed, sensitive is yes or no, and evidence is an archive reference. revise-observation requires observation and reason, accepts species, count, identification, sensitive and evidence. Species names and status are supplied by the operator, never matched to a regulatory list.

review-survey requires survey, evidence and a named actor different from the observer. It refuses unresolved checks or open actions. It records professional review evidence; it is not an electronic signature service or statutory approval. complete-action requires completion evidence and refuses a second completion.

## Working papers and export

weekly-review combines review-queue, compliance and actions-due into drafts. draft-survey SURVEY and draft-field-return SURVEY create branded internal working papers. npm run docs produces both document types for every survey. npm run view produces read-only dashboards. OUTPUT_DIR redirects generated files for testing.

export --out=NEW_DIRECTORY writes projects, surveys, observations, actions, reviews, notes, import_batches and audit_log as JSON. It refuses an existing directory. Import sources are base64 in import_batches, with a SHA-256 digest and mapping. This is a lossless record archive, not an automatic restore command. Preserve a database backup as well.

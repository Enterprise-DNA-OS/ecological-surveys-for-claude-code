# Ecological Surveys for Claude Code

Field evidence, species observations and survey reviews in a database you own. MIT-licensed software from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free source code. Install and operate it. | Your forms, review rules, reports and Wildnote exports mapped across. [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=wildnote). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=wildnote). |

## What this replaces

The office work around ecological field surveys: assembling the evidence, checking what is missing, confirming identifications, following up site visits and producing review papers. Wildnote's [pricing page](https://www.wildnoteapp.com/pricing), checked 12 November 2026, lists a starting price of $675 per user per year, with a two-user minimum and custom rates. Its site also announces acquisition by Fulcrum. Confirm current terms for your team.

This free base keeps survey records and original imported answer fields, an observation register, permission references, actions, notes and revision-specific reviews. It does not reproduce the entire Wildnote mobile platform. Field collection, offline synchronisation, photo storage, maps and statutory form layouts are separate work to agree for your version. Independent software, not affiliated with Wildnote or Fulcrum.

## Quick start

Node 22.13 or later. No server or account is needed for the demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/ecological-surveys-for-claude-code.git
cd ecological-surveys-for-claude-code
npm install
npm test
npm run demo
npm run surveys -- review-queue
npm run surveys -- compliance
npm run view
npm run docs
```

Without DATABASE_URL, PGlite persists locally under .data/db or DATA_DIR. With DATABASE_URL, the same migrations run on Postgres. Use npm run migrate for a new shared database. Demo data is fictional, includes expired permission evidence and overdue work, and seeds idempotently. A shared demo database requires an explicit --demo-database argument to scripts/seed.mjs. Never seed production.

## Five weekly rituals

- /review-queue shows surveys awaiting a current review, with check counts and open work.
- /permit-check checks recorded applicability, references, scope and date coverage.
- /species-register groups observed counts by project, taxon, identification status and sensitivity.
- /actions-due orders field follow-ups by date and owner.
- /weekly-review creates one branded paper from the review queue, record checks and actions.

A changed survey, observation or action increments the survey revision. Earlier reviews stay visible but no longer count as current. A review needs complete record checks, no open actions, evidence, and a different named person from the field observer. Permission applicability and scope are professional decisions, never inferred from a species name. Counts are observations, not population estimates or survey comparability claims.

## Commands and documents

36 recipes live in .claude/commands. [CLI syntax](docs/cli.md). Use npm run surveys -- help for the command list and --json for complete values. Human output trims cells to 70 characters. Partial IDs, codes and case-insensitive names work, with ambiguity listed and exit code 1.

npm run view renders private read-only week and species dashboards. npm run docs renders a survey evidence paper and field return brief per survey. brand.json controls business name, colours and logo. Draft commands write working papers to drafts and never send. Export writes all eight record collections as JSON, including source workbook bytes, mappings and full change history. Keep the original field photographs in your controlled archive; a reference does not copy the photo.

## Ten questions to ask

These questions are answered by the current CLI. They are configurable local reviews, not claims that Wildnote cannot offer similar analysis.

1. Which surveys have changed since their last review? review-queue and review-history.
2. Which permission references fail to cover the survey date? permit-check.
3. Which field visits are missing coordinates, effort or evidence? evidence-gaps.
4. Which species identifications still need confirmation? provisional-identifications.
5. Which follow-ups are overdue, and who owns them? actions-due.
6. Which project has observations marked sensitive? sensitive-records.
7. Which taxa were observed on each project, by confirmation status? species-register.
8. Which surveys are over thirty days old and still unreviewed? stale-surveys.
9. How much recorded effort went into each survey method? survey-effort.
10. Which original answers and source export supplied a survey? survey, imports and export.

## Your first hour: ten things to ask for

1. Put our business name and colours in brand.json.
2. Run the fictional Monday review.
3. Open a survey paper and compare it with the record checks.
4. Create our first project and name its owner.
5. Inspect one Wildnote Pivot Report workbook and map its questions.
6. Test the import before writing any records.
7. Record our permission applicability assessment and evidence references.
8. Add our observed species and mark sensitive records.
9. Give missing evidence a named owner and due date.
10. Ask /customise for our review rules, then /new-view for the report we need.

## Move your records

[Switching guide](docs/replace-wildnote.md). Wildnote documents Pivot Report Excel exports with one survey per row. This importer reads that shape with a reviewed mapping because form questions differ. It retains every source answer and the original workbook. Dynamic species questions remain in source fields until explicitly mapped into observations. No fabricated native format or vendor fixture is included.

## Record checks and access

[Compliance sources and limits](docs/compliance.md). Checks support the responsible ecologist; they do not issue permits, establish legal compliance, identify species or certify a report. The built-in permission example is New Zealand marine reserve research. Other work and jurisdictions require their own assessed rules.

Row security is enabled and PUBLIC access is revoked. This is a trusted-operator database, not a multi-tenant service. Actor labels are not authenticated identity. Database owners can change the schema and bypass application controls, so keep independent backups. Exports, source workbooks and generated HTML contain private records and sensitive locations. There is no automatic deletion or retention timer.

## Verification

npm test uses a temporary PGlite database and covers migrations, seed idempotency, every CLI command, invalid dates, permission gaps, stale reviews, imports, duplicate prevention, exports and escaped HTML. GitHub Actions runs the same suite on Windows and Linux, plus disposable Postgres. To run the Postgres suite locally, set ECOLOGY_TEST_DATABASE_URL to an empty disposable database. Tests leave its records in place; drop that disposable database afterwards.

[Why no front end](docs/why-no-front-end.md). Customise the database and commands, not a separate agent-specific codebase.

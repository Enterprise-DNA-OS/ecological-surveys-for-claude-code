# Move the office review desk from Wildnote

Source checked 12 November 2026: [Wildnote: Exporting for Reports and Analysis](https://help.wildnoteapp.com/en/articles/2537664-videos-exporting-for-reports-and-analysis).

Wildnote documents two Excel layouts. Data Sheet Report lists questions down the page. Pivot Report puts questions into columns and each survey into a row. Use Pivot Report for this importer. Export the desired form and surveys from the Export screen, then retrieve the result from Exported Reports. Download photographs separately and retain the source archive under your own access controls.

## Inspect and map

Create a project first. Inspect the actual workbook and copy examples/wildnote-mapping.json to imports/mapping.json. Set sheet and header_row to the worksheet and header row you actually have. The example field names are illustrative, not a verified vendor header set. Set columns to the exact source question labels. Date values must be real YYYY-MM-DD text or Excel date cells. Convert formulas to values before import.

Required destinations are code, site, surveyed_on, observer, method and review_due. Each can come from columns or defaults. Choose review_due explicitly; Wildnote does not need to have a review date question. Latitude and longitude are paired decimal WGS84 coordinates. Effort is positive whole minutes. Permission applicability must be assessed for the actual activity. Imported rows without this basis remain in the review queue.

Test first:

```bash
npm run surveys -- import wildnote --project=PROJECT --file=imports/pivot.xlsx --mapping=imports/mapping.json --dry-run --actor="Operator name"
```

Remove --dry-run to import in one command after checking the row count. Values-only CSV exported from the same pivot layout works too. No network login is needed. Imports validate the whole batch and write in one transaction. Rerunning identical bytes with the same mapping skips it. A changed mapping for identical bytes is rejected. Existing survey codes are never overwritten. Import separate projects or fix source conflicts deliberately.

## What carries across

Mapped fields become survey records. Every source column stays in source_fields and the original file is archived in import_batches with its digest, mapping and actor. Unmapped questions remain readable. The importer does not reinterpret nested species questions or observation lists. Read those retained answers and add confirmed observation records through add-observation, or customise an explicitly tested form-specific mapping.

Photographs, attachments, original Wildnote permissions, account users, signatures, maps and offline collection are not transferred by this workbook import. Keep exported files and original photographs in the evidence archive and reference them from records. Historical review status is not trusted as a new review. Review imported records against their evidence before relying on a generated paper.

Compare record counts and a selection of original answers, photographs and dates. Keep the source system until you have verified access to the records and any field collection workflow your team still needs. Enterprise DNA can scope mobile collection, maps and document formats into your version.

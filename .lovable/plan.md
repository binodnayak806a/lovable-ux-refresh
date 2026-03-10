

## Plan: Remove Status Column from IPD Patient List

The IPD page has both status **tabs** at the top (ALL, ADMITTED, DISCHARGED, etc.) and a **Status column** in the table. Since the tabs already filter by status, the column is redundant.

### Changes

**`src/modules/ipd/IPDPage.tsx`**
- Remove the "Status" `<th>` header (line 400)
- Remove the Status `<td>` cell with the Badge showing `adm.status` (lines ~488-498)

That's it — two small removals. The status tabs at the top remain for filtering.


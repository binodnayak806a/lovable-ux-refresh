export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length !== headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = values[j]; });
    rows.push(row);
  }
  return rows;
}

export function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string, columns?: { key: string; label: string }[]) {
  if (data.length === 0) return;
  const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);
  const headers = columns ? columns.map(c => c.label) : keys;
  const csvRows = [headers.join(',')];
  data.forEach(item => {
    const values = keys.map(k => {
      const val = item[k];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    });
    csvRows.push(values.join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Formats one value as a CSV cell:
// - quotes cells containing commas, quotes or newlines (so "Acme, Inc." stays one column)
// - prefixes cells starting with = + - @ so spreadsheets don't run them as formulas (CSV injection)
export const toCsvCell = (value: unknown): string => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCSV = (data: Record<string, any>[]): string => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]).filter((k) => k !== 'attributes');
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      // Related records (e.g. Account) come back as objects; export their Name
      if (val && typeof val === 'object') return toCsvCell(val.Name);
      return toCsvCell(val);
    })
  );
  return [headers.map(toCsvCell), ...rows].map((r) => r.join(',')).join('\n');
};

export const exportToCSV = (data: Record<string, any>[], filename: string) => {
  if (!data.length) return;
  const blob = new Blob([toCSV(data)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

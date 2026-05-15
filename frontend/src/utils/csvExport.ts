export const exportToCSV = (data: Record<string, any>[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).filter((k) => k !== 'attributes');
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val && typeof val === 'object') return val.Name || '';
      return val ?? '';
    })
  );
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

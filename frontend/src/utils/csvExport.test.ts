import { toCSV, toCsvCell } from './csvExport';

test('quotes values that contain commas, quotes or newlines', () => {
  expect(toCsvCell('Acme, Inc.')).toBe('"Acme, Inc."');
  expect(toCsvCell('6" pipe')).toBe('"6"" pipe"');
  expect(toCsvCell('line1\nline2')).toBe('"line1\nline2"');
  expect(toCsvCell('plain')).toBe('plain');
});

test('neutralises spreadsheet formulas (CSV injection)', () => {
  expect(toCsvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
  expect(toCsvCell('+1 555')).toBe("'+1 555");
});

test('exports related records by name and skips the Salesforce attributes field', () => {
  const csv = toCSV([
    { attributes: { type: 'Contact' }, LastName: 'Hopper', Account: { Name: 'Navy, US' }, Phone: null },
  ]);
  expect(csv).toBe('LastName,Account,Phone\nHopper,"Navy, US",');
});

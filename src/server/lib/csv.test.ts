import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';

const columns = [
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B' },
];

describe('toCsv', () => {
  it('writes a quoted header row of labels and CRLF line ends', () => {
    expect(toCsv([{ a: 'x', b: 'y' }], columns)).toBe('"A","B"\r\n"x","y"');
  });
  it('neutralises formulas', () => {
    expect(toCsv([{ a: '=SUM(A1)' }], columns).split('\r\n')[1]).toBe(`"'=SUM(A1)",""`);
    expect(toCsv([{ a: '  -1' }], columns).split('\r\n')[1]).toBe(`"'  -1",""`);
    expect(toCsv([{ a: '@x', b: '\tt' }], columns).split('\r\n')[1]).toBe(`"'@x","'\tt"`);
    expect(toCsv([{ a: '+1', b: '\rr' }], columns).split('\r\n')[1]).toBe(`"'+1","'\rr"`);
  });
  it('doubles quotes, blanks null, writes Dates as ISO', () => {
    expect(toCsv([{ a: 'a"b', b: null }], columns).split('\r\n')[1]).toBe('"a""b",""');
    expect(toCsv([{ a: new Date('2026-01-02T03:04:05Z') }], columns).split('\r\n')[1]).toBe(
      '"2026-01-02T03:04:05.000Z",""',
    );
  });
});

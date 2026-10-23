import { describe, expect, it } from 'vitest';

import { sniff } from './sniff';

const bytes = (...parts: (number[] | string)[]) =>
  Buffer.concat(parts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));

const ebml = (docType: string) => bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x80 | docType.length], docType);

describe('sniff', () => {
  it.each([
    [bytes([0xff, 0xd8, 0xff, 0xe0]), 'jpg'],
    [bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'png'],
    [bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '), 'webp'],
    [bytes([0, 0, 0, 0x1c], 'ftypavif'), 'avif'],
    [bytes('%PDF-1.7'), 'pdf'],
    [bytes([0, 0, 0, 0x18], 'ftypmp42'), 'mp4'],
    [ebml('webm'), 'webm'],
  ])('recognises %#', (input, ext) => expect(sniff(input)?.ext).toBe(ext));

  it('reports video mime types', () => {
    expect(sniff(bytes([0, 0, 0, 0x18], 'ftypisom'))).toEqual({ mime: 'video/mp4', ext: 'mp4' });
    expect(sniff(ebml('webm'))).toEqual({ mime: 'video/webm', ext: 'webm' });
  });

  // SVG is script, whatever its extension says.
  it.each([
    bytes("<svg xmlns='http://www.w3.org/2000/svg'/>"),
    bytes('GIF89a'),
    bytes([0, 0, 0, 0x14], 'ftypqt  ', [0, 0, 0, 0], 'qt  '),
    bytes([0, 0, 0, 0x18], 'ftypheic', [0, 0, 0, 0], 'mif1heic'),
    bytes([0, 0, 0, 0x14], 'ftyp3gp4', [0, 0, 0, 0], 'isom'),
    ebml('matroska'),
    bytes(''),
  ])('refuses %#', (input) => expect(sniff(input)).toBeNull());
});

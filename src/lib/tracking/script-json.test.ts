import { describe, expect, it } from 'vitest';

import { scriptJson } from './script-json';

describe('scriptJson', () => {
  it('escapes everything that could close or break a script tag', () => {
    const value = { a: '</script><!--&\u2028\u2029' };
    const out = scriptJson(value);
    expect(out).not.toContain('</');
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(out).toContain('\\u003c/script');
    expect(JSON.parse(out)).toEqual(value);
  });
});

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { clickEvent } from './clicks';

const html = (markup: string) => {
  document.body.innerHTML = markup;
  return document.body;
};

describe('clickEvent', () => {
  it('phone and email links', () => {
    html('<a href="tel:+35312345678"><span id="t">Call</span></a><a id="m" href="mailto:hello@example.com">Mail</a>');
    expect(clickEvent(document.getElementById('t'))).toEqual({
      event: 'contact_click',
      params: { method: 'phone' },
    });
    expect(clickEvent(document.getElementById('m'))).toEqual({
      event: 'contact_click',
      params: { method: 'email' },
    });
  });
  it('WhatsApp links', () => {
    html(
      '<a id="w" href="https://wa.me/353891234567">WhatsApp</a><a id="x" href="https://api.whatsapp.com/send?phone=1">x</a>',
    );
    for (const id of ['w', 'x'])
      expect(clickEvent(document.getElementById(id))).toEqual({
        event: 'contact_click',
        params: { method: 'whatsapp' },
      });
  });
  it('ignores everything else', () => {
    html('<a id="a" href="/about">About</a><a id="o" href="https://example.com/wa.me/">o</a><button id="b">x</button>');
    expect(clickEvent(document.getElementById('a'))).toBeNull();
    expect(clickEvent(document.getElementById('o'))).toBeNull();
    expect(clickEvent(document.getElementById('b'))).toBeNull();
    expect(clickEvent(null)).toBeNull();
  });
});

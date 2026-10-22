import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { OgCard } from './og-card';

const colors = { background: '#131313', text: '#ffffff', accent: '#ff3b30' };

describe('OgCard', () => {
  const html = renderToStaticMarkup(<OgCard title='About us' eyebrow='Precision Crash Repair' siteName='Vantage Autobody' colors={colors} />);

  it('renders the title, eyebrow and site name', () => {
    expect(html).toContain('About us');
    expect(html).toContain('Precision Crash Repair');
    expect(html).toContain('Vantage Autobody');
  });

  it('applies the colours', () => {
    expect(html).toContain('background:#131313');
    expect(html).toContain('color:#ffffff');
    expect(html).toContain('color:#ff3b30');
    expect(html).toContain('background:#ff3b30');
  });

  it('shrinks a long title', () => {
    const long = renderToStaticMarkup(<OgCard title={'x'.repeat(61)} eyebrow='e' siteName='s' colors={colors} />);
    expect(long).toContain('font-size:64px');
    expect(html).toContain('font-size:80px');
  });
});

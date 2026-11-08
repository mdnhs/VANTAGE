// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ButtonRevealLayer } from './button-reveal-layer';

const Button = () => (
  <a href='https://wa.me/353000000' data-reveal-button>
    <span data-reveal-band data-testid='band' />
    <span data-reveal-rise>Get free quote online</span>
  </a>
);

const mount = () => {
  render(
    <>
      <ButtonRevealLayer />
      <Button />
    </>,
  );
  return { link: screen.getByRole('link', { name: 'Get free quote online' }), band: screen.getByTestId('band') };
};

const preferReducedMotion = () =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ButtonRevealLayer', () => {
  it('sends the colour pass across a button when the mouse arrives', () => {
    const { link, band } = mount();

    fireEvent.pointerOver(link, { pointerType: 'mouse' });

    expect(band.style.opacity).toBe('1');
  });

  it('works on buttons that appear after the page has loaded', () => {
    const Later = () => {
      const [shown, setShown] = useState(false);
      return shown ? <Button /> : <button onClick={() => setShown(true)}>Show</button>;
    };
    render(
      <>
        <ButtonRevealLayer />
        <Later />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    fireEvent.pointerOver(screen.getByRole('link'), { pointerType: 'mouse' });

    expect(screen.getByTestId('band').style.opacity).toBe('1');
  });

  it('gives keyboard users the same reveal on focus', () => {
    const { link, band } = mount();

    fireEvent.focusIn(link);

    expect(band.style.opacity).toBe('1');
  });

  it('does not replay when moving between parts of the same button', () => {
    const { link, band } = mount();
    const inner = link.querySelector('[data-reveal-rise]')!;

    fireEvent.pointerOver(inner, { pointerType: 'mouse', relatedTarget: link });

    expect(band.style.opacity).toBe('');
  });

  it('does not replay on the focus a mouse click causes', () => {
    const { link, band } = mount();

    fireEvent.pointerDown(link, { pointerType: 'mouse' });
    fireEvent.focusIn(link);

    expect(band.style.opacity).toBe('');
  });

  it('leaves a tap alone, because a tap is about to act', () => {
    const { link, band } = mount();

    fireEvent.pointerOver(link, { pointerType: 'touch' });

    expect(band.style.opacity).toBe('');
  });

  it('does nothing for people who prefer reduced motion', () => {
    preferReducedMotion();
    const { link, band } = mount();

    fireEvent.pointerOver(link, { pointerType: 'mouse' });

    expect(band.style.opacity).toBe('');
  });
});

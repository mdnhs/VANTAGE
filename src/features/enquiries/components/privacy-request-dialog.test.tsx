// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('../services/api', () => ({
  downloadPrivacyData: vi.fn(),
  erasePrivacyData: vi.fn(),
}));

import { PrivacyRequestDialog } from './privacy-request-dialog';

afterEach(cleanup);

const open = (canErase: boolean) => render(<PrivacyRequestDialog open onClose={() => {}} canErase={canErase} />);

describe('PrivacyRequestDialog', () => {
  it('keeps Erase disabled until the email is retyped', () => {
    open(true);
    const erase = screen.getByRole('button', { name: 'Erase data' }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'a@example.com' } });
    expect(erase.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Retype the email/), { target: { value: 'b@example.com' } });
    expect(erase.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Retype the email/), { target: { value: 'A@example.com' } });
    expect(erase.disabled).toBe(false);
  });

  it('offers no erase without delete rights', () => {
    open(false);
    expect(screen.queryByRole('button', { name: 'Erase data' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download data' })).toBeTruthy();
  });
});

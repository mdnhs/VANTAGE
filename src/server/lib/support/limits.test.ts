import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBudget, createNoReplyTimers } from './limits';

beforeEach(() => void vi.useFakeTimers());
afterEach(() => void vi.useRealTimers());

describe('budget', () => {
  it('allows up to the limit and refuses the next', () => {
    const budget = createBudget(2, 1000);
    expect([budget.take(), budget.take(), budget.take()]).toEqual([true, true, false]);
  });

  it('refills when the window has passed', () => {
    const budget = createBudget(1, 1000);
    budget.take();
    vi.advanceTimersByTime(1000);
    expect(budget.take()).toBe(true);
  });
});

describe('no-reply timers', () => {
  const DELAY = 5000;

  it('fires once the delay has passed', () => {
    const due = vi.fn();
    createNoReplyTimers(DELAY, due).schedule('a');
    vi.advanceTimersByTime(DELAY - 1);
    expect(due).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(due).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('counts from the first unanswered message, not the latest', () => {
    const due = vi.fn();
    const timers = createNoReplyTimers(DELAY, due);
    timers.schedule('a');
    vi.advanceTimersByTime(DELAY - 1);
    timers.schedule('a');
    vi.advanceTimersByTime(1);
    expect(due).toHaveBeenCalledOnce();
  });

  it('does not fire after a reply cancels it', () => {
    const due = vi.fn();
    const timers = createNoReplyTimers(DELAY, due);
    timers.schedule('a');
    timers.cancel('a');
    vi.advanceTimersByTime(DELAY);
    expect(due).not.toHaveBeenCalled();
  });

  it('can wait again for a message sent after the reply', () => {
    const due = vi.fn();
    const timers = createNoReplyTimers(DELAY, due);
    timers.schedule('a');
    timers.cancel('a');
    timers.schedule('a');
    vi.advanceTimersByTime(DELAY);
    expect(due).toHaveBeenCalledOnce();
  });
});

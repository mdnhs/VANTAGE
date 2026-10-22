import 'server-only';

import dns from 'node:dns';
import net from 'node:net';

import { Agent, fetch as undiciFetch } from 'undici';

export class PrivateAddressError extends Error {
  constructor() {
    super('That address points to a private network');
    this.name = 'PrivateAddressError';
  }
}

// [first address, prefix length] of every IPv4 range a provider host may not be in.
const V4_PRIVATE: readonly (readonly [string, number])[] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const v4ToInt = (address: string): number | null => {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    n = n * 256 + Number(part);
  }
  return n;
};

const inRange = (n: number, [base, bits]: readonly [string, number]) => {
  const size = 2 ** (32 - bits);
  const start = v4ToInt(base)!;
  return n >= start && n < start + size;
};

// Eight 16-bit groups, or null when the text is not an IPv6 address.
function v6Groups(address: string): number[] | null {
  let text = address;
  const dotted = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (dotted) {
    const v4 = v4ToInt(dotted[2]!);
    if (v4 === null) return null;
    text = `${dotted[1]}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  const all = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  const groups = all.map((g) => (/^[0-9a-f]{1,4}$/i.test(g) ? parseInt(g, 16) : NaN));
  return groups.some(Number.isNaN) ? null : groups;
}

// Anything that is not a plain IP address counts as private: fail closed.
export function isPrivateAddress(address: string): boolean {
  const bare = address.replace(/^\[|\]$/g, '').split('%')[0]!;
  if (net.isIPv4(bare)) {
    const n = v4ToInt(bare);
    return n === null || V4_PRIVATE.some((range) => inRange(n, range));
  }
  if (!net.isIPv6(bare)) return true;
  const g = v6Groups(bare);
  if (!g) return true;
  const embedded = (hi: number, lo: number) => isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  const zeros = (from: number, to: number) => g.slice(from, to).every((x) => x === 0);
  if (zeros(0, 5) && g[5] === 0xffff) return embedded(g[6]!, g[7]!); // ::ffff:a.b.c.d
  if (zeros(0, 8)) return true; // ::
  if (zeros(0, 7) && g[7] === 1) return true; // ::1
  if (zeros(0, 6)) return embedded(g[6]!, g[7]!); // ::a.b.c.d (IPv4-compatible)
  if (g[0] === 0x64 && g[1] === 0xff9b && zeros(2, 6)) return embedded(g[6]!, g[7]!); // NAT64
  if (g[0] === 0x2002) return embedded(g[1]!, g[2]!); // 6to4
  const first = g[0]!;
  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00;
}

type LookupCallback = (error: Error | null, address?: string | dns.LookupAddress[], family?: number) => void;

// Checks every address the name resolves to, so a name with one public and one
// private answer cannot slip a private one through at connect time.
function guardedLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback) {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
      return callback(new PrivateAddressError());
    }
    if (options.all) return callback(null, addresses);
    return callback(null, addresses[0]!.address, addresses[0]!.family);
  });
}

let agent: Agent | undefined;
const guardedAgent = () => (agent ??= new Agent({ connect: { lookup: guardedLookup as never } }));

// An IP-literal host skips DNS, so the lookup never sees it.
function assertPublicLiteral(input: Parameters<typeof fetch>[0]) {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const host = new URL(raw).hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && isPrivateAddress(host)) throw new PrivateAddressError();
}

const guardedFetch: typeof fetch = async (input, init) => {
  assertPublicLiteral(input);
  try {
    return (await undiciFetch(input as never, {
      ...(init as object),
      redirect: 'error',
      dispatcher: guardedAgent(),
    })) as unknown as Response;
  } catch (error) {
    const cause = (error as { cause?: unknown } | null)?.cause;
    throw cause instanceof PrivateAddressError ? cause : error;
  }
};

const noRedirectGlobalFetch: typeof fetch = (url, init) => globalThis.fetch(url, { ...init, redirect: 'error' });

// MK R6 (DNS rebinding): with `allowPrivate` false, the connection itself is
// checked against the resolved addresses, not just the URL text.
export function fetchFor(allowPrivate: boolean): typeof fetch {
  return allowPrivate ? noRedirectGlobalFetch : guardedFetch;
}

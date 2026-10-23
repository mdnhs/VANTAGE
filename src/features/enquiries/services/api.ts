import { API_ROUTES } from '@/lib/routes/api-routes';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

export type ErasureResult = {
  deleted: { quotes: number; contacts: number; aiMessages: number };
  kept: { id: string; reason: 'billing' }[];
};

async function failure(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  return new Error(body?.error?.message ?? 'Request failed');
}

// Fetches a file and hands it to the browser as a download. Errors surface as a message, not a saved file.
// Returns the response headers (the CSV export reports a capped file there).
export async function downloadFile(
  path: string,
  fallbackName: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Headers> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method ?? 'GET',
    credentials: 'include',
    ...(init.body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(init.body) }),
  });
  if (!res.ok) throw await failure(res);
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return res.headers;
}

// The row limit when the file was cut short, else null.
export async function downloadEnquiryCsv(type: 'quotes' | 'contacts', status?: string): Promise<number | null> {
  const headers = await downloadFile(API_ROUTES.enquiries.exportCsv(type, status), `${type}.csv`);
  const capped = Number(headers.get('x-export-capped'));
  return capped > 0 ? capped : null;
}

export const downloadPrivacyData = (email: string) =>
  downloadFile(API_ROUTES.enquiries.privacyExport, 'privacy.json', { method: 'POST', body: { email } });

export async function erasePrivacyData(email: string): Promise<ErasureResult> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.enquiries.privacyErase}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await failure(res);
  return (await res.json()).data as ErasureResult;
}

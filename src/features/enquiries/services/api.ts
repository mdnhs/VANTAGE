import { API_ROUTES } from '@/lib/routes/api-routes';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

export type ErasureResult = {
  deleted: { quotes: number; contacts: number };
  kept: { id: string; reason: 'billing' }[];
};

async function failure(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  return new Error(body?.error?.message ?? 'Request failed');
}

// Fetches a file and hands it to the browser as a download. Errors surface as a message, not a saved file.
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });
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
}

export const downloadEnquiryCsv = (type: 'quotes' | 'contacts', status?: string) =>
  downloadFile(API_ROUTES.enquiries.exportCsv(type, status), `${type}.csv`);

export const downloadPrivacyData = (email: string) => downloadFile(API_ROUTES.enquiries.privacy(email), 'privacy.json');

export async function erasePrivacyData(email: string): Promise<ErasureResult> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.enquiries.privacy(email)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw await failure(res);
  return (await res.json()).data as ErasureResult;
}

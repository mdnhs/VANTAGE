import type { EditableGlobalKey } from '@/lib/content/global-access';

export type GlobalDoc = {
  key: EditableGlobalKey;
  value: unknown;
  version: number;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SavedGlobal = { key: EditableGlobalKey; value: unknown; version: number; updatedAt: string | null };

export type GlobalRevision = {
  id: string;
  version: number;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
  createdByName: string | null;
};

export type GlobalRevisions = { items: GlobalRevision[] };

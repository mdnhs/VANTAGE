// Plain types only (erased at build time): the server module is never bundled into the client.
export type { AiAdmin, AiStatus, ListModelsResult } from '@/server/services/ai/service';
export type { AiSettingsUpdate, ListModelsInput } from '@/lib/ai/schema';

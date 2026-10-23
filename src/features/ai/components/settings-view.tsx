'use client';

import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { FORM_ACTION, PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useActor, useCan } from '@/contexts/actor-provider';
import {
  AI_PROVIDERS,
  baseUrlProblem,
  DEFAULT_MODEL,
  GATED_ROLES,
  GEMINI_FREE_TIER_WARNING,
  ModelId,
  normaliseBaseUrl,
  OUTPUT_TOKENS,
  PROVIDER_LABELS,
  type AiProvider,
} from '@/lib/ai/schema';
import type { RoleName } from '@/lib/auth/permissions';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

import { useAiSettings, useListModels, useSaveAiSettings, useTestConnection } from '../hooks/use-ai-settings';
import { AiApiError } from '../services/api';
import type { AiAdmin } from '../types';

type KeyMode = 'keep' | 'replace' | 'remove';
type Values = {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  allowedRoles: RoleName[];
  share: boolean;
  acknowledge: boolean;
  systemPrompt: string;
  maxOutputTokens: number;
};

// MK R15: the acknowledgement names the retention consequence too.
const SHARE_ACK =
  "I confirm the business's data-protection contact approved sending customers' first names, vehicle details and enquiry messages to the AI provider. I understand conversations may then contain enquiry details and are kept for up to 90 days.";
export const CONFLICT_NOTICE = 'Someone else saved these settings. Reload to see their changes.';

const errorText = (error: unknown) => {
  if (error instanceof AiApiError) return Object.values(error.causes ?? {})[0]?.[0] ?? error.message;
  return error instanceof Error ? error.message : "Couldn't complete that";
};

export function SettingsView() {
  const doc = useAiSettings();
  // Lives here, not in the form: a conflict refetches and re-keys the form.
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='AI assistant'
        description='Choose the provider and model, add your own API key, and decide who can use it. The assistant can read the site but never changes it.'
      />
      {doc.isError ? (
        <div role='alert' className='flex flex-col items-start gap-3'>
          <p>{errorText(doc.error)}</p>
          <Button variant='outline' onClick={() => void doc.refetch()}>
            Try again
          </Button>
        </div>
      ) : !doc.data ? (
        <CardSkeleton />
      ) : (
        <SettingsForm key={doc.data.version} doc={doc.data} notice={notice} setNotice={setNotice} />
      )}
    </div>
  );
}

function SettingsForm({
  doc,
  notice,
  setNotice,
}: {
  doc: AiAdmin;
  notice: string | null;
  setNotice: (message: string | null) => void;
}) {
  const ids = useId();
  const actor = useActor();
  const canManage = useCan({ ai: ['manage'] });
  const viewingAs = Boolean(actor.impersonatedBy);
  const readOnly = !canManage || viewingAs;
  const isOwner = actor.roles.includes('owner') && !viewingAs;
  const save = useSaveAiSettings();
  const listModels = useListModels();
  const test = useTestConnection();
  const [keyMode, setKeyMode] = useState<KeyMode>(doc.apiKey.hasKey ? 'keep' : 'replace');
  const [models, setModels] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const saved = doc.value;
  const form = useForm<Values>({
    mode: 'onTouched',
    defaultValues: {
      enabled: saved.enabled,
      provider: saved.provider,
      model: saved.model,
      baseUrl: saved.baseUrl,
      apiKey: '',
      allowedRoles: saved.allowedRoles,
      share: saved.shareEnquiryDetails.enabled,
      acknowledge: false,
      systemPrompt: saved.systemPrompt,
      maxOutputTokens: saved.maxOutputTokens,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const provider = useWatch({ control, name: 'provider' });
  const share = useWatch({ control, name: 'share' });
  const baseUrl = useWatch({ control, name: 'baseUrl' });
  const newKey = useWatch({ control, name: 'apiKey' });
  const oac = provider === 'openai-compatible';
  // MK R3: a different provider or host never inherits the saved key.
  const keyFollows = provider === saved.provider && (!oac || normaliseBaseUrl(baseUrl) === saved.baseUrl);
  const showKeyInput = !doc.apiKey.hasKey || !keyFollows || keyMode === 'replace';
  // "Remove key" is component state, not form state, so it counts here: Test
  // uses the saved settings, which still hold the key until Save.
  const unsaved = isDirty || keyMode === 'remove';
  const losesKey = doc.apiKey.hasKey && !keyFollows && keyMode !== 'remove' && !newKey.trim();

  const aria = (name: keyof Values) =>
    errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${ids}-${name}-e` } : {};
  // Fields that have a message slot on screen; any other server cause goes in the alert.
  const showsError = (name: keyof Values) =>
    name === 'enabled' ||
    name === 'apiKey' ||
    name === 'model' ||
    name === 'maxOutputTokens' ||
    (name === 'baseUrl' && oac) ||
    (name === 'acknowledge' && isOwner && share && !saved.shareEnquiryDetails.enabled);

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    setNotice(null);
    const key = v.apiKey.trim();
    try {
      await save.mutateAsync({
        version: doc.version,
        enabled: v.enabled,
        provider: v.provider,
        model: v.model.trim(),
        baseUrl: oac ? v.baseUrl.trim() : '',
        // Write-only: blank leaves the stored key alone (the server rejects ''); null removes it.
        ...(showKeyInput && key ? { apiKey: key } : keyMode === 'remove' ? { apiKey: null } : {}),
        allowedRoles: v.allowedRoles,
        ...(v.share !== saved.shareEnquiryDetails.enabled
          ? { shareEnquiryDetails: { enabled: v.share, acknowledge: v.acknowledge } }
          : {}),
        systemPrompt: v.systemPrompt,
        maxOutputTokens: Number(v.maxOutputTokens),
      });
      toast.success('Saved');
      // The variables held the typed key: drop the finished mutation from memory.
      save.reset();
    } catch (error) {
      save.reset();
      if (error instanceof AiApiError && error.status === 409) {
        // The refetch re-keys the form with the other person's version.
        setNotice(CONFLICT_NOTICE);
        return;
      }
      let rendered = false;
      if (error instanceof AiApiError && error.causes) {
        for (const [field, messages] of Object.entries(error.causes)) {
          const name = (field === 'shareEnquiryDetails.acknowledge' ? 'acknowledge' : field) as keyof Values;
          if (!showsError(name)) continue;
          setError(name, { message: messages[0] });
          rendered = true;
        }
      }
      if (rendered) return;
      setFormError(
        error instanceof AiApiError && error.status === 403 && viewingAs
          ? 'View-as is read-only: settings cannot be changed'
          : error instanceof AiApiError
            ? errorText(error)
            : error instanceof Error
              ? error.message
              : "Couldn't save",
      );
    }
  });

  const onListModels = () => {
    const v = form.getValues();
    listModels.mutate(
      { provider: v.provider, baseUrl: v.baseUrl, ...(v.apiKey.trim() ? { apiKey: v.apiKey.trim() } : {}) },
      {
        onSettled: () => listModels.reset(),
        onSuccess: (r) => {
          if (r.ok) {
            setModels(r.models);
            toast.success(`${r.models.length} models found`);
          } else toast.error(r.message);
        },
        onError: (error) => toast.error(errorText(error)),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className='flex max-w-2xl flex-col gap-8' noValidate>
      {readOnly ? (
        <p role='note' className='text-sm text-muted-foreground'>
          {viewingAs
            ? 'View-as is read-only: settings cannot be changed.'
            : 'You can see these settings but only an owner or admin can change them.'}
        </p>
      ) : null}
      {doc.mock ? (
        <p role='note' className='text-sm text-muted-foreground'>
          Mock provider is on. Answers are scripted and no key is used.
        </p>
      ) : null}
      <FieldSet disabled={readOnly} className='contents'>
        <FieldGroup>
          <Controller
            control={control}
            name='enabled'
            render={({ field }) => (
              <Field orientation='horizontal'>
                <Switch
                  id={`${ids}-enabled`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                  {...aria('enabled')}
                />
                <FieldLabel htmlFor={`${ids}-enabled`}>Turn on the AI assistant</FieldLabel>
                <FieldError id={`${ids}-enabled-e`}>{errors.enabled?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name='provider'
            render={({ field }) => (
              <Field>
                <FieldLabel id={`${ids}-provider`}>Provider</FieldLabel>
                <RadioGroup
                  aria-labelledby={`${ids}-provider`}
                  value={field.value}
                  disabled={readOnly}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('model', DEFAULT_MODEL[value as AiProvider], { shouldDirty: true });
                    setModels([]);
                  }}
                >
                  {AI_PROVIDERS.map((p) => (
                    <label key={p} className='flex items-center gap-2'>
                      <RadioGroupItem value={p} />
                      {PROVIDER_LABELS[p]}
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />
          {provider === 'google' ? (
            <p role='note' className='text-sm text-muted-foreground'>
              {GEMINI_FREE_TIER_WARNING}
            </p>
          ) : null}

          {oac ? (
            <Field>
              <FieldLabel htmlFor={`${ids}-base`}>Base URL</FieldLabel>
              <Input
                id={`${ids}-base`}
                placeholder='https://api.groq.com/openai/v1'
                {...aria('baseUrl')}
                {...register('baseUrl', { validate: (v) => baseUrlProblem(v, doc.localHttpAllowed) ?? true })}
              />
              <FieldDescription>
                OpenAI, Groq, OpenRouter, DeepSeek, Mistral, Together, Ollama or LM Studio. Use the address that ends
                before /chat/completions.
              </FieldDescription>
              <FieldError id={`${ids}-baseUrl-e`}>{errors.baseUrl?.message}</FieldError>
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor={`${ids}-key`}>API key</FieldLabel>
            {doc.apiKey.hasKey && keyFollows ? (
              <FieldDescription>
                Saved key ending ••••{doc.apiKey.last4}.
                {doc.apiKey.readable === false
                  ? " It can't be read with the server's current encryption key; replace it."
                  : ''}
              </FieldDescription>
            ) : null}
            {doc.apiKey.hasKey && keyFollows ? (
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant={keyMode === 'replace' ? 'default' : 'outline'}
                  onClick={() => setKeyMode(keyMode === 'replace' ? 'keep' : 'replace')}
                >
                  Replace key
                </Button>
                <Button
                  type='button'
                  variant={keyMode === 'remove' ? 'default' : 'outline'}
                  onClick={() => setKeyMode(keyMode === 'remove' ? 'keep' : 'remove')}
                >
                  Remove key
                </Button>
              </div>
            ) : null}
            {showKeyInput ? (
              <Input
                id={`${ids}-key`}
                type='password'
                autoComplete='off'
                spellCheck={false}
                {...aria('apiKey')}
                {...register('apiKey')}
              />
            ) : null}
            {keyMode === 'remove' && doc.apiKey.hasKey && keyFollows ? (
              <p role='note' className='text-sm text-destructive'>
                The saved key is removed when you save.
              </p>
            ) : null}
            {losesKey ? (
              <p role='note' className='text-sm text-destructive'>
                Changing the provider or address removes the saved key. Enter a new key for this provider or the
                assistant won&apos;t work.
              </p>
            ) : null}
            {!doc.keyAvailable ? (
              <FieldDescription>
                The server has no APP_ENCRYPTION_KEY, so a key can&apos;t be saved yet.
              </FieldDescription>
            ) : null}
            <FieldError id={`${ids}-apiKey-e`}>{errors.apiKey?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${ids}-model`}>Model</FieldLabel>
            <div className='flex gap-2'>
              <Input
                id={`${ids}-model`}
                list={`${ids}-models`}
                {...aria('model')}
                {...register('model', {
                  validate: (v) => ModelId.safeParse(v).success || "Use the model's ID, like gemini-flash-lite-latest",
                })}
              />
              <Button type='button' variant='outline' onClick={onListModels} disabled={listModels.isPending}>
                {listModels.isPending ? <Spinner data-icon='inline-start' /> : null}
                List models
              </Button>
            </div>
            <datalist id={`${ids}-models`}>
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <FieldError id={`${ids}-model-e`}>{errors.model?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel id={`${ids}-roles`}>Who can use it</FieldLabel>
            <FieldDescription>Owners and admins can always use it.</FieldDescription>
            <Controller
              control={control}
              name='allowedRoles'
              render={({ field }) => (
                <div role='group' aria-labelledby={`${ids}-roles`} className='flex flex-col gap-2'>
                  {GATED_ROLES.map((role) => (
                    <label key={role} className='flex items-center gap-2'>
                      <Checkbox
                        checked={field.value.includes(role)}
                        disabled={readOnly}
                        onCheckedChange={(on) =>
                          field.onChange(on ? [...field.value, role] : field.value.filter((r) => r !== role))
                        }
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              )}
            />
          </Field>

          <Controller
            control={control}
            name='share'
            render={({ field }) => (
              <Field orientation='horizontal'>
                <Switch
                  id={`${ids}-share`}
                  checked={field.value}
                  disabled={!isOwner || readOnly}
                  onCheckedChange={field.onChange}
                />
                <FieldContent>
                  <FieldLabel htmlFor={`${ids}-share`}>Let the assistant read enquiry details</FieldLabel>
                  <FieldDescription>
                    {isOwner
                      ? 'Off by default. When on, people who can read quotes and contact messages get first names, vehicle details, services and messages (500 characters, newest 20) in answers.'
                      : 'Only an owner can change this.'}
                  </FieldDescription>
                </FieldContent>
              </Field>
            )}
          />
          {isOwner && share && !saved.shareEnquiryDetails.enabled ? (
            <Controller
              control={control}
              name='acknowledge'
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <Checkbox
                    id={`${ids}-ack`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    {...aria('acknowledge')}
                  />
                  <FieldLabel htmlFor={`${ids}-ack`}>{SHARE_ACK}</FieldLabel>
                  <FieldError id={`${ids}-acknowledge-e`}>{errors.acknowledge?.message}</FieldError>
                </Field>
              )}
            />
          ) : null}

          <Field>
            <FieldLabel htmlFor={`${ids}-prompt`}>Extra instructions</FieldLabel>
            <Textarea
              id={`${ids}-prompt`}
              rows={4}
              maxLength={2000}
              placeholder='Tone, the business name, words to avoid…'
              {...register('systemPrompt')}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${ids}-max`}>Longest answer (tokens)</FieldLabel>
            <Input
              id={`${ids}-max`}
              type='number'
              min={OUTPUT_TOKENS.min}
              max={OUTPUT_TOKENS.max}
              {...aria('maxOutputTokens')}
              {...register('maxOutputTokens', {
                valueAsNumber: true,
                min: { value: OUTPUT_TOKENS.min, message: `At least ${OUTPUT_TOKENS.min}` },
                max: { value: OUTPUT_TOKENS.max, message: `At most ${OUTPUT_TOKENS.max}` },
              })}
            />
            <FieldError id={`${ids}-maxOutputTokens-e`}>{errors.maxOutputTokens?.message}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      {notice || formError ? (
        <p role='alert' className='text-destructive'>
          {notice ?? formError}
        </p>
      ) : null}
      {test.data || test.error ? (
        <p role='status' className={test.data?.ok ? 'text-sm' : 'text-sm text-destructive'}>
          {test.data ? test.data.message : errorText(test.error)}
        </p>
      ) : null}
      {readOnly ? null : (
        <div className='flex flex-wrap gap-3'>
          <Button type='submit' className={FORM_ACTION} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon='inline-start' /> : null}Save
          </Button>
          <Button
            type='button'
            variant='outline'
            className={FORM_ACTION}
            disabled={unsaved || test.isPending}
            title={unsaved ? 'Save first' : undefined}
            onClick={() => test.mutate(undefined, { onError: (error) => toast.error(errorText(error)) })}
          >
            {test.isPending ? <Spinner data-icon='inline-start' /> : null}Test connection
          </Button>
        </div>
      )}
    </form>
  );
}

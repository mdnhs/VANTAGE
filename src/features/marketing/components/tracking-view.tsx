'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { FORM_ACTION, PageHeader } from '@/components/admin/dashboard/page-header';
import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useActor, useCan } from '@/contexts/actor-provider';
import { CONFLICT_MESSAGE, isConflict } from '@/features/globals/lib/submit-result';
import { GlobalApiError } from '@/features/globals/services/api';
import { GA4_ID, GTM_ID, PIXEL_ID } from '@/lib/tracking/ids';

import { useSaveTracking } from '../hooks/api/mutation/use-save-tracking';
import { useTestCapi } from '../hooks/api/mutation/use-test-capi';
import { useTracking } from '../hooks/api/query/use-tracking';
import type { TrackingAdmin } from '../types';
import { trackingKeys } from '../utils/query-keys';
import { TrackingStatus } from './tracking-status';

const idField = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === '' || pattern.test(v), message);

// A client copy of the server's TrackingUpdate["value"] (same ID patterns).
const FormSchema = z.object({
  gtmId: idField(GTM_ID, 'Use the GTM-XXXXXXX format'),
  ga4Id: idField(GA4_ID, 'Use the G-XXXXXXXXXX format'),
  metaPixelId: idField(PIXEL_ID, 'Use the 10-20 digit Pixel ID'),
  testEventCode: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Z0-9]*$/, 'Use the code from Events Manager (letters and digits)'),
  enabled: z.object({ gtm: z.boolean(), ga4: z.boolean(), meta: z.boolean(), capi: z.boolean() }),
  // Write-only: never prefilled.
  capiToken: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || v.length >= 20, 'Access tokens are longer than this'),
  matching: z.boolean(),
  acknowledge: z.boolean(),
});
type FormValues = z.infer<typeof FormSchema>;

export const ACK_TEXT =
  "I confirm the business's DPO or legal adviser approved sending hashed email and phone numbers to Meta";
export const TOKEN_PLACEHOLDER = 'Stored. Enter a new token to replace it.';
export const NO_KEY_NOTICE =
  "The server has no APP_ENCRYPTION_KEY, so a token can't be stored safely. Ask your developer to set it.";

export function TrackingView() {
  const doc = useTracking();
  const [conflict, setConflict] = useState(false);
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Tracking'
        description='IDs and switches go live as soon as you save. Nothing loads until a visitor consents.'
      />
      {doc.isError ? (
        <div role='alert' className='flex flex-col items-start gap-3'>
          <p>{doc.error.message}</p>
          <Button variant='outline' onClick={() => void doc.refetch()}>
            Try again
          </Button>
        </div>
      ) : !doc.data ? (
        <CardSkeleton />
      ) : (
        <div className='grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]'>
          <div className='flex flex-col gap-4'>
            {/* Held here: the conflict reload remounts the version-keyed form. */}
            {conflict ? (
              <p role='alert' className='rounded-xl border border-destructive/40 p-3 text-sm text-destructive'>
                {CONFLICT_MESSAGE}
              </p>
            ) : null}
            <TrackingForm
              key={doc.data.version}
              doc={doc.data}
              onConflict={() => setConflict(true)}
              onSaved={() => setConflict(false)}
            />
          </div>
          <div className='flex flex-col gap-6'>
            <TrackingStatus doc={doc.data} />
            <TestEvent />
          </div>
        </div>
      )}
    </div>
  );
}

function useCanEdit() {
  const actor = useActor();
  return useCan({ tracking: ['update'] }) && !actor.impersonatedBy;
}

function TestEvent() {
  const canUpdate = useCanEdit();
  const test = useTestCapi();
  const saving = useIsMutating({ mutationKey: trackingKeys.save() }) > 0;
  return (
    <DashboardCard title='Test the Conversions API'>
      <p className='text-sm text-muted-foreground'>
        Sends one test event with your test event code. Check it in Meta Events Manager under Test events.
      </p>
      <Button
        type='button'
        variant='outline'
        className={`${FORM_ACTION} self-start`}
        disabled={!canUpdate || test.isPending || saving}
        onClick={() => test.mutate()}
      >
        {test.isPending ? <Spinner data-icon='inline-start' /> : null}
        Send test event
      </Button>
    </DashboardCard>
  );
}

function TrackingForm({
  doc,
  onConflict,
  onSaved,
}: {
  doc: TrackingAdmin;
  onConflict: () => void;
  onSaved: () => void;
}) {
  const ids = useId();
  const actor = useActor();
  const canUpdate = useCanEdit();
  const isOwner = actor.roles.includes('owner');
  const queryClient = useQueryClient();
  const save = useSaveTracking();
  const [removeToken, setRemoveToken] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const saved = doc.value;
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onTouched',
    defaultValues: {
      gtmId: saved.gtmId,
      ga4Id: saved.ga4Id,
      metaPixelId: saved.metaPixelId,
      testEventCode: saved.testEventCode,
      enabled: saved.enabled,
      capiToken: '',
      matching: saved.enhancedMatching.enabled,
      acknowledge: false,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const matching = useWatch({ control, name: 'matching' });
  const acknowledged = useWatch({ control, name: 'acknowledge' });
  const configured = doc.capiToken.configured;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const matchingChanged = isOwner && values.matching !== saved.enhancedMatching.enabled;
    if (matchingChanged && values.matching && !values.acknowledge) {
      setError('acknowledge', { message: 'Confirm the legal acknowledgement first' });
      return;
    }
    const capiToken = removeToken ? null : values.capiToken ? values.capiToken : undefined;
    try {
      await save.mutateAsync({
        version: doc.version,
        value: {
          gtmId: values.gtmId,
          ga4Id: values.ga4Id,
          metaPixelId: values.metaPixelId,
          testEventCode: values.testEventCode,
          enabled: values.enabled,
        },
        ...(capiToken !== undefined ? { capiToken } : {}),
        ...(matchingChanged ? { enhancedMatching: { enabled: values.matching, acknowledge: values.acknowledge } } : {}),
      });
      onSaved();
      toast.success('Tracking saved');
    } catch (error) {
      if (isConflict(error)) {
        onConflict();
        await queryClient.invalidateQueries({ queryKey: trackingKeys.detail() });
        return;
      }
      if (!(error instanceof GlobalApiError)) {
        setFormError('Something went wrong. Try again.');
        return;
      }
      setFormError(error.message);
      for (const [path, messages] of Object.entries(error.causes ?? {})) {
        const key = path.replace(/^value\./, '');
        const field = key === 'enhancedMatching.acknowledge' ? 'acknowledge' : key;
        if (messages[0] && field in values) setError(field as keyof FormValues, { message: messages[0] });
      }
    }
  });

  const text = (
    name: 'gtmId' | 'ga4Id' | 'metaPixelId' | 'testEventCode',
    label: string,
    placeholder: string,
    description?: string,
  ) => (
    <Field data-invalid={Boolean(errors[name]) || undefined}>
      <FieldLabel htmlFor={`${ids}-${name}`}>{label}</FieldLabel>
      <Input
        id={`${ids}-${name}`}
        placeholder={placeholder}
        autoComplete='off'
        aria-invalid={Boolean(errors[name]) || undefined}
        {...register(name)}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {errors[name]?.message ? <FieldError>{errors[name].message}</FieldError> : null}
    </Field>
  );
  const toggle = (name: keyof FormValues['enabled'], label: string) => (
    <Controller
      control={control}
      name={`enabled.${name}`}
      render={({ field }) => (
        <Field orientation='horizontal'>
          <Switch id={`${ids}-${name}`} checked={field.value} onCheckedChange={field.onChange} />
          <FieldLabel htmlFor={`${ids}-${name}`}>{label}</FieldLabel>
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
      <fieldset disabled={!canUpdate} className='min-w-0'>
        <FieldGroup>
          {text('gtmId', 'GTM container ID', 'GTM-XXXXXXX')}
          {toggle('gtm', 'Load Google Tag Manager')}
          {text('ga4Id', 'GA4 measurement ID', 'G-XXXXXXXXXX')}
          {toggle('ga4', 'Send GA4 through GTM')}
          {text('metaPixelId', 'Meta Pixel ID', '1234567890')}
          {toggle('meta', 'Load the Meta Pixel')}
          {toggle('capi', 'Send leads with the Conversions API')}
          {text(
            'testEventCode',
            'Test event code',
            'TEST12345',
            'From Events Manager, Test events. Only used by the test button.',
          )}

          <Field data-invalid={Boolean(errors.capiToken) || undefined}>
            <FieldLabel htmlFor={`${ids}-capiToken`}>Conversions API access token</FieldLabel>
            {!doc.keyAvailable ? <FieldDescription role='note'>{NO_KEY_NOTICE}</FieldDescription> : null}
            {configured ? (
              <div className='flex flex-wrap items-center gap-3'>
                <span className='text-sm font-medium'>
                  {removeToken
                    ? 'Will be removed when you save'
                    : doc.capiToken.readable === false
                      ? "Configured, but can't be read"
                      : 'Configured'}
                </span>
                <Button type='button' variant='outline' onClick={() => setRemoveToken((v) => !v)}>
                  {removeToken ? 'Keep token' : 'Remove token'}
                </Button>
              </div>
            ) : null}
            <Input
              id={`${ids}-capiToken`}
              type='password'
              autoComplete='off'
              spellCheck={false}
              disabled={!doc.keyAvailable || removeToken}
              placeholder={configured ? TOKEN_PLACEHOLDER : ''}
              className='max-w-md'
              aria-invalid={Boolean(errors.capiToken) || undefined}
              {...register('capiToken')}
            />
            <FieldDescription>Write-only: it is encrypted when saved and never shown again.</FieldDescription>
            {errors.capiToken?.message ? <FieldError>{errors.capiToken.message}</FieldError> : null}
          </Field>

          <section aria-label='Enhanced matching' className='flex flex-col gap-3 rounded-xl border p-4'>
            <h2 className='text-card-title'>Enhanced matching</h2>
            <p className='text-sm text-muted-foreground'>
              Sends a hashed email and phone number with the lead to Meta. Only an owner can change this, and the choice
              is recorded.
            </p>
            {saved.enhancedMatching.enabled ? (
              <p className='text-sm'>Approved by {saved.enhancedMatching.acknowledgedBy}</p>
            ) : null}
            <Controller
              control={control}
              name='acknowledge'
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <Checkbox
                    id={`${ids}-ack`}
                    checked={field.value}
                    disabled={!isOwner}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor={`${ids}-ack`}>{ACK_TEXT}</FieldLabel>
                </Field>
              )}
            />
            {errors.acknowledge?.message ? <FieldError>{errors.acknowledge.message}</FieldError> : null}
            <Controller
              control={control}
              name='matching'
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <Switch
                    id={`${ids}-matching`}
                    checked={field.value}
                    disabled={!isOwner || (!matching && !acknowledged)}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor={`${ids}-matching`}>Send hashed email and phone numbers with leads</FieldLabel>
                </Field>
              )}
            />
          </section>
        </FieldGroup>
      </fieldset>
      {formError ? (
        <p role='alert' className='text-sm text-destructive'>
          {formError}
        </p>
      ) : null}
      {canUpdate ? (
        <Button type='submit' className={`${FORM_ACTION} self-start`} disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon='inline-start' /> : null}
          Save tracking
        </Button>
      ) : null}
    </form>
  );
}

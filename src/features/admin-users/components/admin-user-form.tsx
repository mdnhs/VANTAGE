'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';
import type { AdminUserWithPermissions } from '../types';

// Human-readable labels for the permission checklist — keep in sync with PERMISSIONS.
const PERMISSION_LABELS: Record<PermissionValue, string> = {
  [PERMISSIONS.SERVICES_MANAGE]: 'Manage Services',
  [PERMISSIONS.PROJECTS_MANAGE]: 'Manage Projects',
  [PERMISSIONS.TESTIMONIALS_MANAGE]: 'Manage Testimonials',
  [PERMISSIONS.LOGOS_MANAGE]: 'Manage Partner Logos',
  [PERMISSIONS.PILLARS_MANAGE]: 'Manage Homepage Pillars',
  [PERMISSIONS.CATALOG_MANAGE]: 'Manage Homepage Catalog',
  [PERMISSIONS.PROCESS_MANAGE]: 'Manage Homepage Process',
  [PERMISSIONS.SETTINGS_MANAGE]: 'Manage Settings',
  [PERMISSIONS.QUOTES_MANAGE]: 'Manage Quote Requests',
  [PERMISSIONS.CONTACTS_MANAGE]: 'Manage Contact Inquiries',
  [PERMISSIONS.ADMINS_MANAGE]: 'Manage Admins',
  [PERMISSIONS.USERS_MANAGE]: 'Manage Users',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

interface FormState {
  email: string;
  password: string;
  name: string;
  permissions: PermissionValue[];
  isActive: boolean;
}

function toFormState(data: AdminUserWithPermissions | null): FormState {
  return {
    email: data?.email ?? '',
    password: '',
    name: data?.name ?? '',
    permissions: data?.permissions ?? [],
    isActive: data?.isActive ?? true,
  };
}

export interface AdminUserFormSubmitValues {
  email: string;
  password: string;
  name: string;
  permissions: PermissionValue[];
  isActive: boolean;
}

interface AdminUserFormProps {
  mode: 'create' | 'edit';
  initialData?: AdminUserWithPermissions | null;
  onSubmit: (input: AdminUserFormSubmitValues) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by the create and edit screens. On edit, email and password are not editable here
// (see admin-user-schema.ts) — the password field only renders in create mode.
export function AdminUserForm({
  mode,
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: AdminUserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePermission = (permission: PermissionValue, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permission] : prev.permissions.filter((p) => p !== permission),
    }));
  };

  const allSelected = ALL_PERMISSIONS.length > 0 && ALL_PERMISSIONS.every((p) => form.permissions.includes(p));

  const toggleAllPermissions = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked ? [...ALL_PERMISSIONS] : [],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      email: form.email,
      password: form.password,
      name: form.name,
      permissions: form.permissions,
      isActive: form.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Admin details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={mode === 'edit'}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='name'>Name</Label>
            <Input id='name' value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          {mode === 'create' && (
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                minLength={8}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                required
              />
            </div>
          )}
          {mode === 'edit' && (
            <div className='flex items-center gap-3 pt-6'>
              <Switch
                id='isActive'
                checked={form.isActive}
                onCheckedChange={(checked) => setField('isActive', checked)}
              />
              <Label htmlFor='isActive'>Active</Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle>Permissions</CardTitle>
          <span className='text-xs font-medium text-muted-foreground'>
            {form.permissions.length} of {ALL_PERMISSIONS.length} selected
          </span>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {/* All permissions master toggle */}
          <div className='flex items-center justify-between rounded-lg border border-border/80 bg-muted/40 p-3'>
            <div className='flex flex-col gap-0.5'>
              <Label htmlFor='toggle-all-permissions' className='cursor-pointer text-sm font-semibold'>
                All permissions
              </Label>
              <span className='text-xs text-muted-foreground'>
                Grant full administrative privileges across all website modules and settings.
              </span>
            </div>
            <Switch id='toggle-all-permissions' checked={allSelected} onCheckedChange={toggleAllPermissions} />
          </div>

          <div className='grid gap-3 pt-1 sm:grid-cols-2'>
            {ALL_PERMISSIONS.map((permission) => (
              <div key={permission} className='flex items-center gap-3'>
                <Switch
                  id={`permission-${permission}`}
                  checked={form.permissions.includes(permission)}
                  onCheckedChange={(checked) => togglePermission(permission, checked)}
                />
                <Label htmlFor={`permission-${permission}`} className='cursor-pointer text-sm'>
                  {PERMISSION_LABELS[permission]}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.admins.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

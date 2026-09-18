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
  [PERMISSIONS.SETTINGS_MANAGE]: 'Manage Settings',
  [PERMISSIONS.ADMINS_MANAGE]: 'Manage Admins',
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
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 sm:grid-cols-2'>
          {ALL_PERMISSIONS.map((permission) => (
            <div key={permission} className='flex items-center gap-3'>
              <Switch
                id={`permission-${permission}`}
                checked={form.permissions.includes(permission)}
                onCheckedChange={(checked) => togglePermission(permission, checked)}
              />
              <Label htmlFor={`permission-${permission}`}>{PERMISSION_LABELS[permission]}</Label>
            </div>
          ))}
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

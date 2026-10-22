import type { RoleName } from '@/lib/auth/permissions';
import type { UserDto } from '@/server/services/user-admin/manage';
import type { USER_STATUSES } from '@/validations/user-admin-schema';

export type { UserDto };

export type UserStatusFilter = (typeof USER_STATUSES)[number];

export type UserListQuery = {
  page: number;
  pageSize: number;
  q?: string;
  role?: RoleName;
  status?: UserStatusFilter;
};

export type UserListResult = { items: UserDto[]; total: number };

// Invite / resend answer with `manualLink` only when SMTP is not configured.
export type InviteResult = { id: string; email: string; name: string; role: RoleName; manualLink?: string };
export type ResendResult = { ok: true; manualLink?: string };

export type UserAction = 'roles' | 'ban' | 'unban' | 'revoke' | 'resend' | 'view-as' | 'delete';

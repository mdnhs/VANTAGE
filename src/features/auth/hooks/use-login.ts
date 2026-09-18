'use client';

import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '@/lib/routes/api-routes';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  id: string;
  email: string;
  name: string;
}

async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}${API_ROUTES.auth.login}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );

  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Login failed');
  }
  return body.data as LoginResponse;
}

export function useLogin() {
  return useMutation({ mutationFn: login });
}

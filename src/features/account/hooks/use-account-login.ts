'use client';

import { useMutation } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

interface AccountLoginInput {
  email: string;
  password: string;
}

async function login(input: AccountLoginInput) {
  const { data, error } = await authClient.signIn.email(input);
  if (error) throw new Error(error.message ?? 'Login failed');
  return data;
}

export function useAccountLogin() {
  return useMutation({ mutationFn: login });
}

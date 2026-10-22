'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSeoOverview } from '../services/api';
import { seoKeys } from '../utils/query-keys';

export function useSeoOverview() {
  return useQuery({ queryKey: seoKeys.overview(), queryFn: fetchSeoOverview });
}

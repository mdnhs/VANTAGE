'use client';

import { EyeIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActor } from '@/contexts/actor-provider';

import { PasswordForm } from './password-form';
import { ProfileForm } from './profile-form';
import { SessionsList } from './sessions-list';
import { ThemePreference } from './theme-preference';
import { TwoFactorCard } from './two-factor-card';

const TABS = ['profile', 'security', 'sessions'] as const;
type Tab = (typeof TABS)[number];

export function AccountView() {
  const { user, impersonatedBy } = useActor();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.find((t) => t === requested) ?? 'profile';

  const header = <PageHeader title='Account' description={user.email} />;

  // The server refuses account changes during View-as too (403); this spares the
  // admin forms that cannot work.
  if (impersonatedBy) {
    return (
      <div className='flex flex-col gap-6'>
        {header}
        <div className='flex flex-col items-center gap-2 rounded-card border border-dashed p-8 text-center'>
          <EyeIcon aria-hidden className='size-5 text-muted-foreground' />
          <h2 className='text-card-title'>You&apos;re viewing as {user.name}</h2>
          <p className='max-w-md text-sm text-muted-foreground'>
            Their profile, password and devices can only be changed by them. Stop viewing as them to manage your own
            account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {header}
      <Tabs
        value={tab}
        onValueChange={(value) => router.replace(`${pathname}?tab=${String(value)}`, { scroll: false })}
      >
        <TabsList>
          <TabsTrigger value='profile'>Profile</TabsTrigger>
          <TabsTrigger value='security'>Security</TabsTrigger>
          <TabsTrigger value='sessions'>Devices</TabsTrigger>
        </TabsList>
        <TabsContent value='profile' className='mt-4 grid gap-4 xl:grid-cols-2'>
          <DashboardCard title='Profile'>
            <ProfileForm />
          </DashboardCard>
          <DashboardCard title='Appearance'>
            <ThemePreference />
          </DashboardCard>
        </TabsContent>
        <TabsContent value='security' className='mt-4 grid gap-4 xl:grid-cols-2'>
          <DashboardCard title='Password'>
            <p className='text-sm text-muted-foreground'>You stay signed in here. Every other device is signed out.</p>
            <PasswordForm />
          </DashboardCard>
          <DashboardCard title='Two-factor authentication'>
            <TwoFactorCard />
          </DashboardCard>
        </TabsContent>
        <TabsContent value='sessions' className='mt-4'>
          <DashboardCard title='Signed-in devices'>
            <SessionsList />
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

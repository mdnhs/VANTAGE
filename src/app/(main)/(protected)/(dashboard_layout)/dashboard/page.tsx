import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from '@/lib/permission/server-utils';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie per request — must not be prerendered.
export const instant = false;

// Counts overview lands in later phases once services/projects/testimonials/logos exist.
// For now this confirms the auth + permission plumbing end to end.
export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Dashboard</h1>
        <p className='text-sm text-muted-foreground'>Signed in as {session?.email}</p>
      </div>
      <Card className='max-w-sm'>
        <CardHeader>
          <CardTitle>Content modules</CardTitle>
          <CardDescription>Overview cards land here as each CMS module ships.</CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground'>
          Services, Projects, Testimonials, Partner logos and Site settings will appear here once wired up.
        </CardContent>
      </Card>
    </div>
  );
}

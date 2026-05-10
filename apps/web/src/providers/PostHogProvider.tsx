'use client';

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { initPostHog } from '@/lib/posthog';

initPostHog();

function PostHogPageView() {
  const pathname = usePathname();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname) {
      ph.capture('$pageview', { $current_url: `${window.location.origin}${pathname}` });
    }
  }, [pathname, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}

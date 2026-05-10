'use client';

import posthog from 'posthog-js';

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (key && typeof window !== 'undefined') {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // handled by PostHogPageView
      capture_pageleave: true,
    });
  }
}

export { posthog };

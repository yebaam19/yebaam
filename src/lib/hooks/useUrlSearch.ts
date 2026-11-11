'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useDebouncedCallback } from './useScheduledCallback';

type Filters = Record<string, string | null | undefined>;

/** URL-owned search: latest filters, immediate submit, deduplication and cancellable typing. */
export function useUrlSearch(key = 'q') {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQuery = params.get(key) ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  const [issuedQuery, setIssuedQuery] = useState(urlQuery);
  const issued = useRef(urlQuery);
  const draft = useRef<{ from: string; search: string } | null>(null);
  const [navigating, startTransition] = useTransition();

  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery);
    if (urlQuery !== issuedQuery) setQuery(urlQuery);
  }

  function navigate(value: string, filters: Filters = {}) {
    const current = window.location.pathname + window.location.search;
    const next = new URLSearchParams(draft.current?.from === current
      ? draft.current.search : window.location.search);
    const updates = { ...filters, [key]: value.trim(), page: null };
    for (const [name, entry] of Object.entries(updates)) {
      if (entry) next.set(name, entry); else next.delete(name);
    }
    const search = next.toString();
    const href = search ? `${pathname}?${search}` : pathname;
    issued.current = value.trim();
    setIssuedQuery(value.trim());
    if (href === current || (draft.current?.from === current && draft.current.search === search)) return;
    draft.current = { from: current, search };
    startTransition(() => router.replace(href as Route, { scroll: false }));
  }

  const schedule = useDebouncedCallback((value: string) => navigate(value));

  useEffect(() => {
    if (urlQuery !== issued.current) { schedule.cancel(); draft.current = null; }
  }, [urlQuery, schedule]);

  useEffect(() => {
    const restore = () => {
      schedule.cancel();
      draft.current = null;
      const value = new URLSearchParams(window.location.search).get(key) ?? '';
      issued.current = value;
      setQuery(value);
      setIssuedQuery(value);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [key, schedule]);

  const changeQuery = (value: string) => { setQuery(value); schedule(value); };
  const setFilters = (filters: Filters, value = query) => {
    schedule.cancel(); setQuery(value); navigate(value, filters);
  };
  const submit = () => { schedule.cancel(); navigate(query); };
  const reset = (keys: string[] = []) => {
    schedule.cancel();
    setQuery('');
    navigate('', Object.fromEntries(keys.map((name) => [name, null])));
  };

  return { query, changeQuery, setFilters, submit, reset, params,
    pending: navigating || query.trim() !== urlQuery.trim() };
}

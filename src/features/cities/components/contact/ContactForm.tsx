'use client';

/**
 * ContactForm — `/cities/[slug]/contact` form island.
 *
 * Anonymous viewers see the form fields (so they understand the destination
 * shape) but the submit button is replaced with a sign-in CTA. Signed-in
 * users get the submit; on success the form clears and a confirmation
 * sticks until the user re-types.
 */

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { sendCityContactMessage } from '@/features/cities/actions/contact.actions';

interface ContactFormProps {
  cityId: string;
  citySlug: string;
  currentUserId: string | null;
}

export function ContactForm({ cityId, citySlug, currentUserId }: ContactFormProps) {
  const t = useTranslations('cities.contact.form');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    if (!currentUserId) return;
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError(t('errors.bodyRequired'));
      return;
    }
    setError(null);
    startTransition(async () => {
      const out = await sendCityContactMessage({
        cityId,
        subject: subject.trim(),
        body: trimmedBody,
      });
      if (!out.ok) {
        setError(t('errors.submitFailed'));
        return;
      }
      setSent(true);
      setSubject('');
      setBody('');
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:px-6"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t('subjectLabel')}
        </span>
        <input
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setSent(false);
          }}
          placeholder={t('subjectPlaceholder')}
          maxLength={200}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t('bodyLabel')}
        </span>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setSent(false);
          }}
          placeholder={t('bodyPlaceholder')}
          rows={6}
          maxLength={5000}
          className="resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {sent && !error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {t('success')}
        </p>
      )}
      <div className="flex justify-end">
        {currentUserId ? (
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isPending ? t('submitting') : t('submit')}
          </button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('signInRequired')}
            </span>
            <Link
              href={
                `/login?redirect=${encodeURIComponent(
                  `/cities/${citySlug}/contact`,
                )}` as Route
              }
              className="inline-flex items-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {t('signInCta')}
            </Link>
          </div>
        )}
      </div>
    </form>
  );
}

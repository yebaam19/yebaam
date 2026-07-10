'use client';

import { FC, useState } from 'react';
import { toast } from 'sonner';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { invalidate } from '@/lib/hooks/cacheStore';
import type { Page } from '../../../../types/page.types';

interface Props {
  page: Page;
  isOwner: boolean;
}

export const PageAskMePanel: FC<Props> = ({ page, isOwner }) => {
  const [question, setQuestion] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useFetch(
    ['page-askme', page.id],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get(`/api/pages/${page.id}/askme`);
      return res as Array<{
        id: string;
        question: string;
        answer: string | null;
        createdAt: string;
        voteCount: number;
      }>;
    },
    { enabled: !!page.id }
  );

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSaving(true);
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/askme`, { question: question.trim() });
      invalidate('page-askme');
      setQuestion('');
      toast.success('Pregunta enviada');
    } catch {
      toast.error('No se pudo enviar la pregunta');
    } finally {
      setSaving(false);
    }
  };

  const answer = async (questionId: string) => {
    const text = answerDrafts[questionId]?.trim();
    if (!text) return;
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/askme`, { questionId, answer: text });
      invalidate('page-askme');
      toast.success('Respuesta publicada');
    } catch {
      toast.error('No se pudo responder');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">AskMe</h2>
      <form onSubmit={ask} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3">
        <textarea
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Haz una pregunta a la página…"
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Preguntar
        </button>
      </form>

      {isLoading && <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />}

      <div className="space-y-3">
        {(data ?? []).map((q) => (
          <div key={q.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <p className="font-medium text-gray-900 dark:text-white">{q.question}</p>
            {q.answer ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-blue-500 pl-3">
                {q.answer}
              </p>
            ) : isOwner ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={answerDrafts[q.id] ?? ''}
                  onChange={(e) =>
                    setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="Escribe la respuesta…"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => answer(q.id)}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Responder
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">Sin respuesta aún</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

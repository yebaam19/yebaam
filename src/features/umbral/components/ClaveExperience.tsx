'use client';

import { useState } from 'react';
import { pronounceClave } from '../actions/umbral.actions';
import {
  UMBRAL_ATTEMPT_COUNT_LABEL,
  UMBRAL_ERROR,
  UMBRAL_RATE_LIMITED,
} from '../constants';
import { ClaveForm } from './clave/ClaveForm';
import { UmbralGate } from './clave/UmbralGate';

type Phase = 'idle' | 'listening' | 'answered';

/**
 * The interactive heart of El Umbral: type a clave, the door "listens",
 * a cryptic reply appears. Only mounted for visitors with a profile — the
 * page renders UmbralGate for anonymous ones (clave-1.pdf: entering the
 * umbral requires creating a profile). The gate here covers the one gap
 * the server can't: a session that expires between render and pronounce.
 */
export function ClaveExperience() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [gateOpen, setGateOpen] = useState(false);
  const [value, setValue] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    const attempt = value.trim();
    if (!attempt || phase === 'listening') return;

    setPhase('listening');
    setReply(null);
    setNotice(null);

    try {
      // The pause is theatrical on purpose: a door that answers instantly
      // feels like a form; one that takes a breath feels like a presence.
      const [result] = await Promise.all([
        pronounceClave(attempt),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      if (result.ok) {
        setReply(result.data.reply);
        setAttemptNumber(result.data.attemptNumber);
        setValue('');
        setPhase('answered');
        return;
      }

      if (result.error === 'not_authenticated') {
        setGateOpen(true);
        setPhase('idle');
        return;
      }

      setNotice(result.error === 'rate_limited' ? UMBRAL_RATE_LIMITED : UMBRAL_ERROR);
      setPhase('idle');
    } catch {
      setNotice(UMBRAL_ERROR);
      setPhase('idle');
    }
  }

  if (gateOpen) {
    return <UmbralGate onDismiss={() => setGateOpen(false)} />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <ClaveForm
        value={value}
        listening={phase === 'listening'}
        onChange={setValue}
        onSubmit={handleSubmit}
      />

      {phase === 'answered' && reply && (
        <div className="animate-fade-in flex flex-col items-center gap-3 text-center">
          <p className="max-w-md text-xl leading-relaxed text-neutral-200 sm:text-2xl">{reply}</p>
          {attemptNumber != null && (
            <p className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase">
              {UMBRAL_ATTEMPT_COUNT_LABEL} {attemptNumber}
            </p>
          )}
        </div>
      )}

      {notice && (
        <p className="animate-fade-in max-w-md text-center text-sm leading-relaxed text-neutral-500">
          {notice}
        </p>
      )}
    </div>
  );
}

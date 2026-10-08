'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const unlocked: {
  editor: string | null; busy: boolean;
  beginEdit: (id: string) => void; endEdit: () => void;
  beginMutation: (editor?: string) => boolean; endMutation: () => void;
} = {
  editor: null as string | null, busy: false,
  beginEdit: () => {}, endEdit: () => {},
  beginMutation: () => true, endMutation: () => {},
};
const PlanInteractionContext = createContext(unlocked);

// One editor at a time prevents an unrelated refresh from discarding a draft.
export function PlanInteractionProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = useRef({ editor: null as string | null, busy: false });
  const beginEdit = useCallback((id: string) => {
    if (current.current.editor || current.current.busy) return;
    current.current.editor = id;
    setEditor(id);
  }, []);
  const endEdit = useCallback(() => {
    current.current.editor = null;
    setEditor(null);
  }, []);
  const beginMutation = useCallback((editorId?: string) => {
    if (current.current.busy || (current.current.editor && current.current.editor !== editorId)) return false;
    current.current.busy = true;
    setBusy(true);
    return true;
  }, []);
  const endMutation = useCallback(() => {
    current.current.busy = false;
    setBusy(false);
  }, []);
  return <PlanInteractionContext.Provider value={{ editor, busy, beginEdit, endEdit, beginMutation, endMutation }}>
    {children}
  </PlanInteractionContext.Provider>;
}

export function usePlanInteraction() { return useContext(PlanInteractionContext); }

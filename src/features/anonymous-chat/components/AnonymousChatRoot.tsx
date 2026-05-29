'use client';

import { useIncomingAnonInvites } from '../hooks/useIncomingAnonInvites';
import AnonymousChatInvitePrompt from './AnonymousChatInvitePrompt';
import AnonymousChatTray from './AnonymousChatTray';

/**
 * Single global mount for the anonymous-chat overlay: subscribes the current
 * user to their private invite channel, renders the incoming-invite prompt, and
 * renders open sessions as docked bubbles. Mount once inside the authenticated
 * app shell.
 */
export default function AnonymousChatRoot() {
  useIncomingAnonInvites();
  return (
    <>
      <AnonymousChatInvitePrompt />
      <AnonymousChatTray />
    </>
  );
}

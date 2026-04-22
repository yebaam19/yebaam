import type { ChatIdentityKind } from '../types'

export interface ChatCapabilities {
  canChat: boolean
  canUploadImage: boolean
  canUploadVideo: boolean
  canPostLink: boolean
  canReact: boolean
  canReply: boolean
  canCreateSubroom: boolean
  canInviteMember: boolean
}

const BASE: ChatCapabilities = {
  canChat: false,
  canUploadImage: false,
  canUploadVideo: false,
  canPostLink: false,
  canReact: false,
  canReply: false,
  canCreateSubroom: false,
  canInviteMember: false,
}

export function capabilitiesFor(
  identity: { kind: ChatIdentityKind } | null,
): ChatCapabilities {
  if (!identity) return BASE
  const kind: ChatIdentityKind = identity.kind

  if (kind === 'profile') {
    return {
      canChat: true,
      canUploadImage: true,
      canUploadVideo: true,
      canPostLink: true,
      canReact: true,
      canReply: true,
      canCreateSubroom: true,
      canInviteMember: true,
    }
  }
  if (kind === 'nick') {
    return {
      canChat: true,
      canUploadImage: true,
      canUploadVideo: false,
      canPostLink: false,
      canReact: true,
      canReply: true,
      canCreateSubroom: false,
      canInviteMember: false,
    }
  }
  // guest
  return {
    canChat: true,
    canUploadImage: false,
    canUploadVideo: false,
    canPostLink: false,
    canReact: true,
    canReply: true,
    canCreateSubroom: false,
    canInviteMember: false,
  }
}

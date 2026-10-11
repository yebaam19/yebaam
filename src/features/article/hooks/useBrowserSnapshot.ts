'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

export function useBrowserOrigin() {
  return useSyncExternalStore(subscribe, getOrigin, getServerOrigin)
}

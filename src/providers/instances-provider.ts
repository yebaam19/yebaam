// src/app/providers.ts (o layout.tsx)
'use client'


import { initAxios } from '@/lib/axios/axiosInstance'
import Cookies from 'js-cookie'

// Inicializar axios con tokenProvider
initAxios({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  tokenProvider: {
    getAccessToken: () => Cookies.get('accessToken') || null,
    getRefreshToken: () => Cookies.get('refreshToken') || null,
    setTokens: (a, r) => {
      if (a) Cookies.set('accessToken', a)
      if (r) Cookies.set('refreshToken', r)
    },
  },
  interceptorOptions: {
    refreshEndpoint: '/api/auth-client/refresh-token',
    onRefreshError: () => {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
    },
  },
})

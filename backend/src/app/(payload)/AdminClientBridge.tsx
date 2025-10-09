"use client"

import React from 'react'
import { RootProvider, ProgressBar } from '@payloadcms/ui'
import type { ClientConfig, LanguageOptions, SanitizedPermissions, TypedUser } from 'payload'

type Props = {
  children: React.ReactNode
  config: ClientConfig
  dateFNSKey: string
  fallbackLang: string
  isNavOpen: boolean
  languageCode: string
  languageOptions: LanguageOptions
  locale?: string
  permissions: SanitizedPermissions | null
  theme: 'light' | 'dark'
  translations: any
  user: TypedUser | null
  endpoint: string
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[-.\\[\\]]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : undefined
}

export default function AdminClientBridge(props: Props) {
  const {
    children,
    config,
    dateFNSKey,
    fallbackLang,
    isNavOpen,
    languageCode,
    languageOptions,
    locale,
    permissions,
    theme,
    translations,
    user,
    endpoint,
  } = props

  async function serverFunction(args: any) {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    const csrf = getCookie('payload-csrf-token')
    if (csrf) headers['payload-csrf-token'] = csrf
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(args),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Server function failed (${res.status}): ${text}`)
    }
    return res.json()
  }

  async function switchLanguageServerAction(lang: string) {
    const cookieName = `${config.cookiePrefix || 'payload'}-lng`
    document.cookie = `${cookieName}=${encodeURIComponent(lang)}; Path=/; SameSite=Lax`
  }

  return (
    <RootProvider
      config={config}
      dateFNSKey={dateFNSKey as any}
      fallbackLang={fallbackLang as any}
      isNavOpen={isNavOpen}
      languageCode={languageCode}
      languageOptions={languageOptions}
      locale={locale as any}
      permissions={permissions as any}
      serverFunction={serverFunction as any}
      switchLanguageServerAction={switchLanguageServerAction}
      theme={theme as any}
      translations={translations}
      user={user as any}
    >
      <ProgressBar />
      {children}
    </RootProvider>
  )
}


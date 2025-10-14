import type { ImportMap } from 'payload'
import React from 'react'
import { cookies, headers } from 'next/headers'
// Local fallback list of RTL languages to avoid requiring @payloadcms/translations
const rtlLanguages = [
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian (Farsi)
  'ur', // Urdu
  'ps', // Pashto
  'ku', // Kurdish (Sorani)
  'dv', // Dhivehi
  'yi', // Yiddish
] as const
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getPayload } from 'payload'
import { getNextRequestI18n } from '@payloadcms/next/utilities'
import AdminClientBridge from './AdminClientBridge'
import type { LanguageOptions } from 'payload'

type Props = {
  children: React.ReactNode
  config: Promise<any>
  importMap: ImportMap
}

export default async function CustomRootLayout({ children, config: configPromise, importMap }: Props) {
  const payloadConfig = await configPromise

  const i18n = await getNextRequestI18n({ config: payloadConfig })
  let user: any = null
  const skipDbAuth = process.env.PAYLOAD_SKIP_DB_AUTH === 'true' || process.env.PAYLOAD_ALLOW_NO_DB === 'true'
  if (!skipDbAuth) {
    try {
      const payload = await getPayload({ config: payloadConfig })
      const authRes = await payload.auth({ headers: await headers() })
      user = authRes?.user ?? null
    } catch {
      // DB not available; proceed unauthenticated without crashing dev
    }
  }

  const acceptedThemes = ['dark', 'light'] as const
  let theme: 'dark' | 'light' = 'light'
  const adminTheme = payloadConfig?.admin?.theme
  if (adminTheme && adminTheme !== 'all' && acceptedThemes.includes(adminTheme)) {
    theme = adminTheme
  } else {
    const themeCookie = (await cookies()).get(`${payloadConfig.cookiePrefix || 'payload'}-theme`)
    const themeFromCookie = typeof themeCookie === 'string' ? themeCookie : themeCookie?.value
    const themeFromHeader = (await headers()).get('Sec-CH-Prefers-Color-Scheme') as 'dark' | 'light' | null
    if (themeFromCookie && acceptedThemes.includes(themeFromCookie as any)) theme = themeFromCookie as any
    else if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) theme = themeFromHeader
  }

  // i18n.language is a string; cast for includes check against typed RTL list
  const dir = (rtlLanguages as readonly string[]).includes(i18n.language as string) ? 'RTL' : 'LTR'

  const languageOptions = Object.entries(payloadConfig.i18n.supportedLanguages || {}).reduce(
    (acc: Array<{ label: string; value: string }>, [language, languageConfig]: [string, any]) => {
      if (Object.keys(payloadConfig.i18n.supportedLanguages).includes(language)) {
        acc.push({ label: languageConfig.translations.general.thisLanguage, value: language })
      }
      return acc
    },
    [],
  )

  const clientConfig = getClientConfig({ config: payloadConfig, i18n, importMap, user })

  return (
    <html
      data-theme={theme}
      dir={dir}
      lang={i18n.language}
      suppressHydrationWarning={payloadConfig?.admin?.suppressHydrationWarning ?? false}
    >
      <head>
        <style>{`@layer payload-default, payload;`}</style>
      </head>
      <body>
        <AdminClientBridge
          config={clientConfig}
          dateFNSKey={i18n.dateFNSKey}
          fallbackLang={payloadConfig.i18n.fallbackLanguage}
          isNavOpen={true}
          languageCode={i18n.language}
          languageOptions={languageOptions as unknown as LanguageOptions}
          permissions={user ? (null as any) : null}
          theme={theme}
          translations={i18n.translations}
          user={user as any}
          endpoint={'/api/server-functions'}
        >
          {children}
        </AdminClientBridge>
        <div id="portal" />
      </body>
    </html>
  )
}

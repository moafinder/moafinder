/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import CustomRootLayout from './CustomRootLayout'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

const Layout = ({ children }: { children: React.ReactNode }) => (
  <CustomRootLayout config={config} importMap={importMap}>
    {children}
  </CustomRootLayout>
)

export default Layout

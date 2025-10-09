"use server"

import config from '@payload-config'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

export const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}


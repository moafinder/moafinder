import type { CollectionConfig, PayloadRequest } from 'payload'

const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: '../uploads',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    delete: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      return {
        owner: {
          equals: user.id,
        },
      } as any
    },
    update: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      return {
        owner: {
          equals: user.id,
        },
      } as any
    },
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (operation !== 'create') return data

        const nextData = typeof data === 'object' && data !== null ? { ...data } : {}

        const payloadUpload = (req as any).payloadUpload
        const uploadFields = payloadUpload?.fields ?? payloadUpload ?? {}
        const uploadAlt = uploadFields?.alt
        const payloadAlt = (payloadUpload?.files ?? payloadUpload)?.alt
        const queryAltRaw = Array.isArray((req as any).query?.alt)
          ? (req as any).query.alt[0]
          : (req as any).query?.alt
        const bodyAlt = uploadAlt ?? payloadAlt ?? (req as any).body?.alt ?? queryAltRaw

        const rawAlt =
          Array.isArray(bodyAlt) && bodyAlt.length > 0
            ? bodyAlt[0]
            : typeof bodyAlt === 'string'
            ? bodyAlt
            : typeof nextData.alt === 'string'
            ? nextData.alt
            : null

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[Media.beforeValidate] alt candidates', {
            bodyAlt,
            dataAlt: nextData.alt,
            payloadUploadAlt: uploadAlt,
            payloadUploadFilesAlt: payloadAlt,
            payloadUploadKeys: Object.keys(uploadFields || {}),
            queryAlt: queryAltRaw,
            bodyKeys: Object.keys(req.body || {}),
          })
        }

        if (typeof rawAlt === 'string') {
          nextData.alt = rawAlt.trim()
        }

        return nextData
      },
    ],
    beforeChange: [
      ({ data, req, operation, originalDoc }) => {
        if (!req.user) return data
        if (operation !== 'create') return data

        const nextData: Record<string, unknown> = {
          ...(typeof data === 'object' && data !== null ? data : {}),
        }

        const payloadUpload = (req as any).payloadUpload
        const uploadFields = payloadUpload?.fields ?? payloadUpload ?? {}
        const uploadAlt = uploadFields?.alt
        const payloadAlt = (payloadUpload?.files ?? payloadUpload)?.alt
        const queryAltRaw = Array.isArray((req as any).query?.alt)
          ? (req as any).query.alt[0]
          : (req as any).query?.alt
        const bodyAlt = uploadAlt ?? payloadAlt ?? (req as any).body?.alt ?? queryAltRaw

        const rawAlt =
          Array.isArray(bodyAlt) && bodyAlt.length > 0
            ? bodyAlt[0]
            : typeof bodyAlt === 'string'
            ? bodyAlt
            : typeof (nextData.alt ?? originalDoc?.alt) === 'string'
            ? (nextData.alt ?? originalDoc?.alt)
            : null

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[Media.beforeChange] alt candidates', {
            bodyAlt,
            dataAlt: nextData.alt,
            payloadUploadAlt: uploadAlt,
            payloadUploadFilesAlt: payloadAlt,
            payloadUploadKeys: Object.keys(uploadFields || {}),
            queryAlt: queryAltRaw,
            bodyKeys: Object.keys(req.body || {}),
          })
        }

        if (typeof rawAlt === 'string' && rawAlt.trim() !== '') {
          nextData.alt = rawAlt.trim()
        }

        nextData.owner = req.user.id

        return nextData
      },
    ],
  },
}

export default Media

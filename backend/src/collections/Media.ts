import type { CollectionConfig, PayloadRequest } from 'payload'

// Helper to get user's organization IDs
async function getUserOrganizationIds(req: PayloadRequest): Promise<string[]> {
  const user = req.user as any
  if (!user) return []
  
  const orgIds: string[] = []
  
  // Get organizations from user's organizations field (hasMany)
  if (user.organizations) {
    const orgs = Array.isArray(user.organizations) ? user.organizations : [user.organizations]
    orgs.forEach((org: any) => {
      const id = typeof org === 'object' ? org?.id : org
      if (id && !orgIds.includes(id)) orgIds.push(id)
    })
  }
  
  // Also check for organizations they own
  try {
    const owned = await req.payload.find({
      collection: 'organizations',
      where: { owner: { equals: user.id } } as any,
      limit: 100,
      overrideAccess: true,
    })
    owned.docs.forEach((org: any) => {
      if (org.id && !orgIds.includes(org.id)) orgIds.push(org.id)
    })
  } catch {
    // ignore
  }
  
  return orgIds
}

const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: './uploads',
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
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'organizationName', 'createdAt'],
    group: 'Inhalte',
    description: 'Bilder für Veranstaltungen und Orte. Jedes Bild gehört zu einer Organisation.',
  },
  access: {
    // Public can view all media (for displaying on frontend)
    read: () => true,
    // Authenticated users with at least one org can create
    create: async ({ req }: { req: PayloadRequest }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      const orgIds = await getUserOrganizationIds(req)
      return orgIds.length > 0
    },
    // Admin or users who belong to the media's organization can delete
    delete: async ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin') return true
      const orgIds = await getUserOrganizationIds(req)
      if (orgIds.length === 0) return false
      return { organization: { in: orgIds } } as any
    },
    // Admin or users who belong to the media's organization can update
    update: async ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin') return true
      const orgIds = await getUserOrganizationIds(req)
      if (orgIds.length === 0) return false
      return { organization: { in: orgIds } } as any
    },
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      label: 'Organisation',
      admin: {
        description: 'Dieses Bild gehört zu dieser Organisation. Nur Mitglieder können es verwenden.',
        allowCreate: false,
      },
      // Filter to show only user's organizations
      filterOptions: async ({ user }) => {
        if (!user) return false
        if (user.role === 'admin') return true
        
        const orgIds: string[] = []
        if ((user as any).organizations) {
          const orgs = Array.isArray((user as any).organizations) ? (user as any).organizations : [(user as any).organizations]
          for (const org of orgs) {
            const orgId = typeof org === 'object' ? org?.id : org
            if (orgId) orgIds.push(orgId)
          }
        }
        
        if (orgIds.length === 0) return false
        return { id: { in: orgIds } }
      },
    },
    // Virtual field for displaying organization name in list view
    {
      name: 'organizationName',
      type: 'text',
      label: 'Organisation',
      admin: {
        readOnly: true,
        hidden: true,
      },
      virtual: true,
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.organization) return ''
            const orgId = typeof data.organization === 'object' ? data.organization?.id : data.organization
            if (!orgId) return ''
            if (typeof data.organization === 'object' && data.organization?.name) {
              return data.organization.name
            }
            try {
              const orgDoc = await req.payload.findByID({
                collection: 'organizations',
                id: orgId,
                depth: 0,
                overrideAccess: true,
              })
              return orgDoc?.name ?? ''
            } catch {
              return ''
            }
          },
        ],
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Hochgeladen von',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: 'Beschreibender Text für Barrierefreiheit und SEO.',
      },
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

        // Auto-assign owner
        nextData.owner = req.user.id

        // Extract organization from various sources (form data, query, body)
        const uploadOrg = uploadFields?.organization
        const queryOrg = (req as any).query?.organization
        const bodyOrg = (req as any).body?.organization
        const rawOrg = uploadOrg ?? bodyOrg ?? queryOrg ?? nextData.organization

        if (rawOrg) {
          nextData.organization = typeof rawOrg === 'object' ? rawOrg.id ?? rawOrg : rawOrg
        }

        return nextData
      },
    ],
  },
}

export default Media

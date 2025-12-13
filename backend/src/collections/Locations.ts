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

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'organizations', 'address'],
    description: 'Veranstaltungsorte können mehreren Organisationen zugeordnet sein.',
  },
  access: {
    read: () => true,
    create: async ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any
      if (!user || user.disabled) return false
      if (user.role === 'admin' || user.role === 'editor') return true

      // Allow non-admins to create only if they belong to at least one organization
      const orgIds = await getUserOrganizationIds(req)
      return orgIds.length > 0
    },
    update: async ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any
      if (!user) return false
      if (user.role === 'admin') return true
      
      // Editors/Organizers may update only locations belonging to their organizations
      const orgIds = await getUserOrganizationIds(req)
      if (orgIds.length === 0) return false
      
      // Location must have at least one of user's organizations
      return { 'organizations.id': { in: orgIds } } as any
    },
    delete: async ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any
      if (!user) return false
      if (user.role === 'admin') return true
      
      const orgIds = await getUserOrganizationIds(req)
      if (orgIds.length === 0) return false
      
      return { 'organizations.id': { in: orgIds } } as any
    },
  },
  fields: [
    {
      name: 'organizations',
      type: 'relationship',
      relationTo: 'organizations',
      hasMany: true,
      label: 'Organisationen',
      required: true,
      admin: {
        description: 'Organisationen, die diesen Ort verwalten können. Benutzer sehen nur Orte ihrer Organisationen.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Voller Name des Ortes',
    },
    {
      name: 'shortName',
      type: 'text',
      required: true,
      maxLength: 40,
      label: 'Kurzform des Ortsnamens',
      admin: {
        description: 'Erscheint im Filtermenü und in der Karte',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschreibung',
      maxLength: 1000,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Foto vom Ort',
    },
    {
      name: 'address',
      type: 'group',
      label: 'Adresse',
      fields: [
        { name: 'street', type: 'text', required: true, label: 'Straße' },
        { name: 'number', type: 'text', required: true, label: 'Hausnummer' },
        { name: 'postalCode', type: 'text', required: true, label: 'PLZ' },
        { name: 'city', type: 'text', defaultValue: 'Berlin', label: 'Stadt' },
      ],
    },
    {
      name: 'coordinates',
      type: 'point',
      label: 'GPS Koordinaten',
    },
    {
      name: 'mapPosition',
      type: 'group',
      label: 'Position auf der Karte',
      admin: {
        description: 'X und Y Position in Prozent (0-100)',
      },
      fields: [
        { name: 'x', type: 'number', min: 0, max: 100, label: 'X Position (%)' },
        { name: 'y', type: 'number', min: 0, max: 100, label: 'Y Position (%)' },
      ],
    },
    {
      name: 'openingHours',
      type: 'text',
      label: 'Öffnungszeiten',
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-Mail',
      admin: {
        description: 'Kontakt-E-Mail für diesen Ort',
      },
    },
    {
      name: 'homepage',
      type: 'text',
      label: 'Webseite',
      admin: {
        description: 'URL der Webseite (z.B. https://example.com)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        const user = req.user as any
        if (!user) return data

        if (operation === 'create' && user.role !== 'admin') {
          // Force organizations to the user's organizations
          const userOrgIds = await getUserOrganizationIds(req)
          if (userOrgIds.length > 0 && (!data.organizations || data.organizations.length === 0)) {
            data.organizations = userOrgIds
          }
        }

        // When non-admin updating, prevent organizations re-assignment
        if (operation === 'update' && user.role !== 'admin') {
          if (data && 'organizations' in data) delete (data as any).organizations
        }

        return data
      },
    ],
  },
  timestamps: true,
}

export default Locations

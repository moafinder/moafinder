import type { CollectionConfig, PayloadRequest } from 'payload'

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'owner', 'address'],
  },
  access: {
    read: () => true,
    create: async ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any
      if (!user || user.disabled) return false
      if (user.role === 'admin' || user.role === 'editor') return true

      // Allow non-admins to create only if they belong to at least one organization
      try {
        const owned = await req.payload.find({
          collection: 'organizations',
          where: { owner: { equals: user.id } } as any,
          limit: 1,
          overrideAccess: true,
        })
        // Check user's organization membership (handle both object and ID reference)
        const membershipId = typeof user.organization === 'object' ? user.organization?.id : user.organization
        const hasMembership = membershipId ? 1 : 0
        return (owned?.totalDocs ?? 0) + hasMembership > 0
      } catch {
        return false
      }
    },
    update: async ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any
      if (!user) return false
      if (user.role === 'admin') return true
      // Editors/Organizers may update only their own locations
      try {
        const orgs = await req.payload.find({
          collection: 'organizations',
          where: { owner: { equals: user.id } } as any,
          limit: 100,
          overrideAccess: true,
        })
        const ids = (orgs?.docs ?? []).map((o: any) => o.id)
        const membershipId = typeof (user as any).organization === 'object' ? (user as any).organization?.id : (user as any).organization
        if (membershipId && !ids.includes(membershipId)) ids.push(membershipId)
        if (ids.length === 0) return false
        return { owner: { in: ids } } as any
      } catch {
        return false
      }
    },
    delete: async ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any
      if (!user) return false
      if (user.role === 'admin') return true
      try {
        const orgs = await req.payload.find({
          collection: 'organizations',
          where: { owner: { equals: user.id } } as any,
          limit: 100,
          overrideAccess: true,
        })
        const ids = (orgs?.docs ?? []).map((o: any) => o.id)
        const membershipId = typeof (user as any).organization === 'object' ? (user as any).organization?.id : (user as any).organization
        if (membershipId && !ids.includes(membershipId)) ids.push(membershipId)
        if (ids.length === 0) return false
        return { owner: { in: ids } } as any
      } catch {
        return false
      }
    },
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'organizations',
      label: 'Besitzende Organisation',
      required: true,
      admin: {
        description: 'Organisation, der dieser Ort gehört. Wird bei Nicht-Admins automatisch gesetzt.',
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
          // Force owner to one of the user's organizations
          try {
            const orgs = await req.payload.find({
              collection: 'organizations',
              where: { owner: { equals: user.id } } as any,
              limit: 1,
              overrideAccess: true,
            })
            const orgId = orgs?.docs?.[0]?.id
            const membershipId = typeof (user as any).organization === 'object' ? (user as any).organization?.id : (user as any).organization
            const candidate = membershipId || orgId
            if (candidate) {
              data.owner = candidate
            }
          } catch {
            // ignore
          }
        }

        // When non-admin updating, prevent owner re-assignment
        if (operation === 'update' && user.role !== 'admin') {
          if (data && 'owner' in data) delete (data as any).owner
        }

        return data
      },
    ],
  },
  timestamps: true,
}

export default Locations

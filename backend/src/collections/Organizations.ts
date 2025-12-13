import type { CollectionConfig, PayloadRequest } from 'payload'

const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'approved', 'owner', 'createdAt'],
    description: 'Organisationen verwalten Veranstaltungsorte und Benutzer. Jeder Benutzer und jeder Ort kann mehreren Organisationen zugeordnet sein.',
    group: 'Verwaltung',
  },
  access: {
    read: () => true,
    create: ({ req }: { req: PayloadRequest }) => {
      // All authenticated users can create organizations (pending approval)
      return !!req.user
    },
    update: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      // Organization owners can update their own org (except approval status)
      return {
        owner: {
          equals: user.id,
        },
      } as any
    },
    delete: ({ req }: { req: PayloadRequest }) => {
      // Only admins can delete organizations
      return req.user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      label: 'Eigentümer',
      admin: {
        description: 'Benutzer, der diese Organisation verwaltet.',
        condition: (data, siblingData, { user }) => user?.role === 'admin' || user?.role === 'editor',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name der Organisation',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: 'E-Mail-Adresse',
    },
    {
      name: 'contactPerson',
      type: 'text',
      label: 'Kontaktperson',
    },
    {
      name: 'address',
      type: 'group',
      label: 'Adresse',
      fields: [
        { name: 'street', type: 'text', label: 'Straße' },
        { name: 'number', type: 'text', label: 'Hausnummer' },
        { name: 'postalCode', type: 'text', label: 'PLZ' },
        { name: 'city', type: 'text', label: 'Stadt', defaultValue: 'Berlin' },
      ],
    },
    {
      name: 'website',
      type: 'text',
      label: 'Webseite',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Telefon',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
    {
      name: 'approved',
      type: 'checkbox',
      label: 'Freigegeben',
      defaultValue: false,
      admin: {
        description: 'Nur freigegebene Organisationen können Veranstaltungen erstellen.',
        condition: (data, siblingData, { user }) => user?.role === 'admin' || user?.role === 'editor',
      },
      access: {
        update: ({ req }: { req: PayloadRequest }) =>
          req.user?.role === 'editor' || req.user?.role === 'admin',
      },
    },
    // Membership requests - users can request to join an organization
    {
      name: 'membershipRequests',
      type: 'array',
      label: 'Mitgliedschaftsanfragen',
      admin: {
        description: 'Benutzer, die dieser Organisation beitreten möchten.',
        condition: (data, siblingData, { user }) => user?.role === 'admin' || user?.role === 'editor',
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          label: 'Benutzer',
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Ausstehend', value: 'pending' },
            { label: 'Genehmigt', value: 'approved' },
            { label: 'Abgelehnt', value: 'rejected' },
          ],
          defaultValue: 'pending',
          label: 'Status',
        },
        {
          name: 'requestedAt',
          type: 'date',
          label: 'Angefragt am',
          admin: { readOnly: true },
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Nachricht',
          admin: {
            description: 'Optionale Nachricht des Benutzers.',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (!data) return data
      // Auto-assign owner on create
      if (operation === 'create' && req.user) {
        data.owner = req.user.id
        // Organizations created by non-admins start as unapproved
        if (req.user.role !== 'admin' && req.user.role !== 'editor') {
          data.approved = false
        }
      }
      return data
    }],
    afterChange: [
      async ({ doc, req, operation }) => {
        // When an organization is created, add the owner to its members
        if (operation === 'create' && doc.owner) {
          try {
            const ownerId = typeof doc.owner === 'object' ? doc.owner.id : doc.owner
            const user = await req.payload.findByID({
              collection: 'users',
              id: ownerId,
              depth: 0,
              overrideAccess: true,
            })
            const currentOrgs = user?.organizations || []
            const orgIds = currentOrgs.map((o: any) => typeof o === 'object' ? o.id : o)
            if (!orgIds.includes(doc.id)) {
              await req.payload.update({
                collection: 'users',
                id: ownerId,
                data: { organizations: [...orgIds, doc.id] },
                overrideAccess: true,
              })
            }
          } catch {
            // Best effort
          }
        }
        return doc
      },
    ],
  },
  timestamps: true,
}

export default Organizations

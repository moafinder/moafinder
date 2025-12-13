import type { CollectionConfig, PayloadRequest } from 'payload'

const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'approved', 'createdAt'],
    description: 'Organisationen verwalten Veranstaltungsorte und Benutzer. Jeder Benutzer und jeder Ort kann mehreren Organisationen zugeordnet sein.',
  },
  access: {
    read: () => true,
    create: ({ req }: { req: PayloadRequest }) => {
      // Only admins can create organizations
      return req.user?.role === 'admin'
    },
    update: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      // Organization owners can update their own org
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
        description: 'Benutzer, der diese Organisation verwaltet (optional).',
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
      name: 'role',
      type: 'select',
      options: [
        { label: 'Veranstalter', value: 'organizer' },
        { label: 'Redaktion', value: 'editor' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'organizer',
      access: {
        update: ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin',
      },
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
      access: {
        update: ({ req }: { req: PayloadRequest }) =>
          req.user?.role === 'editor' || req.user?.role === 'admin',
      },
    },
  ],
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (!data) return data
      if (operation === 'create' && req.user) {
        data.owner = req.user.id
      }
      if (operation === 'update' && req.user && req.user.role === 'organizer') {
        data.owner = req.user.id
      }
      return data
    }],
  },
  timestamps: true,
}

export default Organizations

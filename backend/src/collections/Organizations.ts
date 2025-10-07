import type { CollectionConfig, PayloadRequest } from 'payload'

const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'approved', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
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

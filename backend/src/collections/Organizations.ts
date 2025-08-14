import type { CollectionConfig, PayloadRequest } from 'payload'

const Organizations: CollectionConfig = {
  slug: 'organizations',
  auth: true, // Enable authentication
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'approved', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.id,
        },
      } as any
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name der Organisation',
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
  timestamps: true,
}

export default Organizations

import type { CollectionConfig, PayloadRequest } from 'payload'

const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'location', 'status', 'organizer'],
  },
  access: {
    read: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      const notExpired = {
        or: [
          { expiryDate: { equals: null } },
          { expiryDate: { greater_than_equal: new Date().toISOString() } },
        ],
      }
      if (!user) {
        return {
          and: [{ status: { equals: 'approved' } }, notExpired],
        } as any
      }
      if (user.role === 'organizer') {
        return {
          or: [
            { and: [{ status: { equals: 'approved' } }, notExpired] },
            { organizer: { equals: user.id } },
          ],
        } as any
      }
      return true
    },
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    update: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      return { organizer: { equals: user.id } } as any
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 70,
      label: 'Titel der Veranstaltung',
    },
    {
      name: 'subtitle',
      type: 'text',
      maxLength: 100,
      label: 'Untertitel / Teaser',
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Art der Veranstaltung',
      options: [
        { label: 'Einmalig', value: 'einmalig' },
        { label: 'Täglich', value: 'täglich' },
        { label: 'Wöchentlich', value: 'wöchentlich' },
        { label: 'Monatlich', value: 'monatlich' },
        { label: 'Jährlich', value: 'jährlich' },
      ],
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      label: 'Startdatum',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Enddatum',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'time',
      type: 'group',
      label: 'Uhrzeit',
      fields: [
        { name: 'from', type: 'text', label: 'Von' },
        { name: 'to', type: 'text', label: 'Bis' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 1000,
      label: 'Beschreibung',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Bild zur Veranstaltung',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
      label: 'Veranstaltungsort',
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      label: 'Veranstalter',
      defaultValue: ({ user }: { user: PayloadRequest['user'] }) => user?.id,
      access: {
        update: ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'isAccessible',
      type: 'checkbox',
      label: 'Barrierefrei',
      defaultValue: false,
    },
    {
      name: 'cost',
      type: 'group',
      label: 'Kosten',
      fields: [
        { name: 'isFree', type: 'checkbox', label: 'Kostenlos' },
        { name: 'details', type: 'text', label: 'Details (Preis, Soli, etc.)' },
      ],
    },
    {
      name: 'registration',
      type: 'group',
      label: 'Anmeldung',
      fields: [
        { name: 'required', type: 'checkbox', label: 'Anmeldung erforderlich' },
        { name: 'details', type: 'text', label: 'Anmeldedetails' },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Tags',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Status',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Ausstehend', value: 'pending' },
        { label: 'Freigegeben', value: 'approved' },
        { label: 'Archiviert', value: 'archived' },
      ],
      access: {
        update: ({ req }: { req: PayloadRequest }) =>
          req.user?.role === 'editor' || req.user?.role === 'admin',
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      label: 'Ablaufdatum',
      admin: {
        date: {
          pickerAppearance: 'day',
        },
      },
    },
    {
      name: 'lastRenewalReminder',
      type: 'date',
      label: 'Letzte Erinnerung zur Verlängerung',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }: { data: any }) => {
        if (!data?.expiryDate) {
          const baseDate = data?.endDate || data?.startDate
          if (baseDate) {
            data.expiryDate = baseDate
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }: { doc: any; operation: string; req: PayloadRequest }) => {
        // Send email notification when status changes to approved
        if (operation === 'update' && doc.status === 'approved') {
          // TODO: Implement email notification
          console.log('Event approved, send notification email')
        }
      },
    ],
  },
  timestamps: true,
}

export default Events

import type { CollectionConfig, PayloadRequest, Payload } from 'payload'

import { resolveRecipientsFromEnv, sendEmail } from '../lib/email'

// Helper function to get all organization IDs a user belongs to
async function getUserOrgIds(user: any, payload: Payload): Promise<string[]> {
  if (!user) return []
  const orgIds: string[] = []
  
  // Get organizations from user.organizations (array relationship)
  if (user.organizations) {
    const orgs = Array.isArray(user.organizations) ? user.organizations : [user.organizations]
    for (const org of orgs) {
      const orgId = typeof org === 'object' ? org?.id : org
      if (orgId) orgIds.push(orgId)
    }
  }
  
  // Also include organizations the user owns
  try {
    const owned = await payload.find({
      collection: 'organizations',
      where: { owner: { equals: user.id } } as any,
      limit: 100,
      overrideAccess: true,
    })
    for (const org of owned?.docs ?? []) {
      if (!orgIds.includes(org.id)) orgIds.push(org.id)
    }
  } catch {
    // ignore
  }
  
  return orgIds
}

const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'location', 'status', 'organizer'],
  },
  access: {
    read: async ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      const notExpired = {
        or: [
          { expiryDate: { equals: null } },
          { expiryDate: { greater_than_equal: new Date().toISOString() } },
        ],
      }
      if (!user) {
        return { and: [{ status: { equals: 'approved' } }, notExpired] } as any
      }
      if (user.role === 'admin') return true
      // Organizer/Editor: approved or events from their organization(s)
      const orgIds = await getUserOrgIds(user, req.payload)
      return {
        or: [
          { and: [{ status: { equals: 'approved' } }, notExpired] },
          orgIds.length ? { organizer: { in: orgIds } } : { organizer: { equals: '___never___' } },
        ],
      } as any
    },
    create: async ({ req, data }: { req: PayloadRequest; data?: any }) => {
      const user = req.user as any
      if (!user || user.disabled === true) return false

      // Always allow admins and editors
      if (user.role === 'admin' || user.role === 'editor') return true

      // Allow all authenticated organizers to create events, including submissions for review.
      // Drafts are explicitly allowed as well.
      const requestedStatus = (data as any)?.status ?? (req?.body as any)?.status
      if (!requestedStatus || requestedStatus === 'draft' || requestedStatus === 'pending') {
        return true
      }

      // For other statuses (e.g., approved), restrict to editors/admins only (handled above).
      return false
    },
    update: async ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin') return true
      const orgIds = await getUserOrgIds(user, req.payload)
      return orgIds.length ? ({ organizer: { in: orgIds } } as any) : false
    },
    delete: async ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin') return true
      const orgIds = await getUserOrgIds(user, req.payload)
      return orgIds.length ? ({ organizer: { in: orgIds } } as any) : false
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
      name: 'recurrence',
      type: 'group',
      label: 'Wiederholung',
      admin: {
        condition: (_, siblingData) => siblingData?.eventType !== 'einmalig',
      },
      fields: [
        {
          name: 'daysOfWeek',
          type: 'select',
          hasMany: true,
          label: 'Wochentage',
          options: [
            { label: 'Montag', value: 'mon' },
            { label: 'Dienstag', value: 'tue' },
            { label: 'Mittwoch', value: 'wed' },
            { label: 'Donnerstag', value: 'thu' },
            { label: 'Freitag', value: 'fri' },
            { label: 'Samstag', value: 'sat' },
            { label: 'Sonntag', value: 'sun' },
          ],
        },
        {
          name: 'repeatUntil',
          type: 'date',
          label: 'Letzte Durchführung (Datum)',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        // Monthly configuration (optional; used when eventType === 'monatlich')
        {
          name: 'monthlyMode',
          type: 'select',
          label: 'Monatlich: Modus',
          options: [
            { label: 'Am Tag des Monats (z. B. 1.)', value: 'dayOfMonth' },
            { label: 'Am Wochentag im Monat (z. B. 1. Dienstag)', value: 'nthWeekday' },
          ],
        },
        {
          name: 'monthlyDayOfMonth',
          type: 'number',
          label: 'Monatlich: Tag des Monats (1–31)',
          min: 1,
          max: 31,
        },
        {
          name: 'monthlyWeekIndex',
          type: 'select',
          label: 'Monatlich: Welche Woche',
          options: [
            { label: 'Erste', value: 'first' },
            { label: 'Zweite', value: 'second' },
            { label: 'Dritte', value: 'third' },
            { label: 'Vierte', value: 'fourth' },
            { label: 'Letzte', value: 'last' },
          ],
        },
        {
          name: 'monthlyWeekday',
          type: 'select',
          label: 'Monatlich: Wochentag',
          options: [
            { label: 'Montag', value: 'mon' },
            { label: 'Dienstag', value: 'tue' },
            { label: 'Mittwoch', value: 'wed' },
            { label: 'Donnerstag', value: 'thu' },
            { label: 'Freitag', value: 'fri' },
            { label: 'Samstag', value: 'sat' },
            { label: 'Sonntag', value: 'sun' },
          ],
        },
      ],
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
      // Filter locations based on user's organizations (non-admins only see their org's locations)
      filterOptions: async ({ user }) => {
        // Admins can see all locations
        if (!user || user.role === 'admin') return true
        
        // Get user's organization IDs from the organizations array
        const orgIds: string[] = []
        if ((user as any).organizations) {
          const orgs = Array.isArray((user as any).organizations) ? (user as any).organizations : [(user as any).organizations]
          for (const org of orgs) {
            const orgId = typeof org === 'object' ? org?.id : org
            if (orgId) orgIds.push(orgId)
          }
        }
        
        if (orgIds.length === 0) {
          return { id: { equals: '___never___' } } as any
        }
        
        // Filter locations that belong to any of the user's organizations
        return {
          organizations: { in: orgIds }
        } as any
      },
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      label: 'Veranstalter',
      admin: {
        description: 'Wähle die Organisation, die diese Veranstaltung ausrichtet.',
        allowCreate: false, // Disable inline creation to avoid React error
        // For non-admins, the organizer is auto-assigned from their organization
        condition: (data, siblingData, { user }) => {
          // Always show for admins so they can select any organization
          if (user?.role === 'admin') return true
          // For non-admins: hide the field as it will be auto-populated
          return false
        },
      },
      // Field-level access: non-admins can create with organizer (auto-set by hook)
      // but cannot update it afterwards
      access: {
        create: () => true,
        update: ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin',
        read: () => true,
      },
      // Hook to auto-populate for non-admins if not set
      hooks: {
        beforeValidate: [
          async ({ value, req, operation }) => {
            // If organizer is already set, keep it
            if (value) return value
            
            const user = req.user as any
            if (!user) return value
            
            // For non-admin users, auto-assign their first organization
            if (user.role !== 'admin' && operation === 'create') {
              // Get first organization from user.organizations array
              let organizerId: string | undefined
              if (user.organizations) {
                const orgs = Array.isArray(user.organizations) ? user.organizations : [user.organizations]
                if (orgs.length > 0) {
                  organizerId = typeof orgs[0] === 'object' ? orgs[0]?.id : orgs[0]
                }
              }
              
              if (!organizerId) {
                // Try to find an organization they own
                const owned = await req.payload.find({
                  collection: 'organizations',
                  where: { owner: { equals: user.id } } as any,
                  limit: 1,
                  overrideAccess: true,
                })
                organizerId = owned?.docs?.[0]?.id
              }
              
              return organizerId || value
            }
            
            return value
          },
        ],
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
        { label: 'Abgelehnt', value: 'rejected' },
        { label: 'Archiviert', value: 'archived' },
      ],
      access: {
        update: async ({ req, data, siblingData }: { req: PayloadRequest; data?: any; siblingData?: any }) => {
          const user = req.user as any
          if (!user) return false
          // Editors and admins can always update status
          if (user.role === 'editor' || user.role === 'admin') return true
          // Organizers can only change status to draft or pending (e.g., submit for review)
          const targetStatus = data ?? siblingData?.status
          if (targetStatus === 'draft' || targetStatus === 'pending') return true
          return false
        },
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      label: 'Ablaufdatum',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
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
      ({ data }: { data?: any }) => {
        if (!data?.expiryDate) {
          const baseDate = data?.recurrence?.repeatUntil || data?.endDate || data?.startDate
          if (baseDate) {
            data.expiryDate = baseDate
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        const user = req.user as any
        if (!user) return data
        // Normalize recurrence: Payload expects a group object, not null
        if (data && 'recurrence' in (data as any) && (data as any).recurrence === null) {
          ;(data as any).recurrence = {}
        }
        // Note: organizer auto-assignment is now handled by field-level beforeValidate hook
        return data
      },
    ],
    afterChange: [
      async ({
        doc,
        operation,
        previousDoc,
        req,
      }: {
        doc: any
        operation: string
        previousDoc?: any
        req: PayloadRequest
      }) => {
        const transitionedToApproved =
          operation === 'update' &&
          doc?.status === 'approved' &&
          previousDoc?.status !== 'approved'

        if (!transitionedToApproved) {
          return
        }

        const recipients = resolveRecipientsFromEnv(
          process.env.EVENT_APPROVAL_NOTIFICATION_EMAILS ||
            process.env.CONTACT_RECIPIENT_EMAILS ||
            process.env.SMTP_USER,
        )

        if (!recipients.length) {
          req.payload?.logger?.warn?.(
            'EVENT_APPROVAL_NOTIFICATION_EMAILS is not configured. Skipping approval email.',
          )
          return
        }

        const startDate = doc?.startDate ? new Date(doc.startDate) : null
        const endDate = doc?.endDate ? new Date(doc.endDate) : null
        const dateFormatter = new Intl.DateTimeFormat('de-DE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })

        const formattedStart = startDate ? dateFormatter.format(startDate) : 'unbekannt'
        const formattedEnd = endDate ? dateFormatter.format(endDate) : undefined

        const organizerName =
          typeof doc?.organizer === 'object' && doc.organizer
            ? doc.organizer.name || doc.organizer.title || doc.organizer.id
            : doc?.organizer

        const locationName =
          typeof doc?.location === 'object' && doc.location
            ? doc.location.name || doc.location.title || doc.location.id
            : doc?.location

        const plainLines = [
          `Titel: ${doc?.title ?? 'Unbekannt'}`,
          `Status: ${doc?.status}`,
          `Start: ${formattedStart}`,
        ]

        if (formattedEnd) {
          plainLines.push(`Ende: ${formattedEnd}`)
        }

        if (organizerName) {
          plainLines.push(`Veranstalter: ${organizerName}`)
        }

        if (locationName) {
          plainLines.push(`Ort: ${locationName}`)
        }

        const htmlLines = [`<p>Die Veranstaltung <strong>${doc?.title ?? 'Unbekannt'}</strong> wurde soeben freigegeben.</p>`, '<ul>']
        htmlLines.push(`<li><strong>Status:</strong> ${doc?.status}</li>`)
        htmlLines.push(`<li><strong>Start:</strong> ${formattedStart}</li>`)

        if (formattedEnd) {
          htmlLines.push(`<li><strong>Ende:</strong> ${formattedEnd}</li>`)
        }

        if (organizerName) {
          htmlLines.push(`<li><strong>Veranstalter:</strong> ${organizerName}</li>`)
        }

        if (locationName) {
          htmlLines.push(`<li><strong>Ort:</strong> ${locationName}</li>`)
        }

        htmlLines.push('</ul>')

        const adminUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL
          ? `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin/collections/events/${doc?.id}`
          : undefined

        if (adminUrl) {
          plainLines.push(`Link zur Veranstaltung im Admin: ${adminUrl}`)
        }

        const textBody = plainLines.join('\n')

        if (adminUrl) {
          htmlLines.push(`<p><a href="${adminUrl}">Zur Veranstaltung im Admin-Bereich</a></p>`)
        }

        const result = await sendEmail({
          to: recipients,
          subject: `Veranstaltung freigegeben: ${doc?.title ?? 'Ohne Titel'}`,
          text: textBody,
          html: htmlLines.join('\n'),
        })

        if (!result.success) {
          req.payload?.logger?.error?.(
            `E-Mail-Benachrichtigung für Veranstaltung ${doc?.id} fehlgeschlagen: ${result.error}`,
          )
        }
      },
    ],
  },
  timestamps: true,
}

export default Events

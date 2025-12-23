import type { CollectionConfig } from 'payload'

const isStrongPassword = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  if (value.length < 12) return false
  const hasUpper = /[A-Z]/.test(value)
  const hasLower = /[a-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSpecial = /[^A-Za-z0-9]/.test(value)
  return hasUpper && hasLower && hasNumber && hasSpecial
}

export const ENFORCED_DEFAULT_ROLE = 'organizer'
const isProduction = process.env.NODE_ENV === 'production'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: ({ req }) => {
      // Only admins can list/read other users; everyone else may read only their own document
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { id: { equals: (req.user as any).id } } as any
    },
    create: () => true,
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      // Allow users to update their own profile (e.g., password)
      return { id: { equals: (req.user as any).id } } as any
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'organizationNames', 'emailVerified', 'disabled'],
    group: 'Verwaltung',
  },
  auth: {
    tokenExpiration: 1800, // 30 minutes in seconds
    cookies: {
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, originalDoc }) => {
        // Backfill role for legacy users that were created before the role field existed.
        // Without this, updating auth-managed fields (e.g., resetPasswordToken) could fail
        // validation with "Role is required" for those legacy docs.
        if (operation === 'update') {
          const hasIncomingRole = data && Object.prototype.hasOwnProperty.call(data, 'role')
          const existingRole = (originalDoc as any)?.role
          if (!hasIncomingRole && (existingRole === undefined || existingRole === null || existingRole === '')) {
            ;(data as any).role = ENFORCED_DEFAULT_ROLE
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, req, operation, originalDoc }) => {
        if (!data) return data

        if (operation === 'create') {
          // Only admins may choose a custom role; everyone else is forced to organizer.
          if (req.user?.role === 'admin') {
            if (!data.role) {
              data.role = ENFORCED_DEFAULT_ROLE
            }
          } else {
            data.role = ENFORCED_DEFAULT_ROLE
          }
        } else if (operation === 'update' && req.user?.role !== 'admin') {
          // Non-admins cannot change role, but legacy users may have no role stored.
          // If incoming update tries to set role, drop it.
          if ('role' in data) {
            delete (data as any).role
          }
          // If the existing document has no role at all, set a default so validation passes.
          const existingRole = (originalDoc as any)?.role
          if (existingRole === undefined || existingRole === null || existingRole === '') {
            ;(data as any).role = ENFORCED_DEFAULT_ROLE
          }
        }

        // Enforce strong password if present (create or update)
        if (data.password && !isStrongPassword(data.password)) {
          throw new Error(
            'Password must be at least 12 characters and include upper, lower, number, and special character.',
          )
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'organizations',
      label: 'Organisationen',
      type: 'relationship',
      relationTo: 'organizations',
      hasMany: true,
      required: false,
      admin: {
        description: 'Organisationen, denen dieser Benutzer angehört. Bestimmt welche Orte zur Veranstaltungserstellung verfügbar sind.',
        allowCreate: false, // Disable inline creation to avoid React error
      },
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    // Virtual field for displaying organization names in list view
    {
      name: 'organizationNames',
      type: 'text',
      label: 'Organisationen (Namen)',
      admin: {
        readOnly: true,
        hidden: true, // Hide from edit form, shown in list
      },
      virtual: true,
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.organizations || !Array.isArray(data.organizations) || data.organizations.length === 0) {
              return ''
            }
            // Organizations may be IDs or populated objects
            const names: string[] = []
            for (const org of data.organizations) {
              if (typeof org === 'object' && org?.name) {
                names.push(org.name)
              } else if (typeof org === 'string') {
                try {
                  const orgDoc = await req.payload.findByID({
                    collection: 'organizations',
                    id: org,
                    depth: 0,
                    overrideAccess: true,
                  })
                  if (orgDoc?.name) names.push(orgDoc.name)
                } catch {
                  // ignore
                }
              }
            }
            return names.join(', ')
          },
        ],
      },
    },
    {
      name: 'disabled',
      label: 'Zugang deaktiviert',
      type: 'checkbox',
      defaultValue: false,
      access: {
        // Only admin may disable/enable accounts
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'emailVerified',
      label: 'Email Verified',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true },
    },
    {
      name: 'emailVerification',
      label: 'Email Verification',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        {
          name: 'tokenHash',
          type: 'text',
        },
        {
          name: 'expiresAt',
          type: 'date',
        },
        {
          name: 'lastSentAt',
          type: 'date',
          admin: { description: 'Zeitpunkt der letzten Verifikationsmail' },
        },
      ],
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: false,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: ENFORCED_DEFAULT_ROLE,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Organizer',
          value: ENFORCED_DEFAULT_ROLE,
        },
      ],
      access: {
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}

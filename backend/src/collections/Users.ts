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
    defaultColumns: ['email', 'name', 'role', 'organization'],
  },
  auth: {
    cookies: {
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
    },
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
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
          delete data.role
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
      name: 'organization',
      label: 'Organisation',
      type: 'relationship',
      relationTo: 'organizations',
      required: false,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
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

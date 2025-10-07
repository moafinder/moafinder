import type { CollectionConfig, PayloadRequest } from 'payload'

const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: '../uploads',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
  },
  access: {
    read: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      return {
        owner: {
          equals: user.id,
        },
      } as any
    },
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    delete: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      return {
        owner: {
          equals: user.id,
        },
      } as any
    },
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
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
    },
  ],
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (!data || !req.user) return data
      if (operation === 'create') {
        data.owner = req.user.id
      }
      return data
    }],
  },
}

export default Media

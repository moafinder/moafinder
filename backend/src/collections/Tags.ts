import { CollectionConfig } from 'payload';

const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'editor' || user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'editor' || user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Kategorie',
      options: [
        { label: 'Zielgruppe', value: 'target' },
        { label: 'Thema', value: 'topic' },
        { label: 'Format', value: 'format' },
      ],
    },
    {
      name: 'color',
      type: 'text',
      label: 'Farbe (Hex)',
      admin: {
        description: 'z.B. #7CB92C',
      },
    },
  ],
};

export default Tags;
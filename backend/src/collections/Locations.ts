import { CollectionConfig } from 'payload/types';

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'address'],
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
      label: 'Voller Name des Ortes',
    },
    {
      name: 'shortName',
      type: 'text',
      required: true,
      maxLength: 40,
      label: 'Kurzform des Ortsnamens',
      admin: {
        description: 'Erscheint im Filtermenü und in der Karte',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschreibung',
      maxLength: 1000,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Foto vom Ort',
    },
    {
      name: 'address',
      type: 'group',
      label: 'Adresse',
      fields: [
        { name: 'street', type: 'text', required: true, label: 'Straße' },
        { name: 'number', type: 'text', required: true, label: 'Hausnummer' },
        { name: 'postalCode', type: 'text', required: true, label: 'PLZ' },
        { name: 'city', type: 'text', defaultValue: 'Berlin', label: 'Stadt' },
      ],
    },
    {
      name: 'coordinates',
      type: 'point',
      label: 'GPS Koordinaten',
    },
    {
      name: 'mapPosition',
      type: 'group',
      label: 'Position auf der Karte',
      admin: {
        description: 'X und Y Position in Prozent (0-100)',
      },
      fields: [
        { name: 'x', type: 'number', min: 0, max: 100, label: 'X Position (%)' },
        { name: 'y', type: 'number', min: 0, max: 100, label: 'Y Position (%)' },
      ],
    },
    {
      name: 'openingHours',
      type: 'text',
      label: 'Öffnungszeiten',
    },
  ],
  timestamps: true,
};

export default Locations;
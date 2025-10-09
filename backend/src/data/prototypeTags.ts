import type { Tag } from '../payload-types'

type PrototypeTag = Pick<Tag, 'name' | 'category' | 'color'>

export const PROTOTYPE_TAGS: PrototypeTag[] = [
  // Zielgruppen
  { name: 'Kinder', category: 'target', color: '#7CB92C' },
  { name: 'Jugendliche', category: 'target', color: '#F97316' },
  { name: 'Erwachsene', category: 'target', color: '#2563EB' },
  { name: 'Inklusion', category: 'target', color: '#14B8A6' },

  // Formate & Besonderheiten
  { name: 'Einmalig', category: 'format', color: '#6366F1' },
  { name: 'Regelmäßig', category: 'format', color: '#EC4899' },
  { name: 'Umsonst', category: 'format', color: '#FBBF24' },

  // Themenbegriffe aus dem Prototyp
  { name: 'Sport & Action', category: 'topic', color: '#1D4ED8' },
  { name: 'Essen & Trinken', category: 'topic', color: '#B45309' },
  { name: 'Baby & Familie', category: 'topic', color: '#DB2777' },
  { name: 'Natur & Tiere', category: 'topic', color: '#059669' },
  { name: 'Spielen & Probieren', category: 'topic', color: '#2563EB' },
  { name: 'Kunst & Kreativität', category: 'topic', color: '#7C3AED' },
  { name: 'Musik & Gesang', category: 'topic', color: '#8B5CF6' },
  { name: 'Begegnung & Party', category: 'topic', color: '#F97316' },
  { name: 'Tanz & Darstellung', category: 'topic', color: '#EC4899' },
  { name: 'Theater & Kino', category: 'topic', color: '#7C3AED' },
  { name: 'Ausstellungen & Medien', category: 'topic', color: '#0EA5E9' },
  { name: 'Kultur & Sprache', category: 'topic', color: '#0284C7' },
  { name: 'Religion & Spiritualität', category: 'topic', color: '#22C55E' },
  { name: 'Politik & Einsatz', category: 'topic', color: '#EA580C' },
  { name: 'Vielfalt & Akzeptanz', category: 'topic', color: '#6366F1' },
  { name: 'Bunt & Queer', category: 'topic', color: '#A855F7' },
  { name: 'FLINTA & Community', category: 'topic', color: '#EC4899' },
  { name: 'Frauen & Stärke', category: 'topic', color: '#F472B6' },
  { name: 'Flucht & Migration', category: 'topic', color: '#0EA5E9' },
  { name: 'Antirassismus & Empowerment', category: 'topic', color: '#0F172A' },
  { name: 'Beratung & Bildung', category: 'topic', color: '#2563EB' },
  { name: 'Netzwerk & Selbsthilfe', category: 'topic', color: '#10B981' },
]

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EntryCard from '../components/EntryCard';

/**
 * Page for listing content entries (e.g. articles, news, events). Provides
 * simple filtering by category and search functionality. Replace the
 * dummy data with real entries from your CMS once available.
 */
const EntriesList = () => {
  const entries = [
    {
      id: 1,
      title: 'Moabit im Wandel – Neue Projekte 2025',
      date: '2025-07-20',
      category: 'News',
      excerpt: 'Die Stadtteilinitiative Moabit plant zahlreiche neue Projekte für das Jahr 2025. In diesem Artikel erfahren Sie, welche Veränderungen bevorstehen...',
      image: 'https://source.unsplash.com/400x300/?news',
    },
    {
      id: 2,
      title: 'Konzert im Park – Musik unter freiem Himmel',
      date: '2025-08-05',
      category: 'Event',
      excerpt: 'Am kommenden Wochenende findet im Fritz-Schloss-Park ein kostenloses Open-Air-Konzert statt. Wir stellen Ihnen die Künstler vor...',
      image: 'https://source.unsplash.com/400x300/?concert',
    },
    {
      id: 3,
      title: 'Geschichte Moabits – Eine Reise durch die Zeit',
      date: '2025-06-10',
      category: 'Artikel',
      excerpt: 'Von der Industriegeschichte bis zu den heutigen kulturellen Highlights – wir werfen einen Blick auf die spannende Vergangenheit des Bezirks Moabit...',
      image: 'https://source.unsplash.com/400x300/?history',
    },
  ];

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = Array.from(new Set(entries.map((e) => e.category)));

  const filtered = entries.filter((entry) => {
    const matchesCategory = category ? entry.category === category : true;
    const matchesSearch = entry.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Aktuelle Einträge</h1>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
        <input
          type="text"
          className="md:flex-grow border border-gray-300 rounded px-3 py-2 mb-2 md:mb-0"
          placeholder="Suche nach Titel"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Alle Kategorien</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Keine Einträge gefunden.</p>
      )}
    </div>
  );
};

export default EntriesList;
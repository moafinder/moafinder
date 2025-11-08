import React from 'react';
import { useParams, Link } from 'react-router-dom';

/**
 * Detail view for a single entry. Shows the complete article text,
 * images, publication date and any additional metadata. Replace the
 * mock data with dynamic content loaded by id from your backend.
 */
const EntryDetail = () => {
  const { id } = useParams();
  const entryId = parseInt(id, 10);

  const entries = [
    {
      id: 1,
      title: 'Moabit im Wandel – Neue Projekte 2025',
      date: '2025-07-20',
      category: 'News',
      image: 'https://source.unsplash.com/800x600/?news',
      content:
        'Die Stadtteilinitiative Moabit plant zahlreiche neue Projekte für das Jahr 2025.\n\nIn diesem ausführlichen Bericht erfahren Sie alles über die geplanten Bauvorhaben, kulturellen Initiativen und sozialen Programme, die in den kommenden Monaten umgesetzt werden sollen.\n\nVon der Modernisierung der Infrastruktur bis hin zur Förderung von gemeinschaftlichen Aktivitäten – Moabit steht vor einem spannenden Wandel.',
    },
    {
      id: 2,
      title: 'Konzert im Park – Musik unter freiem Himmel',
      date: '2025-08-05',
      category: 'Event',
      image: 'https://source.unsplash.com/800x600/?concert',
      content:
        'Am kommenden Wochenende findet im Fritz‑Schloss‑Park ein kostenloses Open‑Air‑Konzert statt.\n\nDas Programm umfasst klassische Musik, Jazz und moderne Popmusik. Besucher können sich auf ein vielfältiges Line‑up von lokalen und internationalen Künstlern freuen.\n\nBringen Sie eine Picknickdecke mit und genießen Sie einen entspannten Abend unter freiem Himmel.',
    },
    {
      id: 3,
      title: 'Geschichte Moabits – Eine Reise durch die Zeit',
      date: '2025-06-10',
      category: 'Artikel',
      image: 'https://source.unsplash.com/800x600/?history',
      content:
        'Von der Industriegeschichte bis zu den heutigen kulturellen Highlights – wir werfen einen Blick auf die spannende Vergangenheit des Bezirks Moabit.\n\nErfahren Sie, wie sich der Stadtteil im Laufe der Jahrzehnte verändert hat und welche Ereignisse seine Entwicklung geprägt haben.\n\nDiese historische Reise zeigt, warum Moabit heute ein einzigartiger und vielfältiger Ort ist.',
    },
  ];

  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Eintrag nicht gefunden</h2>
        <Link to="/entries" className="text-brand hover:underline">Zurück zur Übersicht</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/entries" className="text-brand hover:underline">← Zurück zur Übersicht</Link>
      <article className="mt-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{entry.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {new Date(entry.date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          · {entry.category}
        </p>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img
          src={entry.image}
          alt={entry.title}
          className="w-full h-64 object-cover rounded-lg mb-6 shadow"
        />
        {entry.content
          .split('\n\n')
          .map((paragraph, index) => (
            <p key={index} className="mb-4 leading-relaxed text-gray-700">
              {paragraph}
            </p>
          ))}
      </article>
    </div>
  );
};

export default EntryDetail;

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

/**
 * Event Detail Page matching the Figma design
 * Shows full event information including:
 * - Event title and metadata
 * - Full description
 * - Location details
 * - Contact information
 * - Theme tags
 * - Accessibility information
 */
const EventDetailPage = () => {
  const { id } = useParams();
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  
  // Sample event data - replace with API call
  const event = {
    id: id,
    title: 'EVENTTITEL MAX 40 ZEICHEN',
    location: 'Ort oder Lokal',
    shortLocation: 'Kurzform',
    date: '24.04.2025',
    time: '21:00 Uhr',
    type: 'wöchentliches Angebot',
    description: `Tanzt in den Donnerstag! Jeden Donnerstagabend verwandelt sich ein charmanter Ort in Moabit ab 21 Uhr in eine lebendige Tanzfläche für alle, die sich gerne bewegen. Unser wöchentlicher Tanzabend kennt keine Genregrenzen. Egal, ob dein Herz für südamerikanische Rhythmen schlägt, du elegante Walzer liebst oder dich im modernen Tanz ausdrücken möchtest – hier findest du den passenden Sound und Gleichgesinnte. Die Atmosphäre ist entspannt und offen. Hier treffen sich Menschen jeden Alters und mit unterschiedlichem Tanzerfahrung. Scheue dich nicht, auch wenn du Anfänger bist! Bei uns geht es um die pure Freude an der Bewegung, die verbindende Kraft der Musik und das Miteinander. Nutze die Gelegenheit, neue Kontakte zu knüpfen, Freundschaften zu schließen und einfach einen unbeschwerten Abend zu genießen. Unser Donnerstag ist mehr als nur ein Tanzabend – er ist ein wöchentliches Ritual, eine willkommene Auszeit vom Alltag, ein Ort, um die Seele durch den Tanz baumeln zu lassen.`,
    fullDescription: 'Die Teilnahme ist kostenfrei.\n\nEine Voranmeldung ist nicht nötig.\n\nWir sprechen: Deutsch, Englisch, Spanisch, Russisch.\n\nDie Inklusion bezieht sich bei diesem Angebot ausschließlich auf eine rollstuhlgerechte räumliche Umgebung.',
    image: '/api/placeholder/800/400',
    themes: ['Tanz & Darstellung', 'Musik & Gesang', 'Begegnung & Party', 'Kultur & Sprache'],
    targetAudience: ['Jugendliche', 'Erwachsene'],
    free: true,
    inclusion: true,
    address: {
      name: 'Voller Name des Veranstaltungsortes',
      street: 'Musterstraße 123',
      plz: '10553',
      city: 'Berlin'
    },
    organizer: {
      name: 'Bezeichnung des Anbieters',
      contact: 'kontakt@angebot.de',
      website: 'www.homepage.de'
    },
    moreInfo: 'www.url-des-events.de'
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/formate" className="text-gray-600 hover:text-[#7CB92C] transition-colors duration-300">
            ← Formate
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span className="font-semibold">{event.location} ({event.shortLocation})</span>
                <span>•</span>
                <span>Do {event.date} / {event.time}</span>
                <span>•</span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{event.type}</span>
              </div>
            </div>
            {isLoggedIn && (
              <button className="p-2 hover:bg-gray-100 rounded transition-colors duration-300">
                <svg className="w-6 h-6 text-[#7CB92C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Event Image */}
            <div className="mb-6">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>

            {/* Event Description */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                <span className="font-semibold">65 Lettern: Hier ist ein Veranstaltungstext mit etwa 1000 Zeichen</span>
                <br /><br />
                {event.description}
              </p>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line">{event.fullDescription}</p>
            </div>

            {/* More Info Link */}
            {event.moreInfo && (
              <div className="mt-6">
                <p className="text-sm text-gray-600">
                  Mehr Infos hier:{' '}
                  <a 
                    href={`https://${event.moreInfo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7CB92C] font-bold hover:text-[#5a8b20] transition-colors duration-300"
                  >
                    {event.moreInfo}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Target Audience */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Angebot für:</h3>
              <div className="flex flex-wrap gap-2">
                {event.targetAudience.map((audience) => (
                  <span key={audience} className="bg-white px-3 py-1 rounded-md text-sm">
                    {audience}
                  </span>
                ))}
                {event.free && (
                  <span className="bg-[#7CB92C] text-white px-3 py-1 rounded-md text-sm">
                    umsonst
                  </span>
                )}
              </div>
            </div>

            {/* Themes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Themen:</h3>
              <div className="flex flex-wrap gap-2">
                {event.themes.map((theme) => (
                  <span key={theme} className="bg-white px-3 py-1 rounded-md text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Adresse:</h3>
              <p className="text-[#7CB92C] font-bold">{event.address.name}</p>
              <p className="text-sm text-gray-600">
                {event.address.street}<br />
                {event.address.plz} {event.address.city}
              </p>
            </div>

            {/* Organizer */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Angeboten von:</h3>
              <p className="text-sm">{event.organizer.name}</p>
              <a 
                href={`mailto:${event.organizer.contact}`}
                className="text-[#7CB92C] text-sm hover:text-[#5a8b20] transition-colors duration-300"
              >
                {event.organizer.contact}
              </a>
              <br />
              <a 
                href={`https://${event.organizer.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7CB92C] text-sm hover:text-[#5a8b20] transition-colors duration-300"
              >
                {event.organizer.website}
              </a>
            </div>

            {/* Action Button */}
            <button className="w-full bg-[#7CB92C] text-white font-bold py-3 px-4 rounded-md hover:bg-[#5a8b20] transition-all duration-300 transform hover:scale-[1.02]">
              Eintrag freigeben
            </button>
          </div>
        </div>

        {/* Partner Logos */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 mb-4">Dies ist ein Kooperationsprojekt von:</p>
          <div className="flex justify-center items-center space-x-8 mb-8">
            <a href="https://moabiter-ratschlag.de/orte/kiez-machen-mobile-stadtteilarbeit-in-moabit/" target="_blank" rel="noopener noreferrer">
              <div className="bg-pink-500 text-white px-4 py-2 rounded font-bold">KIEZ MACHEN</div>
            </a>
            <a href="https://www.refo-moabit.de/" target="_blank" rel="noopener noreferrer">
              <div className="text-black font-bold text-2xl">refo</div>
            </a>
          </div>
          
          <p className="text-center text-gray-600 mb-4">Der MoaFinder wurde gefördert durch:</p>
          {/* Partner logos would go here */}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
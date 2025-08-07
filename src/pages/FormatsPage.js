import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNewspaper,
  faCalendarAlt,
  faBookOpen,
  faCameraRetro,
} from '@fortawesome/free-solid-svg-icons';
import FilterBar from '../components/FilterBar';
import neusteArrow from '../assets/neuste.png';
import heuteArrow from '../assets/heute.png';
import headerGraphic from '../assets/header_grafik_klein.png';

/**
 * Formats page lists the different types of content or categories
 * available on the platform. Icons help users visually distinguish
 * between formats. Extend this list with additional formats as
 * required by the prototype and CMS.
 */
const formats = [
  {
    name: 'News',
    description: 'Aktuelle Neuigkeiten und kurze Updates.',
    icon: faNewspaper,
  },
  {
    name: 'Event',
    description: 'Informationen zu kommenden Veranstaltungen.',
    icon: faCalendarAlt,
  },
  {
    name: 'Artikel',
    description: 'Längere redaktionelle Inhalte, Interviews und Reportagen.',
    icon: faBookOpen,
  },
  {
    name: 'Fotostrecke',
    description: 'Sammlung von Fotos und visuellen Eindrücken.',
    icon: faCameraRetro,
  },
];

const FormatsPage = () => {
  // Dummy event data. Replace with real data from your CMS.
  const latestEvents = [
    {
      id: 1,
      date: '2025-05-07',
      time: '16:00–23:30 Uhr',
      place: 'Refo Moabit',
      category: 'Begegnung & Party, Essen & …',
      type: 'einmalige Veranstaltung',
      title: 'Friedensfest statt kriegstüchtig | Demo auf der Beusselstraße',
      excerpt:
        'Friedensfest statt kriegstüchtig | Demo auf der Beusselstraße 16 Uhr | Family | Schnippelparty & Kinderprogramm 18 Uhr | Demo | Friedensfestessen 20 Uhr | Party | Spoken Word, Konzerte, DJ …',
      color: 'bg-purple-600',
    },
    {
      id: 2,
      date: '2025-06-14',
      time: '11:00–22:00 Uhr',
      place: 'Schulgarten',
      category: 'Kultur & Sprache, Begegnung …',
      type: 'einmalige Veranstaltung',
      title: 'Sommerfest für Groß und Klein',
      excerpt:
        'Zwischen blühenden Blumen und unter Blätterdächern warten Kreativangebote, Kaffee, Kuchen und die Geschichtenwerkstatt…',
      color: 'bg-yellow-500',
    },
    {
      id: 3,
      date: '2025-07-24',
      time: '23:00 Uhr',
      place: 'ZK/U',
      category: 'Musik & Gesang, Begegnung & …',
      type: 'regelmäßiges Angebot',
      title: 'Lorem ipsum dolor sit amet',
      excerpt:
        'Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel…',
      color: 'bg-red-600',
    },
  ];
  const todayEvents = [
    {
      id: 4,
      date: '2025-04-24',
      time: '09:30–11:00 Uhr',
      place: 'Stephans – Der Nachbarschaftsl',
      category: 'Kunst & Kreativität',
      type: 'regelmäßiges Angebot',
      title: 'Zeichnen und Malen im Stephans',
      excerpt:
        'Wir erkunden und erobern die verschiedenen Möglichkeiten der Ausdrucksmittel. Verschiedene Künstler, Ausstellungen und…',
      color: 'bg-green-400',
    },
    {
      id: 5,
      date: '2025-04-24',
      time: '20:00 Uhr',
      place: 'Kallash &',
      category: 'Musik & Gesang',
      type: 'regelmäßiges Angebot',
      title: 'Freiraum – Open Mic!',
      excerpt:
        'Ab jetzt wieder jeden letzten Donnerstag im Monat! Jeder spielt zwei Lieder oder bekommt 10 Minuten of fame!',
      color: 'bg-orange-500',
    },
    {
      id: 6,
      date: '2025-04-24',
      time: '15:00 Uhr',
      place: 'In der Nachbarschaft',
      category: 'Bunt & Queer, Vielfalt & …',
      type: 'einmalige Veranstaltung',
      title: 'Into the Blue',
      excerpt:
        'Jeder ist eingeladen. Wir treffen uns vor dem Arena und ziehen dann gemeinsam weiter mit Musik und kunterbunter Laune…',
      color: 'bg-pink-500',
    },
    {
      id: 7,
      date: '2025-04-24',
      time: '14:30–21:00 Uhr',
      place: 'Ort oder Lokal',
      category: 'Thema & Interessen',
      type: 'einmalige Veranstaltung',
      title: 'Event‑Name',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy eirmod tempor invidunt ut labore et dolore magna…',
      color: 'bg-purple-500',
    },
    {
      id: 8,
      date: '2025-04-24',
      time: '',
      place: 'Ort oder Lokal',
      category: 'Thema & Interessen',
      type: 'regelmäßiges Angebot',
      title: 'Event‑Name',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy eirmod tempor invidunt ut labore et dolore magna…',
      color: 'bg-pink-300',
    },
  ];

  const renderEventRow = (event) => (
    <div key={event.id} className="flex border-b py-4">
      {/* Left coloured block representing the event or image */}
      <div className={`w-1/5 h-24 md:h-28 flex-shrink-0 ${event.color} text-white flex items-center justify-center text-xs font-semibold p-1 overflow-hidden`}>
        {/* Could place event title or leave blank */}
        {/* <span className="text-center">Bild</span> */}
      </div>
      <div className="w-4/5 pl-4">
        <p className="text-sm text-gray-600">
          {new Date(event.date).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
          {event.time && ` / ${event.time}`}
          &nbsp;&nbsp;
          <span className="font-semibold text-gray-800">
            {event.category}
          </span>
          &nbsp;
          <span className="text-xs text-gray-500">{event.type}</span>
        </p>
        <h3 className="font-bold text-gray-800 mt-1 mb-1">{event.place}</h3>
        <p className="text-sm font-semibold text-gray-800 mb-1">{event.title}</p>
        <p className="text-sm text-gray-600 overflow-hidden">
          {event.excerpt}
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero banner */}
      <div className="mb-6 text-center">
        <img
          src={headerGraphic}
          alt="MoaFinder Banner"
          className="mx-auto w-auto h-32 md:h-40 object-contain"
        />
        <p className="text-xl md:text-2xl font-semibold mt-2">
          Meine Mitte ist Moabit
        </p>
      </div>
      {/* Filter bar */}
      <FilterBar onFilterChange={() => {}} />
      {/* Formats icon grid can still be displayed or removed. We'll keep it for information */}
      <h2 className="text-2xl font-bold mb-4">Unsere Formate</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {formats.map(({ name, description, icon }) => (
          <div key={name} className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center h-12 w-12 mx-auto mb-4 text-[#7CB92C]">
              <FontAwesomeIcon icon={icon} size="2x" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{name}</h3>
            <p className="text-sm text-gray-700">{description}</p>
          </div>
        ))}
      </div>
      {/* Latest events section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <img src={neusteArrow} alt="Neuste" className="h-6 w-auto mr-2" />
          <h3 className="text-2xl font-bold">Neuste</h3>
        </div>
        <div className="divide-y">
          {latestEvents.map((event) => renderEventRow(event))}
        </div>
      </div>
      {/* Today events section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <img src={heuteArrow} alt="Heute" className="h-6 w-auto mr-2" />
          <h3 className="text-2xl font-bold">Heute</h3>
        </div>
        <div className="divide-y">
          {todayEvents.map((event) => renderEventRow(event))}
        </div>
      </div>
    </div>
  );
};

export default FormatsPage;
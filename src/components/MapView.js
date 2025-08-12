// src/components/MapView.js

import React, { useState, useEffect, useRef } from 'react';
import { PLACES } from '../data/mockData';
import mapImage from '../assets/Moabit.png';
import arrowGreen from '../assets/pfad_pfeil.png';
import arrowYellow from '../assets/pfad_pfeil_hover.png';

const MapView = ({ onPlaceSelect }) => {
  const [hoveredPlace, setHoveredPlace] = useState(null);
  const mapRef = useRef(null);

  const getMarkerPosition = (place) => {
    const positions = {
      1: { left: '15%', top: '35%' }, 2: { left: '25%', top: '20%' }, 3: { left: '35%', top: '40%' },
      4: { left: '45%', top: '25%' }, 5: { left: '50%', top: '50%' }, 6: { left: '60%', top: '30%' },
      7: { left: '20%', top: '60%' }, 8: { left: '70%', top: '35%' }, 9: { left: '30%', top: '70%' },
      10: { left: '55%', top: '55%' }, 11: { left: '40%', top: '45%' }, 12: { left: '65%', top: '50%' },
      13: { left: '68%', top: '52%' }, 14: { left: '10%', top: '25%' }, 15: { left: '35%', top: '65%' },
      16: { left: '45%', top: '40%' }, 17: { left: '25%', top: '75%' }, 18: { left: '50%', top: '35%' },
      19: { left: '15%', top: '50%' }, 20: { left: '5%', top: '30%' }, 21: { left: '38%', top: '55%' },
      22: { left: '42%', top: '38%' }, 23: { left: '58%', top: '42%' },
    };
    return positions[place.id] || { left: '50%', top: '50%' };
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">HIER FINDET IHR EURE MITTE IN MOABIT</h2>
      <p className="mb-4">
        So und so viele Standorte, an denen Veranstaltungen und Angebotsreihen für euch stattfinden, 
        sind im Moafinder aktuell erfasst. Einfach einen Wimpel in der interaktiven Karte auswählen 
        und anklicken oder unten im Ortsmenü aufrufen und schwups: der Ort stellt sich euch vor.
      </p>

      <div className="flex justify-end mb-2">
        <a href="mailto:moafinder@moabit.world" className="text-green-600 hover:text-green-800 font-semibold">
          Neuen Standort melden
        </a>
      </div>

      {/* Interactive Map */}
      <div className="relative w-full bg-blue-500 rounded-lg overflow-hidden" ref={mapRef}>
        <img src={mapImage} alt="Moabit Karte" className="w-full h-auto" />

        {/* Place markers */}
        {PLACES.map((place) => {
          const position = getMarkerPosition(place);
          const isHovered = hoveredPlace === place.id;
          const isMobile = place.isMobile;

          return (
            <div
              key={place.id}
              role="button"
              tabIndex={0}
              className={`absolute cursor-pointer transform transition-all duration-200 ${
                isHovered ? 'scale-125 z-10' : 'scale-100'
              }`}
              style={{
                left: position.left,
                top: position.top,
                transform: 'translate(-50%, -100%)',
              }}
              onMouseEnter={() => setHoveredPlace(place.id)}
              onMouseLeave={() => setHoveredPlace(null)}
              onClick={() => onPlaceSelect(place)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPlaceSelect(place);
                }
              }}
            >
              {isMobile ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">*</span>
                </div>
              ) : (
                <img
                  src={isHovered ? arrowYellow : arrowGreen}
                  alt={place.shortName}
                  className="w-6 h-8"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Places list below map */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {PLACES.map((place) => (
          <button
            key={place.id}
            className={`text-left p-2 rounded transition-all duration-200 ${
              hoveredPlace === place.id
                ? 'bg-gray-100 font-bold text-lg'
                : 'hover:bg-gray-50'
            }`}
            onMouseEnter={() => setHoveredPlace(place.id)}
            onMouseLeave={() => setHoveredPlace(null)}
            onClick={() => onPlaceSelect(place)}
          >
            {place.shortName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapView;

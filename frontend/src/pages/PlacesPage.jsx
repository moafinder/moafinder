import React, { useState } from 'react';
import MapView from '../components/MapView';
import { useNavigate } from 'react-router-dom';

const PlacesPage = () => {
  const navigate = useNavigate();
  
  const handlePlaceSelect = (place) => {
    navigate(`/place/${place.id}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <MapView onPlaceSelect={handlePlaceSelect} />
    </div>
  );
};

export default PlacesPage;
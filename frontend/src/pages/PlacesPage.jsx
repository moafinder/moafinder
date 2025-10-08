import React, { useEffect, useState } from 'react';
import MapView from '../components/MapView';
import { useNavigate } from 'react-router-dom';
import { listLocations } from '../api/locations';
import { adaptLocation } from '../utils/dataAdapters';

const PlacesPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await listLocations({ limit: 200, depth: 1, sort: 'shortName' });
        const docs = Array.isArray(response?.docs) ? response.docs : [];
        if (!cancelled) {
          const adapted = docs
            .map(adaptLocation)
            .filter(Boolean);
          setLocations(adapted);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Orte konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);
  
  const handlePlaceSelect = (place) => {
    if (place?.id) {
      navigate(`/place/${place.id}`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <MapView places={locations} onPlaceSelect={handlePlaceSelect} loading={loading} />
    </div>
  );
};

export default PlacesPage;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await logout();
      } finally {
        navigate('/', { replace: true });
      }
    })();
  }, [logout, navigate]);

  return (
    <div className="container mx-auto px-4 py-10">
      <p className="text-sm text-gray-600">Du wirst abgemeldet …</p>
    </div>
  );
};

export default LogoutPage;


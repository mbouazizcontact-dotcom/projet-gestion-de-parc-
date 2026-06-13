import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useAlertCount = () => {
  const [count, setCount] = useState(0);
  const [hasNewAlerts, setHasNewAlerts] = useState(false);
  const location = useLocation();

  const updateCount = () => {
    const storedCount = parseInt(localStorage.getItem('newAlertsCount') || '0');
    const isAlertsPage = location.pathname === '/Alertes';
    setCount(storedCount);
    setHasNewAlerts(storedCount > 0 && !isAlertsPage);
  };

  useEffect(() => {
    updateCount();

    const handleStorageChange = (e) => {
      if (e.key === 'newAlertsCount') {
        updateCount();
      }
    };

    const handleAlertsUpdated = () => {
      updateCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('alertsUpdated', handleAlertsUpdated);

    // Vérification périodique de localStorage au cas où l'événement serait manqué
    const interval = setInterval(updateCount, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('alertsUpdated', handleAlertsUpdated);
      clearInterval(interval);
    };
  }, [location.pathname]);

  return { count, hasNewAlerts };
};

export default useAlertCount;
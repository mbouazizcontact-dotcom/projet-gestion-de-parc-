import { useState, useEffect, useMemo } from 'react';
import axios from '../../src/Components/axios/axiosConfig';

const defaultPermissions = {
  TableauDeBord: { creer: false, lire: true, modifier: false, supprimer: false },
  Conducteurs: { creer: false, lire: true, modifier: false, supprimer: false },
  Groupes: { creer: false, lire: true, modifier: false, supprimer: false },
  Vehicules: { creer: false, lire: true, modifier: false, supprimer: false },
  Calendrier: { creer: false, lire: true, modifier: false, supprimer: false },
  Carburant: { creer: false, lire: true, modifier: false, supprimer: false },
  Maintenance: { creer: false, lire: true, modifier: false, supprimer: false },
  TypesMaintenances: { creer: false, lire: true, modifier: false, supprimer: false },
  MaintenanceReparations: { creer: false, lire: true, modifier: false, supprimer: false },
  Alertes: { creer: false, lire: true, modifier: false, supprimer: false },
  Atelier: { creer: false, lire: true, modifier: false, supprimer: false },
  Garages: { creer: false, lire: true, modifier: false, supprimer: false },
  Mecaniciens: { creer: false, lire: true, modifier: false, supprimer: false },
  Pieces: { creer: false, lire: true, modifier: false, supprimer: false },
  PiecesEnStock: { creer: false, lire: true, modifier: false, supprimer: false },
  PiecesDemandees: { creer: false, lire: true, modifier: false, supprimer: false },
  HistoriqueDesReparations: { creer: false, lire: true, modifier: false, supprimer: false },
  Archives: { creer: false, lire: true, modifier: false, supprimer: false },
  FicheReceptions: { creer: true, lire: true, modifier: false, supprimer: false },
  FicheInterventions: { creer: false, lire: true, modifier: false, supprimer: false },
  Reclamations: { creer: false, lire: true, modifier: false, supprimer: false },
  Utilisateurs: { creer: true, lire: true, modifier: true, supprimer: true },
  Parametres: { creer: false, lire: true, modifier: false, supprimer: false },
};

const usePermissions = () => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
        }

        const response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedPermissions = response.data.permissions || {};

        const mergedPermissions = Object.keys(defaultPermissions).reduce((acc, key) => {
          acc[key] = {
            ...defaultPermissions[key],
            ...(fetchedPermissions[key] || {}),
          };
          return acc;
        }, {});

        setPermissions(mergedPermissions);
        localStorage.setItem('permissions', JSON.stringify(mergedPermissions));
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des permissions:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });

        setError(err.message || 'Impossible de charger les permissions');
        setPermissions(defaultPermissions);
        localStorage.setItem('permissions', JSON.stringify(defaultPermissions));

        if (err.response?.status === 401) {
          console.warn('Erreur 401, redirection vers /login dans 3s');
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    const storedPermissionsRaw = localStorage.getItem('permissions');
    if (storedPermissionsRaw) {
      try {
        const storedPermissions = JSON.parse(storedPermissionsRaw);

        const cleanedPermissions = Object.keys(storedPermissions).reduce((acc, key) => {
          if (defaultPermissions[key]) {
            acc[key] = {
              ...defaultPermissions[key],
              ...storedPermissions[key],
            };
          }
          return acc;
        }, {});


        const hasAllKeys = Object.keys(defaultPermissions).every(
          (key) => cleanedPermissions[key] && typeof cleanedPermissions[key] === 'object'
        );

        const currentPermissions = JSON.stringify(cleanedPermissions);
        const storedPermissionsStr = localStorage.getItem('permissions');
        if (hasAllKeys && currentPermissions !== storedPermissionsStr) {
          setPermissions(cleanedPermissions);
          localStorage.setItem('permissions', JSON.stringify(cleanedPermissions));
          setLoading(false);
        } else {
          setPermissions(cleanedPermissions);
          setLoading(false);
        }
      } catch (parseError) {
        console.error('Erreur lors du parsing de localStorage:', parseError);
        fetchPermissions();
      }
    } else {
      fetchPermissions();
    }

    return () => {
    };
  }, []);

  const hasPermission = useMemo(() => {
    return (resource, action) => {
      if (!permissions) {
        return false;
      }

      if (typeof resource === 'string' && !action) {
        const [res, act] = resource.split('.');
        const correctRes = Object.keys(defaultPermissions).find(
          (key) => key.toLowerCase() === res.toLowerCase()
        );
        if (!correctRes) {
          console.warn(`Clé de permission invalide: ${res}. Clés valides: ${Object.keys(defaultPermissions).join(', ')}`);
        }
        const hasAccess = correctRes ? permissions[correctRes]?.[act] ?? false : false;
        return hasAccess;
      }

      const correctResource = Object.keys(defaultPermissions).find(
        (key) => key.toLowerCase() === resource.toLowerCase()
      );
      if (!correctResource) {
        console.warn(`Clé de permission invalide: ${resource}. Clés valides: ${Object.keys(defaultPermissions).join(', ')}`);
      }
      const hasAccess = correctResource ? permissions[correctResource]?.[action] ?? false : false;
      return hasAccess;
    };
  }, [permissions]);

  return { permissions, loading, error, hasPermission };
};

export default usePermissions;
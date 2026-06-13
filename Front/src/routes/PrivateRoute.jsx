import { Navigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions'; // Adjust path as needed

const PrivateRoute = ({ requiredPermission, children }) => {
  const { permissions, loading } = usePermissions();
  const token = localStorage.getItem('token');


  if (loading) {
    return <div>Chargement...</div>; // Ou un composant de chargement
  }

  if (!token) {
    console.warn('PrivateRoute: Aucun token trouvé, redirection vers /');
    return <Navigate to="/login" />;
  }

  if (!permissions) {
    console.warn('PrivateRoute: Aucune permission disponible, redirection vers /unauthorized');
    return <Navigate to="/unauthorized" />;
  }


  if (requiredPermission) {
    if (Array.isArray(requiredPermission)) {
      const hasAllPermissions = requiredPermission.every((perm) => {
        const [module, action] = perm.split('.');
        if (!module || !action) {
          console.error(`PrivateRoute: Format de permission invalide: ${perm}`);
          return false;
        }
        const moduleKey = Object.keys(permissions).find(
          (key) => key.toLowerCase() === module.toLowerCase()
        );
        if (!moduleKey) {
          console.warn(`PrivateRoute: Module non trouvé: ${module}. Clés valides: ${Object.keys(permissions).join(', ')}`);
        }
        const hasPermission = moduleKey ? permissions[moduleKey]?.[action] === true : false;
        return hasPermission;
      });
      if (!hasAllPermissions) {
        console.warn('PrivateRoute: Permissions manquantes, redirection vers /unauthorized');
        return <Navigate to="/unauthorized" />;
      }
    } else {
      const [module, action] = requiredPermission.split('.');
      if (!module || !action) {
        console.error(`PrivateRoute: Format de permission invalide: ${requiredPermission}`);
        return <Navigate to="/unauthorized" />;
      }
      const moduleKey = Object.keys(permissions).find(
        (key) => key.toLowerCase() === module.toLowerCase()
      );
      if (!moduleKey) {
        console.warn(`PrivateRoute: Module non trouvé: ${module}. Clés valides: ${Object.keys(permissions).join(', ')}`);
      }
      const hasPermission = moduleKey ? permissions[moduleKey]?.[action] === true : false;
  
      if (!hasPermission) {
        console.warn(`PrivateRoute: Permission ${requiredPermission} manquante, redirection vers /unauthorized`);
        return <Navigate to="/unauthorized" />;
      }
    }
  }

  return children;
};

export default PrivateRoute;
/* global process */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast.error('Erreur lors de la récupération des utilisateurs');
    }
  };

  const generatePermissions = (role) => {
    const permissions = {
      reception: false,
      receptionFiche: false,
      demandePiece: false,
      demandePieceTable: false,
      receptionTable: false,
      receptionFicheTable: false,
      userTable: false,
      modifyPermissions: false,
    };

    switch (role) {
      case 'super admin':
        permissions.reception = true;
        permissions.receptionFiche = true;
        permissions.demandePiece = true;
        permissions.demandePieceTable = true;
        permissions.receptionTable = true;
        permissions.receptionFicheTable = true;
        permissions.userTable = true;
        permissions.modifyPermissions = true;
        break;
      case 'mecanicien':
        permissions.reception = true;
        permissions.receptionFiche = true;
        permissions.demandePiece = true;
        permissions.demandePieceTable = true;
        permissions.receptionTable = true;
        permissions.receptionFicheTable = true;
        break;
      case 'gestionnaire de parc':
        permissions.reception = true;
        permissions.receptionFiche = true;
        permissions.demandePiece = true;
        permissions.demandePieceTable = true;
        permissions.receptionTable = true;
        permissions.receptionFicheTable = true;
        break;
      default:
        break;
    }

    return permissions;
  };

  const handlePermissionChange = async (userId, permission, value) => {
    try {
      const userToUpdate = users.find(user => user._id === userId);
      
      // Vérifier si l'utilisateur actuel est un super admin
      const isCurrentUserSuperAdmin = currentUser.role === 'super admin';
      
      // Vérifier si l'utilisateur à modifier est un super admin
      const isTargetUserSuperAdmin = userToUpdate.role === 'super admin';
      
      // Empêcher la modification des permissions d'un autre super admin
      if (isTargetUserSuperAdmin && userToUpdate._id !== currentUser._id) {
        toast.error("Vous ne pouvez pas modifier les permissions d'un autre super admin");
        return;
      }

      // Vérifier si l'utilisateur actuel a la permission de modifier les permissions
      if (!isCurrentUserSuperAdmin) {
        toast.error("Vous n'avez pas la permission de modifier les permissions");
        return;
      }

      const updatedPermissions = {
        ...userToUpdate.permissions,
        [permission]: value,
      };

      const response = await axios.put(
        `${API_URL}/users/${userId}/permissions`,
        { permissions: updatedPermissions },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.status === 200) {
        setUsers(users.map(user =>
          user._id === userId
            ? { ...user, permissions: updatedPermissions }
            : user
        ));
        toast.success('Permissions mises à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      toast.error('Erreur lors de la mise à jour des permissions');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Permissions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <div className="flex items-center">
                        <div className="ml-3">
                          <p className="text-gray-900 whitespace-no-wrap">
                            {user.nom} {user.prenom}
                          </p>
                          <p className="text-gray-600 whitespace-no-wrap">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{user.role}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <div className="flex flex-col space-y-2">
                        {Object.entries(user.permissions || generatePermissions(user.role)).map(([permission, value]) => (
                          <div key={permission} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handlePermissionChange(user._id, permission, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              disabled={user.role === 'super admin' && String(user._id) !== String(currentUser._id)}
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              {permission}
                            </label>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable; 
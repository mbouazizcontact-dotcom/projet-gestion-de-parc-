/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import usePermissions from '../../hooks/usePermissions'; // Assurez-vous que ce chemin est correct
import LogoUploader from '../logo/LogoUploader';

const MySwal = withReactContent(Swal);

const Separator = ({ className = '' }) => {
  return <hr className={`border-t border-gray-200 my-4 ${className}`} />;
};

const Avatar = ({ src, alt, fallback }) => {
  return (
    <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full">
      {src ? (
        <img className="w-full h-full object-cover" src={src} alt={alt || "Avatar"} />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-300 text-gray-600">
          {fallback || alt?.charAt(0) || "U"}
        </div>
      )}
    </div>
  );
};

const Button = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  );
};

const Label = ({ children, className = '', ...props }) => {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
    </label>
  );
};

const Page3 = () => {
  const userId = localStorage.getItem("userId");
  const { permissions, loading, error, hasPermission } = usePermissions();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userDetails, setUserDetails] = useState({
    nom: '',
    email: '',
    telephone: '',
    Groupe: '',
  });
  const [logo, setLogo] = useState(localStorage.getItem('customLogo') || '/src/assets/car.png');

  useEffect(() => {
    if (!userId) {
      toast.error("Aucun ID utilisateur trouvé dans localStorage.");
      return;
    }
    if (!hasPermission('parametres', 'lire')) return;
    fetchClients();
  }, [userId, hasPermission]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Aucun token trouvé. Veuillez vous reconnecter.");
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      setUserDetails({
        nom: response.data.nom || '',
        email: response.data.email || '',
        telephone: response.data.telephone || '',
        Groupe: response.data.Groupe || '',
      });
    } catch (error) {
      console.error("Erreur lors de fetchClients:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération des informations.");
    }
  };

  const handleSubmit = async () => {
    if (!hasPermission("parametres", "modifier")) {
      toast.error("Vous n'avez pas la permission de modifier votre mot de passe.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas !");
      return;
    }
    try {
      const Data = { oldPassword: currentPassword, newPassword }; // Pas besoin de userId
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Aucun token trouvé. Veuillez vous reconnecter.");
        return;
      }
      const response = await axios.put(
        "http://localhost:5000/api/users/changer-mot-de-passe",
        Data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Mot de passe mis à jour avec succès !");
      }
    } catch (error) {
      console.error("Erreur complète :", error.response?.data);
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour du mot de passe !");
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    MySwal.fire({
      title: 'Confirmer le changement',
      text: "Êtes-vous sûr de vouloir changer votre mot de passe ?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        handleSubmit();
      }
    });
  };

  const handleSubmitUserDetails = async () => {
    if (!hasPermission("parametres", "modifier")) {
      toast.error("Vous n'avez pas la permission de modifier vos informations.");
      return;
    }
    try {
      const newData = {
        nom: userDetails.nom,
        email: userDetails.email,
        telephone: userDetails.telephone,
        Groupe: userDetails.Groupe,
      };
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        newData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        toast.success("Les informations ont été mises à jour avec succès !");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour des informations !");
    }
  };

  const handleChangeUserDetails = (e) => {
    e.preventDefault();
    MySwal.fire({
      title: 'Confirmer le changement',
      text: "Êtes-vous sûr de vouloir changer vos infos ?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        handleSubmitUserDetails();
      }
    });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setUserDetails((prevDetails) => ({
      ...prevDetails,
      [id]: value,
    }));
  };

  const handleLogoChange = (newLogo) => {
    setLogo(newLogo);
    // La mise à jour du localStorage est gérée dans le composant LogoUploader
  };

  const handleChangeLogo = () => {
    if (!hasPermission('parametres', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier le logo.");
      return;
    }
    
    // Cliquer sur l'input de fichier caché
    document.querySelector('input[type="file"]').click();
  };

  const handleResetLogo = () => {
    if (!hasPermission('parametres', 'modifier')) {
      toast.error("Vous n'avez pas la permission de réinitialiser le logo.");
      return;
    }

    MySwal.fire({
      title: 'Confirmer la réinitialisation',
      text: "Êtes-vous sûr de vouloir réinitialiser le logo ?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        // Cliquer sur le bouton de réinitialisation caché
        document.querySelector('.reset-logo-btn').click();
      }
    });
  };

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('parametres', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission d'accéder à cette page.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl mt-4 font-semibold text-gray-900 mb-6">Paramètres</h2>
          <Separator />
          
          {/* Section de personnalisation du logo - Design épuré, professionnel */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* Colonne de gauche - Logo et contrôles */}
                <div className="w-full sm:w-1/3 lg:w-1/4 flex flex-col items-center">
                  <div className="relative group w-full max-w-[140px]">
                    <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur group-hover:opacity-40 transition duration-200"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                      <LogoUploader 
                        currentLogo={logo} 
                        onLogoChange={handleLogoChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex w-full max-w-[160px] mt-3 justify-between">
                    <button 
                      onClick={handleChangeLogo}
                      className="flex items-center justify-center py-1.5 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
                      title="Changer le logo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={handleResetLogo}
                      className="flex items-center justify-center py-1.5 px-2 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors duration-200"
                      title="Réinitialiser le logo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Colonne de droite - Informations et spécifications */}
                <div className="w-full sm:w-2/3 lg:w-3/4 flex flex-col justify-center space-y-2.5">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <span className="inline-flex items-center justify-center p-1 mr-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      Logo personnalisé
                    </h3>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ajoutez votre identité visuelle à l&apos;application
                  </p>
                  
                  <div className="inline-grid grid-cols-3 gap-2 pt-1">
                    <div className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-blue-500 mr-1.5"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">PNG/SVG</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-blue-500 mr-1.5"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Max 2MB</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-blue-500 mr-1.5"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Format carré</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-10 items-center">
            <div className="w-[50%]">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations personnelles</h2>
              <form onSubmit={handleChangeUserDetails} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      placeholder="Entrez le nom"
                      value={userDetails.nom || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemple@domaine.com"
                      value={userDetails.email || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      placeholder="Entrez le numéro"
                      value={userDetails.telephone || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Groupe">Groupe</Label>
                    <Input
                      id="Groupe"
                      placeholder="Entrez le groupe"
                      value={userDetails.Groupe || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {hasPermission('parametres', 'modifier') && (
                  <Button type="submit" className="w-full sm:w-auto">
                    Enregistrer
                  </Button>
                )}
              </form>
            </div>
            <div className="w-[45%]">
              <h2 className="text-xl font-semibold text-gray-900 mb-7">Mot de passe</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Mot de passe actuel*</Label>
                  <Input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Nouveau mot de passe*</Label>
                  <Input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmez le mot de passe*</Label>
                  <Input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {hasPermission('parametres', 'modifier') && (
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Mettre à jour
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default Page3;
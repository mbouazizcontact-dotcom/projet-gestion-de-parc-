/* eslint-disable react/prop-types */
import {
    DocumentIcon,
    HomeIcon,
    ArchiveBoxIcon,
    Cog6ToothIcon,
    WrenchIcon,
    UserGroupIcon,
    ArrowRightOnRectangleIcon,
    CubeIcon,
    PaperAirplaneIcon,
    ExclamationCircleIcon,
    UsersIcon,
    BuildingOfficeIcon,
    Bars3Icon,
    XMarkIcon,
    PhotoIcon,
  } from '@heroicons/react/24/outline';
  import { Fuel, Car, Upload, Image as ImageIcon } from "lucide-react";
  import Swal from 'sweetalert2';
  import { useState, useEffect, useRef } from 'react';
  import { Link, useLocation, useNavigate } from 'react-router-dom';
  
  const sidebarItems = {
    Admin: [
      { label: "Tableau de bord", Icon: HomeIcon, path: "/dashboard" },
      {
        label: "Conducteurs", Icon: UserGroupIcon, path: "/Travailleur-conducteur"
      },
      {
        label: "Pièces", Icon: CubeIcon, path: "#", subItems: [
          { label: "Pièces en stock", Icon: CubeIcon, path: "/produits-stock" },
          { label: "Pièces demandées", Icon: DocumentIcon, path: "/Pieces-demandees" },
        ]
      },
      { label: "Véhicules", Icon: Car, path: "/ListeVehicules" },
      { label: "Maintenance", Icon: WrenchIcon, path: "/calendrier" },
      { label: "Utulisateurs", Icon: UsersIcon, path: "/utulisateurs" },
      { label: "Carburant", Icon: Fuel, path: "#" },
      { label: "Atelier", Icon: BuildingOfficeIcon, path: "/dashboard" },
      { label: "Paramètres", Icon: Cog6ToothIcon, path: "/parametre" }
    ],
    technicien: [
      { label: "Tableau de bord", Icon: HomeIcon, path: "/dashboard" },
      { label: "Véhicules en attente", Icon: WrenchIcon, path: "/pending-repairs" },
      {
        label: "Pièces", Icon: CubeIcon, path: "#", subItems: [
          { label: "Pièces en stock", Icon: CubeIcon, path: "/produits-stock" },
          { label: "Pièces demandées", Icon: PaperAirplaneIcon, path: "/produits-demandees" }
        ]
      },
      { label: "Historique ", Icon: ArchiveBoxIcon, path: "/repair-history" },
      { label: "Réclamations", Icon: ExclamationCircleIcon, path: "/reclamation" },
      { label: "Administration", Icon: BuildingOfficeIcon, path: "/dashboard" },
      { label: "Paramètres", Icon: Cog6ToothIcon, path: "/parametre" }
    ],
  };
  
  const Sidebar = () => {
    const location = useLocation();
  
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [logoUrl, setLogoUrl] = useState(localStorage.getItem("customLogo") || "/src/assets/car.png");
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const fileInputRef = useRef(null);
  
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
        if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      };
  
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
  
    const logout = () => {
      localStorage.removeItem('token');
      navigate("/");
    };
  
    const handleLogoutConfirmation = () => {
      Swal.fire({
        title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
        text: "Vous serez déconnecté de votre compte.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, déconnectez-moi',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
      }).then((result) => {
        if (result.isConfirmed) {
          logout();
        }
      });
    };
  
    const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.match('image.*')) {
          Swal.fire({
            title: 'Format invalide',
            text: 'Veuillez sélectionner une image valide (JPG, PNG, SVG, etc.)',
            icon: 'error',
            confirmButtonColor: '#3085d6',
          });
          return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
          Swal.fire({
            title: 'Fichier trop volumineux',
            text: 'La taille du logo ne doit pas dépasser 2 Mo',
            icon: 'error',
            confirmButtonColor: '#3085d6',
          });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const newLogoUrl = event.target.result;
          
          Swal.fire({
            title: 'Aperçu de votre logo',
            html: `
              <div class="mb-4 flex justify-center">
                <img src="${newLogoUrl}" alt="Aperçu du logo" class="max-h-40 object-contain" />
              </div>
              <p class="text-sm text-gray-600">Voulez-vous utiliser ce logo?</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirmer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#3085d6',
          }).then((result) => {
            if (result.isConfirmed) {
              setLogoUrl(newLogoUrl);
              localStorage.setItem("customLogo", newLogoUrl);
              
              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer)
                  toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
              });
              
              Toast.fire({
                icon: 'success',
                title: 'Logo mis à jour avec succès'
              });
            }
          });
        };
        reader.readAsDataURL(file);
      }
    };
  
    const resetLogoToDefault = () => {
      Swal.fire({
        title: 'Réinitialiser le logo',
        text: 'Voulez-vous revenir au logo par défaut?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, réinitialiser',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#3085d6',
      }).then((result) => {
        if (result.isConfirmed) {
          const defaultLogo = "/src/assets/car.png";
          setLogoUrl(defaultLogo);
          localStorage.removeItem("customLogo");
          
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          Toast.fire({
            icon: 'success',
            title: 'Logo réinitialisé avec succès'
          });
        }
      });
    };
  
    const openLogoSettings = () => {
      Swal.fire({
        title: 'Paramètres du logo',
        html: `
          <div class="flex flex-col space-y-4 p-2">
            <div class="flex justify-center mb-2">
              <img src="${logoUrl}" alt="Logo actuel" class="h-20 object-contain" />
            </div>
            <div class="flex flex-col space-y-3">
              <button id="upload-logo-btn" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Télécharger un nouveau logo</span>
              </button>
              <button id="reset-logo-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Restaurer le logo par défaut</span>
              </button>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              Formats acceptés: JPG, PNG, SVG, GIF (max. 2 Mo)
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Fermer',
        customClass: {
          container: 'logo-settings-modal',
          popup: 'rounded-lg',
        },
        didOpen: () => {
          document.getElementById('upload-logo-btn').addEventListener('click', () => {
            fileInputRef.current.click();
            Swal.close();
          });
          document.getElementById('reset-logo-btn').addEventListener('click', () => {
            Swal.close();
            resetLogoToDefault();
          });
        }
      });
    };
  
    return (
      <>
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleLogoUpload}
        />
        
        <div className={`fixed top-4 ${isSidebarOpen ? 'left-64' : 'left-4'} z-40 lg:hidden transition-all duration-300`}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-white shadow-md dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            {isSidebarOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
  
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={toggleSidebar}
          />
        )}
  
        <div 
          className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-800 shadow-lg z-30 flex flex-col transition-all duration-300 ${
            isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'
          }`}
        >
          <div 
            className={`relative flex flex-col justify-center items-center py-6 ${isSidebarOpen ? 'px-4' : 'px-2'}`}
            onMouseEnter={() => isSidebarOpen && setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <div className="relative">
              <img 
                src={logoUrl}
                height={isSidebarOpen ? 70 : 40}
                width={isSidebarOpen ? 'auto' : 40}
                alt="Logo" 
                className={`transition-all duration-300 object-contain max-h-16 ${isLogoHovered ? 'filter brightness-75' : ''}`}
              />
              
              {isSidebarOpen && isLogoHovered && (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-30 rounded transition-all"
                  onClick={openLogoSettings}
                >
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            <div className={`w-full ${isSidebarOpen ? 'mt-4' : 'mt-2'} border-b border-gray-200 dark:border-gray-700`}></div>
          </div>
  
          <nav className="py-2 overflow-y-auto flex-grow">
            <div className="space-y-2 px-2"> {/* Added space-y-2 and px-2 for consistent spacing */}
              {items.map((item) => (
                <SidebarItem
                  key={item.label}
                  Icon={item.Icon}
                  label={item.label}
                  path={item.path}
                  location={location}
                  isActive={location.pathname === item.path || (item.subItems && item.subItems.some(subItem => location.pathname === subItem.path))}
                  subItems={item.subItems}
                  navigate={navigate}
                  isExpanded={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </nav>
  
          <div className="mt-auto border-t border-gray-200 dark:border-gray-700">
            <button 
              className='w-full' 
              onClick={handleLogoutConfirmation}
              title="Logout"
            >
              <div className={`flex items-center py-3.5 transition-all cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500 ${
                isSidebarOpen ? 'px-5 justify-start' : 'justify-center'
              }`}>
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
                {isSidebarOpen && <span className="ml-3.5">Déconnexion</span>}
              </div>
            </button>
          </div>
        </div>
  
        <div className={`transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
        </div>
      </>
    );
  };
  
  const SidebarItem = ({ 
    Icon, 
    label, 
    isActive, 
    subItems, 
    location, 
    path, 
    navigate, 
    isExpanded,
    setIsSidebarOpen,
    isMobile 
  }) => {
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  
    const toggleSubItems = (e) => {
      if (subItems) {
        e.preventDefault();
        setIsSubMenuOpen(!isSubMenuOpen);
      }
    };
  
    const handleClick = (e) => {
   
      
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    };
  
    const itemContent = (
      <>
        <Icon className="w-6 h-6" />
        {isExpanded && <span className="ml-3.5">{label}</span>}
      </>
    );
  
    return (
      <div className="mb-1 last:mb-0"> {/* Added margin between items */}
        {subItems ? (
          <div
            className={`flex items-center transition-all cursor-pointer ${
              isExpanded ? 'px-5 justify-start' : 'justify-center px-3'
            } py-3 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 border-r-4 border-[#422afb] bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-500 border-r-4 border-transparent'
            }`}
            onClick={toggleSubItems}
            title={!isExpanded ? label : ''}
          >
            {itemContent}
            {isExpanded && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`w-4 h-4 ml-auto transition-transform ${isSubMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        ) : (
          <Link
            to={path}
            className={`flex items-center transition-all ${
              isExpanded ? 'px-5 justify-start' : 'justify-center px-3'
            } py-3 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 border-r-4 border-[#422afb] bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-500 border-r-4 border-transparent'
            }`}
            title={!isExpanded ? label : ''}
          >
            {itemContent}
          </Link>
        )}
  
        {subItems && isSubMenuOpen && isExpanded && (
          <div className="ml-4 space-y-1 overflow-hidden transition-all duration-300 max-h-96 py-1 bg-gray-50 dark:bg-gray-800">
            {subItems.map((subItem, index) => (
              <Link 
                key={index} 
                to={subItem.path}
                className={`flex items-center transition-all px-6 py-2 rounded-r-md ${
                  location.pathname === subItem.path 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500'
                }`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <subItem.Icon className="w-5 h-5" />
                <span className="ml-3 text-sm">{subItem.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  export default Sidebar;
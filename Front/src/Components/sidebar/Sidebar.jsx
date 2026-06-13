import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  HomeIcon,
  UserIcon,
  UserGroupIcon,
  CubeIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CalendarIcon,
  WrenchIcon,
  ClipboardIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { AlertCircle, AlertTriangleIcon, Fuel  } from 'lucide-react';

import { MdEngineering } from 'react-icons/md';


const allSidebarItems = [
  { label: 'Tableau de bord', Icon: HomeIcon, path: '/dashboard', permissionKey: 'TableauDeBord' },
  { label: 'Conducteurs', Icon: UserIcon, path: '/Travailleur-conducteur', permissionKey: 'Conducteurs' },
  { label: 'Groupes', Icon: UserGroupIcon, path: '/GroupeListe', permissionKey: 'Groupes' },
  { label: 'Véhicules', Icon: TruckIcon, path: '/ListeVehicules', permissionKey: 'Vehicules' },
  { label: 'Calendrier', Icon: CalendarIcon, path: '/calendrier', permissionKey: 'Calendrier' },
  {
    label: 'Maintenance',
    Icon: WrenchIcon,
    path: '#',
    permissionKey: 'Maintenance',
    subItems: [
      { label: 'Types-maintenances', Icon: ClipboardDocumentListIcon, path: '/Types-maintenances', permissionKey: 'TypesMaintenances' },
      { label: 'Processus  maintenances', Icon: MdEngineering, path: '/ScheduleMaintenance', permissionKey: 'MaintenanceReparations' },
      { label: 'Alertes', Icon: AlertTriangleIcon, path: '/Alertes', permissionKey: 'Alertes' },
    ],
  },
  {
    label: 'Atelier',
    Icon: WrenchScrewdriverIcon,
    path: '#',
    permissionKey: 'Atelier',
    subItems: [
      { label: 'Garages', Icon: BuildingStorefrontIcon, path: '/garages', permissionKey: 'Garages' },
      { label: 'Mécaniciens', Icon: UserIcon, path: '/Travailleurs-mecaniciens', permissionKey: 'Mecaniciens' },
      {
        label: 'Pièces',
        Icon: CubeIcon,
        path: '#',
        permissionKey: 'Pieces',
        subItems: [
          { label: 'Pièces en stock', Icon: ShoppingBagIcon, path: '/produits-stock', permissionKey: 'PiecesEnStock' },
          { label: 'Pièces demandées', Icon: ClipboardIcon, path: '/Pieces-demandees', permissionKey: 'PiecesDemandees' },
        ],
      },
      {
        label: 'Archives',
        Icon: ArchiveBoxIcon,
        path: '#',
        permissionKey: 'Archives',
        subItems: [
          { label: 'Historique des Maintenances', Icon: ClipboardDocumentListIcon, path: '/repair-history', permissionKey: 'HistoriqueDesReparations' },
          { label: 'Fiche Réceptions', Icon: DocumentDuplicateIcon, path: '/archiveFicheDeReception', permissionKey: 'FicheReceptions' },
          { label: 'Fiche Interventions', Icon: DocumentDuplicateIcon, path: '/archiveFicheIntervention', permissionKey: 'FicheInterventions' },
        ],
      },
      // { label: 'Réclamations', Icon: ExclamationCircleIcon, path: '/reclamation', permissionKey: 'Reclamations' },
    ],
  },
  { label: 'Carburant', Icon: Fuel, path: '/carburant', permissionKey: 'Carburant' },

  { label: 'Utilisateurs', Icon: UserCircleIcon, path: '/utulisateurs', permissionKey: 'Utilisateurs' },
  { label: 'Paramètres', Icon: Cog6ToothIcon, path: '/parametre', permissionKey: 'Parametres' },
];
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState(location.pathname);
  const [permissions, setPermissions] = useState(JSON.parse(localStorage.getItem('permissions')) || {});
  const [logo, setLogo] = useState(localStorage.getItem('customLogo') || '/src/assets/car.png');

  useEffect(() => {
    const syncPermissions = () => {
      const storedPermissions = JSON.parse(localStorage.getItem('permissions')) || {};
      setPermissions(storedPermissions);
    };

    syncPermissions();
    const interval = setInterval(syncPermissions, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const newLogo = localStorage.getItem('customLogo');
      if (newLogo) {
        setLogo(newLogo);
      } else {
        setLogo('/src/assets/car.png');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const items = allSidebarItems.filter((item) => {
    if (item.subItems) {
      item.subItems = item.subItems.filter((subItem) => {
        if (subItem.subItems) {
          subItem.subItems = subItem.subItems.filter((nestedSubItem) => {
            const hasPermission = permissions[nestedSubItem.permissionKey]?.lire;
            return hasPermission;
          });
          return subItem.subItems.length > 0 || permissions[subItem.permissionKey]?.lire;
        }
        return permissions[subItem.permissionKey]?.lire;
      });
      return item.subItems.length > 0 || permissions[item.permissionKey]?.lire;
    }
    return permissions[item.permissionKey]?.lire;
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleLogoutConfirmation = () => {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      text: 'Vous serez déconnecté de votre compte.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, déconnectez-moi',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) logout();
    });
  };

  const handleNavigation = (path) => {
    setActiveItem(path);
    navigate(path);
  };

  return (
    <>
      <div className={`fixed top-4 ${isSidebarOpen ? 'left-72' : 'left-4'} z-40 lg:hidden transition-all duration-300`}>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md dark:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar} />
      )}

      <div
        className={`fixed top-0 left-0 h-screen bg-gray-50 dark:bg-gray-900 shadow-lg z-30 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        <div className={`flex justify-center items-center py-6 ${isSidebarOpen ? '' : 'px-2'}`}>
          <img
            src={logo}
            height={isSidebarOpen ? 85 : 40}
            width={isSidebarOpen ? 80 : 40}
            alt="Logo image"
            className="transition-all duration-300"
          />
        </div>

        <nav className="border-t py-4 border-gray-200 flex-grow space-y-1 overflow-y-auto scrollbar-hidden">
          {items.map((item) => (
            <SidebarItem
              key={item.label}
              Icon={item.Icon}
              label={item.label}
              path={item.path}
              location={location}
              isActive={activeItem === item.path}
              subItems={item.subItems}
              navigate={handleNavigation}
              isExpanded={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              isMobile={isMobile}
              setActiveItem={setActiveItem}
              activeItem={activeItem}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-gray-200">
          <button className="w-full" onClick={handleLogoutConfirmation} title="Logout">
            <div
              className={`flex items-center py-3.5 transition-all cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 ${
                isSidebarOpen ? 'px-5 justify-start' : 'justify-center'
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              {isSidebarOpen && <span className="ml-3.5">Logout</span>}
            </div>
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-16'}`}>{/* Main content goes here */}</div>
    </>
  );
};

const SidebarItem = ({ Icon, label, isActive, subItems, location, path, navigate, isExpanded, setIsSidebarOpen, isMobile, setActiveItem, activeItem }) => {
  // Vérifier si un sous-élément est actif pour ouvrir le sous-menu
  const isSubItemActive = subItems && subItems.some(
    (subItem) => location.pathname === subItem.path || 
    (subItem.subItems && subItem.subItems.some((nested) => location.pathname === nested.path))
  );
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(isSubItemActive);

  // L'élément est actif uniquement si son chemin correspond à activeItem
  const isItemActive = isActive;

  const toggleSubItems = (e) => {
    if (subItems) {
      e.preventDefault();
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };

  const handleClick = (e, targetPath) => {
    e.preventDefault();
    setActiveItem(targetPath);
    if (isMobile) setIsSidebarOpen(false);
    navigate(targetPath);
  };

  const itemContent = (
    <div className="flex items-center w-full">
      <Icon className="w-5 h-5" />
      {isExpanded && (
        <>
          <span className="ml-3 text-sm font-medium whitespace-nowrap">{label}</span>
          {subItems && <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${isSubMenuOpen ? 'rotate-180' : ''}`} />}
        </>
      )}
    </div>
  );

  return (
    <div className="sidebar-item px-2">
      {subItems ? (
        <div
          role="button"
          className={`flex items-center transition-all cursor-pointer rounded-lg ${
            isExpanded ? 'px-3 justify-start' : 'justify-center px-1'
          } py-2.5 ${
            isItemActive
              ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 border-r-4 border-blue-600'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent'
          }`}
          onClick={toggleSubItems}
          title={!isExpanded ? label : ''}
        >
          {itemContent}
        </div>
      ) : (
        <Link
          to={path}
          className={`flex items-center transition-all rounded-lg ${
            isExpanded ? 'px-3 justify-start' : 'justify-center px-1'
          } py-2.5 ${
            isItemActive
              ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 border-r-4 border-blue-600'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent'
          }`}
          onClick={(e) => handleClick(e, path)}
          title={!isExpanded ? label : ''}
        >
          {itemContent}
        </Link>
      )}

      {subItems && isSubMenuOpen && isExpanded && (
        <div className="ml-4 space-y-1 max-w-full">
          {subItems.map((subItem, index) => (
            <SidebarItem
              key={index}
              Icon={subItem.Icon}
              label={subItem.label}
              path={subItem.path}
              location={location}
              isActive={activeItem === subItem.path}
              subItems={subItem.subItems}
              navigate={navigate}
              isExpanded={isExpanded}
              setIsSidebarOpen={setIsSidebarOpen}
              isMobile={isMobile}
              setActiveItem={setActiveItem}
              activeItem={activeItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
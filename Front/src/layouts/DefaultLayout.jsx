import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../Components/header/DashboardHeader ";
import Sidebar from "../Components/sidebar/Sidebar";

export default function DefaultLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = (path) => {
    const titleMap = {
      "/ScheduleMaintenance" : " Maintenances",
     "/Types-maintenances" :  "Types de maintenance",
      "/dashboard": "Tableau de bord",
      "/Alertes": "Alertes",
      "/garages": "Liste des Garages",
      "/garagistes": "Liste des Garagistes",
      "/Travailleurs-mecaniciens": "Liste des Mécaniciens",
      "/parametre": "Paramètres",
      "/Travailleur-conducteur": "Conducteurs",
      "/GroupeListe": "Groupes",
      "/Vehicules": "Véhicules",
      "/ListeVehicules": "Véhicules",
      "/notification": "Notifications",
      "/calendrier": "Calendrier",
      "/reclamation": "Réclamations",
      "/pending-repairs": "Véhicules en attente",
      "/products": "Pièces",
      "/produits-stock": "Pièces en stock",
      "/produits-demandees": "Pièces demandées",
      "/Travailleurs-tech": "Mécaniciens",
      "/Travailleurs-rsc": "Conducteurs",
      "/fiche-tech": "Modification de la fiche de réparation",
      "/fiche-rsc": "Modification de la fiche",
      "/demande-conge": "Demandes de congés",
      "/Pieces-demandees": "Demandes de pièces de rechange",
      "/utulisateurs": "Utilisateurs",
      "/schedule-maintenance": "Programmer une maintenance",
      "/archiveFicheDeReception" : "Historique des fiches de réception",
      "/archiveFicheIntervention" : "Historique des fiches d'intervention",
      "/repair-history":"Historique des maintenances",
      "/Alertes":"Alertes",
      "/carburant": "Gestion du Carburant"
    };

    return titleMap[path] || "Page";
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="ml-6 flex-1 bg-gray-100 dark:bg-gray-900">
        <DashboardHeader 
          pageTitle={pageTitle} 
          toggleSidebar={toggleSidebar} 
          toggleDarkMode={toggleDarkMode}
          isDarkMode={darkMode}
        />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
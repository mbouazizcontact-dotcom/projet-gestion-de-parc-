import React from 'react';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Dashboard = React.lazy(() => import('../pages/dashbord/dashbordContent'));
const CalendrierPage = React.lazy(() => import('../pages/Admin/calendrier/CalendrierPage'));
const ListeVehicules = React.lazy(() => import('../pages/Admin/ListeVehicules'));
const TravailleursConducteurPage = React.lazy(() => import('../pages/Admin/travailleursChauffPages'));
const Reclamation = React.lazy(() => import('../pages/Technicien/ReclamationPage'));
const ReclamationsList = React.lazy(() => import('../pages/Admin/ListeReclamation/ListeReclamations'));
const ParametrePage = React.lazy(() => import('../pages/Technicien/ParametrePage'));
const AppareilEnAttentePage = React.lazy(() => import('../pages/Technicien/AppareilEnAttentePage'));
const HistroquieDeReparationPage = React.lazy(() => import('../pages/Technicien/HistroquieDeReparationPage'));
const ProduitsEnStocks = React.lazy(() => import('../pages/Technicien/ProduitsEnStock'));
const ProduitsDemandees = React.lazy(() => import('../pages/Technicien/ProduitsDemandees'));
const UsersTabl = React.lazy(() => import('../pages/utulisateurs/user'));
const FicheRep = React.lazy(() => import('../fiches/fiche1Route'));
const FicheRep2 = React.lazy(() => import('../fiches/fiche2Route'));
const Groupe = React.lazy(() => import('../pages/Admin/groupe/groupe'));
const TravailleursMecanicienPage = React.lazy(() => import('../pages/Technicien/mecanicienTable'));
const ArchiveReceptionTable1 = React.lazy(() => import('../pages/Technicien/archives/ficheDeReception/archiveReceptionRoute'));
const ArchiveInterventionTable1 = React.lazy(() => import('../pages/Technicien/archives/ficheIntventions/archiveReceptionRoute'));
const GarageTable2 = React.lazy(() => import('../pages/Technicien/garages/garagesRoute'));
const MaintenanceRoute = React.lazy(() => import('../pages/maintenance/MaintenanceManagerRoute'));
const ScheduleMaintenance1 = React.lazy(() => import('../pages/maintenance/ScheduleMaintenanceRoutes'));
const AlerteRoute = React.lazy(() => import('../pages/maintenance/alerteRoutes'));
const ViewReceptionFiche = React.lazy(()=> import ('../pages/Technicien/archives/ficheDeReception/ViewReceptionFiche'));
const ViewRepairIntervention = React.lazy(()=> import ('../pages/Technicien/archives/ficheIntventions/ViewRepairIntervention'));
const CarburantRoute = React.lazy(() => import('../pages/carburant/CarburantRoute'));
const ForgotPassword = React.lazy(() => import('../pages/login/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../Components/ResetPassword'));

const routes = [
  { path: '/dashboard', element: <Dashboard />, requiredPermission: 'TableauDeBord.lire' },
  { path: '/calendrier', element: <CalendrierPage />, requiredPermission: 'Calendrier.lire' },
  { path: '/GroupeListe', element: <Groupe />, requiredPermission: 'Groupes.lire' },
  { path: '/parametre', element: <ParametrePage />, requiredPermission: 'Parametres.lire' },
  { path: '/produits-stock', element: <ProduitsEnStocks />, requiredPermission: 'PiecesEnStock.lire' },
  { path: '/Pieces-demandees', element: <ProduitsDemandees />, requiredPermission: 'PiecesDemandees.lire' },
  { path: '/repair-history', element: <HistroquieDeReparationPage />, requiredPermission: 'HistoriqueDesReparations.lire' },
  { path: '/reclamation', element: <Reclamation />, requiredPermission: 'Reclamations.lire' },
  { path: '/reclamationListe', element: <ReclamationsList />, requiredPermission: 'Reclamations.lire' },
  { path: '/ListeVehicules', element: <ListeVehicules />, requiredPermission: 'Vehicules.lire' },
  { path: '/Travailleur-conducteur', element: <TravailleursConducteurPage />, requiredPermission: 'Conducteurs.lire' },
  { path: '/Travailleurs-mecaniciens', element: <TravailleursMecanicienPage />, requiredPermission: 'Mecaniciens.lire' },
  { path: '/utulisateurs', element: <UsersTabl />, requiredPermission: 'Utilisateurs.lire' },
  { path: '/ficheIntervention', element: <FicheRep />, requiredPermission: 'FicheInterventions.lire' },
  { path: '/ficheReceptionAtelier', element: <FicheRep2 />, requiredPermission: 'FicheReceptions.lire' },
  { path: '/garages', element: <GarageTable2 />, requiredPermission: 'Garages.lire' },
  { path: '/archiveFicheDeReception', element: <ArchiveReceptionTable1 />, requiredPermission: 'FicheReceptions.lire' },
  { path: '/archiveFicheIntervention', element: <ArchiveInterventionTable1 />, requiredPermission: 'FicheInterventions.lire' },
  { path: '/Types-maintenances', element: <MaintenanceRoute />, requiredPermission: 'TypesMaintenances.lire' },
  { path: '/ScheduleMaintenance', element: <ScheduleMaintenance1 />, requiredPermission: 'MaintenanceReparations.lire' },
  { path: '/Alertes', element: <AlerteRoute />, requiredPermission: 'Alertes.lire' },
  { path: '/reception-fiche/:id', element: <ViewReceptionFiche />, requiredPermission: 'FicheReceptions.lire' },
  { path: '/view-repair-intervention/:id', element: <ViewRepairIntervention />, requiredPermission: 'FicheInterventions.lire' },
  { path: '/carburant', element: <CarburantRoute />, requiredPermission: 'Carburant.lire' },
  { path: '/ForgotPassword', element: <ForgotPassword />},
  { path: '/reset-password', element: <ResetPassword />}
];

export default routes;
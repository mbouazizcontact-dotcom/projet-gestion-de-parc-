import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Archive, Trash2, MoreVertical, X, ChevronDown, Search, Lock, Phone, Eye, EyeOff, Key, AlertCircle, Users, Download, Inbox } from 'lucide-react';
import axios from '../../Components/axios/axiosConfig';
import usePermissions from '../../hooks/usePermissions';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation } from 'react-router-dom';

function GestionUtilisateurs() {
  const { permissions, loading, error, hasPermission, refreshPermissions } = usePermissions();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [actionsUtilisateurVisible, setActionsUtilisateurVisible] = useState(null);
  const [utilisateurEnEdition, setUtilisateurEnEdition] = useState(null);
  const [modalAjoutVisible, setModalAjoutVisible] = useState(false);
  const [termeRecherche, setTermeRecherche] = useState("");
  const [statutSelectionne, setStatutSelectionne] = useState("statut");
  const [GroupeSelectionne, setGroupeSelectionne] = useState("Groupe");
  const [modalPermissionsVisible, setModalPermissionsVisible] = useState(false);
  const [permissionsUtilisateur, setPermissionsUtilisateur] = useState(null);
  const [mode, setMode] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [actionConfirmation, setActionConfirmation] = useState({ type: null, userId: null });
  const [showArchived, setShowArchived] = useState(false);
  const [groupesDisponibles, setGroupesDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionCategory, setPermissionCategory] = useState('Administration');
  const [formErrors, setFormErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [ViewAll, setViewAll] = useState(false);
  const itemsPerPage = 5;
  const [garages, setGarages] = useState([]);
  const [mecanicienSearch, setMecanicienSearch] = useState("");
  const [showMecanicienDropdown, setShowMecanicienDropdown] = useState(false);
  const [filteredMecaniciens, setFilteredMecaniciens] = useState([]);
  const [selectedMecanicien, setSelectedMecanicien] = useState(null);
  const mecanicienInputRef = React.useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.role === 'Mécanicien') {
      setModalAjoutVisible(true);
      setMode('add');
      setUtilisateurEnEdition({
        role: 'Mécanicien',
        statut: 'Actif',
        permissions: { ...defaultPermissions }
      });
    }
  }, [location.state]);

  const defaultPermissions = {
    TableauDeBord: { creer: false, lire: true, modifier: false, supprimer: false },
    Conducteurs: { creer: false, lire: true, modifier: false, supprimer: false },
    Groupes: { creer: false, lire: true, modifier: false, supprimer: false },
    Vehicules: { 
      creer: false, 
      lire: true, 
      modifier: false, 
      supprimer: false, 
      modifierKilometrage: false 
    }, 
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
    FicheReceptions: { creer: false, lire: true, modifier: false, supprimer: false },
    FicheInterventions: { creer: false, lire: true, modifier: false, supprimer: false },
    Reclamations: { creer: false, lire: true, modifier: false, supprimer: false },
    Utilisateurs: { creer: false, lire: true, modifier: false, supprimer: false },
    Parametres: { creer: false, lire: true, modifier: false, supprimer: false },
  };

  useEffect(() => {
    if (!hasPermission('Utilisateurs', 'lire')) return;

    const fetchUtilisateurs = async () => {
      try {
        const response = await axios.get("/api/users");
        const data = Array.isArray(response.data) ? response.data : [];
        const normalizedUsers = data.map(user => ({
          ...user,
          id: user._id || user.id,
          permissions: { ...defaultPermissions, ...user.permissions },
        }));
        setUtilisateurs(normalizedUsers);
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Session expirée. Veuillez vous reconnecter.", { autoClose: 5000 });
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          toast.error("Accès refusé : réservé aux Super Admins.", { autoClose: 5000 });
        } else {
          toast.error("Erreur lors de la récupération des utilisateurs.", { autoClose: 5000 });
        }
      }
    };

    const fetchGroupes = async () => {
      try {
        const response = await axios.get("/api/groupes");
        const groupes = response.data.data || response.data;
        const groupNames = groupes
          .map(groupe => groupe.nom?.trim())
          .filter(Boolean);
        const uniqueGroupes = [...new Set(groupNames)].sort();
        setGroupesDisponibles(uniqueGroupes);
      } catch (error) {
        toast.error("Erreur lors de la récupération des groupes.", { autoClose: 5000 });
        setGroupesDisponibles([]);
      }
    };

    const fetchGarages = async () => {
      try {
        const response = await axios.get("/api/garages");
        setGarages(response.data);
      } catch (error) {
        toast.error("Erreur lors de la récupération des garages.", { autoClose: 5000 });
        setGarages([]);
      }
    };

    fetchUtilisateurs();
    fetchGroupes();
    fetchGarages();
  }, [hasPermission]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsUtilisateurVisible && !e.target.closest('.action-menu') && !e.target.closest('.action-button')) {
        fermerActionsUtilisateur();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionsUtilisateurVisible]);

  const permissionsByCategory = {
    Administration: [
      { nom: "Tableau de bord", cle: "TableauDeBord", description: "Accès aux statistiques et aperçus généraux", icone: "📊" },
      { nom: "Conducteurs", cle: "Conducteurs", description: "Gestion des informations des conducteurs", icone: "👥" },
      { nom: "Groupes", cle: "Groupes", description: "Gestion des groupes de conducteurs ou véhicules", icone: "👥" },
      { nom: "Véhicules", cle: "Vehicules", description: "Gestion des informations des véhicules", icone: "🚗" },
      { nom: "Utilisateurs", cle: "Utilisateurs", description: "Gestion des utilisateurs et de leurs permissions", icone: "👤" },
      { nom: "Paramètres", cle: "Parametres", description: "Configuration des paramètres de l'application", icone: "⚙️" },
      { nom: "Calendrier", cle: "Calendrier", description: "Gestion des événements et plannings", icone: "📅" },
      { nom: "Carburant", cle: "Carburant", description: "Suivi de la consommation de carburant", icone: "⛽" },
    ],
    Maintenance: [
      { nom: "Maintenance", cle: "Maintenance", description: "Planification et suivi des opérations de maintenance", icone: "🔧" },
      { nom: "Types de maintenance", cle: "TypesMaintenances", description: "Gestion des types de maintenance", icone: "📋" },
      { nom: "Maintenance et réparations", cle: "MaintenanceReparations", description: "Planification des réparations", icone: "🔧" },
      { nom: "Alertes", cle: "Alertes", description: "Gestion des alertes de maintenance", icone: "⚠️" },
    ],
    Atelier: [
      { nom: "Atelier", cle: "Atelier", description: "Gestion des activités de l'atelier", icone: "🏭" },
      { nom: "Pièces", cle: "Pieces", description: "Gestion des pièces détachées", icone: "🛠️" },
      { nom: "Pièces en stock", cle: "PiecesEnStock", description: "Gestion du stock de pièces", icone: "📦" },
      { nom: "Pièces demandées", cle: "PiecesDemandees", description: "Gestion des demandes de pièces", icone: "📋" },
      { nom: "Mécaniciens", cle: "Mecaniciens", description: "Gestion des informations des mécaniciens", icone: "🔩" },
      { nom: "Garages", cle: "Garages", description: "Gestion des garages", icone: "🏠" },
      { nom: "Fiches de réception", cle: "FicheReceptions", description: "Gestion des fiches de réception", icone: "📝" },
      { nom: "Fiches d'intervention", cle: "FicheInterventions", description: "Gestion des fiches d'intervention", icone: "📝" },
      { nom: "Historique des réparations", cle: "HistoriqueDesReparations", description: "Consultation de l'historique des réparations", icone: "📜" },
      { nom: "Archives", cle: "Archives", description: "Gestion des archives", icone: "📦" },
      { nom: "Réclamations", cle: "Reclamations", description: "Gestion des réclamations", icone: "📢" },
    ],
  };

  const utilisateursFiltres = useMemo(() => {
    const rechercheLower = termeRecherche.toLowerCase();
    return utilisateurs.filter(user =>
      (user.nom?.toLowerCase() || '').includes(rechercheLower) &&
      (statutSelectionne === "statut" || user.statut === statutSelectionne) &&
      (GroupeSelectionne === "Groupe" || user.Groupe === GroupeSelectionne) &&
      (showArchived ? user.archived : !user.archived)
    );
  }, [utilisateurs, termeRecherche, statutSelectionne, GroupeSelectionne, showArchived]);

  const totalPages = Math.ceil(utilisateursFiltres.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = ViewAll ? utilisateursFiltres : utilisateursFiltres.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const validateForm = (user, mode) => {
    const errors = {};
    if (!user.prenom) errors.prenom = "Le prénom est requis.";
    if (!user.nomFamille) errors.nomFamille = "Le nom de famille est requis.";
    if (!user.email) errors.email = "L'email est requis.";
    else if (!/^\S+@\S+\.\S+$/.test(user.email)) errors.email = "Veuillez entrer un email valide.";

    if (!user.telephone) {
      errors.telephone = "Le numéro de téléphone est requis.";
    } else if (!/^\d{8}$/.test(user.telephone)) {
      errors.telephone = "Le numéro de téléphone doit comporter exactement 8 chiffres.";
    }

    if (mode === 'add') {
      if (!user.password) errors.password = "Le mot de passe est requis.";
      else if (user.password.length < 8) errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
      if (!user.confirmPassword) errors.confirmPassword = "La confirmation du mot de passe est requise.";
      else if (user.password !== user.confirmPassword) errors.confirmPassword = "Les mots de passe ne correspondent pas.";
    } else if (mode === 'edit' && user.password) {
      if (user.password.length < 8) errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
      if (!user.confirmPassword) errors.confirmPassword = "La confirmation du mot de passe est requise.";
      else if (user.password !== user.confirmPassword) errors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    // Validation spécifique pour les mécaniciens
    if (user.role === 'Mécanicien') {
      if (!user.garage) {
        errors.garage = "Le garage est requis pour un mécanicien.";
      }
      if (user.experience === undefined || user.experience === null || user.experience === '') {
        errors.experience = "L'expérience est requise pour un mécanicien.";
      } else if (isNaN(parseInt(user.experience)) || parseInt(user.experience) < 0) {
        errors.experience = "L'expérience doit être un nombre positif.";
      }
      if (!user.specialisation || user.specialisation.trim() === '') {
        errors.specialisation = "La spécialisation est requise pour un mécanicien.";
      }
      if (!user.dateEmboche) {
        errors.dateEmboche = "La date d'embauche est requise pour un mécanicien.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const exporterCSV = () => {
    const headers = ["ID", "Nom", "Prénom", "Nom de famille", "Email", "Téléphone", "Groupe", "Statut", "Archivé"];
    const rows = utilisateursFiltres.map(user => [
      user.id || 'N/A',
      user.nom || 'Non spécifié',
      user.prenom || 'Non spécifié',
      user.nomFamille || 'Non spécifié',
      user.email || 'Non spécifié',
      user.telephone || 'Non spécifié',
      user.Groupe || 'Non spécifié',
      user.statut || 'Inactif',
      user.archived ? "Oui" : "Non",
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "utilisateurs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gererClicActionUtilisateur = (userId, e) => {
    e.stopPropagation();
    if (!userId) {
      toast.error("Utilisateur invalide.", { autoClose: 5000 });
      return;
    }
    setActionsUtilisateurVisible(actionsUtilisateurVisible === userId ? null : userId);
  };

  const fermerActionsUtilisateur = () => {
    setActionsUtilisateurVisible(null);
  };

  const gererAffichagePermissions = (user) => {
    // Récupérer l'ID de l'utilisateur actuel
    const currentUserId = localStorage.getItem('userId');
    // Trouver l'utilisateur actuel dans la liste des utilisateurs
    const currentUser = utilisateurs.find(u => u.id === currentUserId);
    
    // Vérifier si l'utilisateur actuel est un Super Admin
    if (!currentUser || currentUser.role !== 'Super Admin') {
      toast.error("Seuls les Super Admins peuvent modifier les permissions.", { autoClose: 5000 });
      return;
    }

    if (!hasPermission('Utilisateurs', 'modifier')) {
      toast.error("Permission de modification des permissions refusée.", { autoClose: 5000 });
      return;
    }
    if (!user?.id) {
      toast.error("Utilisateur invalide.", { autoClose: 5000 });
      return;
    }
    const permissionsInitiales = { ...defaultPermissions, ...user.permissions };
    setPermissionsUtilisateur({ userId: user.id, permissions: permissionsInitiales, nom: user.nom || 'Utilisateur inconnu' });
    setModalPermissionsVisible(true);
    setPermissionCategory('Administration');
    fermerActionsUtilisateur();
  };

  const gererChangementPermission = (sujet, typePermission) => {
    const currentUserId = localStorage.getItem('userId');
    if (
      sujet === 'Utilisateurs' &&
      typePermission === 'lire' &&
      permissionsUtilisateur.userId === currentUserId &&
      permissionsUtilisateur.permissions[sujet][typePermission]
    ) {
      toast.error("Vous ne pouvez pas retirer votre propre permission de lecture des utilisateurs.", { autoClose: 5000 });
      return;
    }

    // Check if disabling this 'lire' permission would result in no 'lire' permissions
    if (typePermission === 'lire' && permissionsUtilisateur.permissions[sujet].lire) {
      const otherLirePermissions = Object.keys(permissionsUtilisateur.permissions).some(
        key => key !== sujet && permissionsUtilisateur.permissions[key].lire
      );
      if (!otherLirePermissions) {
        toast.error("Vous ne pouvez pas désactiver toutes les permissions de lecture. L'utilisateur doit avoir au moins une permission de lecture.", { autoClose: 5000 });
        return;
      }
    }

    setPermissionsUtilisateur(prev => {
      const newPermissions = {
        ...prev.permissions,
        [sujet]: {
          ...prev.permissions[sujet],
          [typePermission]: !prev.permissions[sujet][typePermission],
        },
      };

      // If 'lire' is being disabled, disable dependent permissions
      if (typePermission === 'lire' && !newPermissions[sujet].lire) {
        newPermissions[sujet].creer = false;
        newPermissions[sujet].modifier = false;
        newPermissions[sujet].supprimer = false;
        if (sujet === 'Vehicules') {
          newPermissions[sujet].modifierKilometrage = false;
        }
      }

      return {
        ...prev,
        permissions: newPermissions,
      };
    });
  };

  const gererSauvegardePermissions = async () => {
    if (!hasPermission('Utilisateurs', 'modifier')) {
      toast.error("Permission de modification refusée.", { autoClose: 5000 });
      return;
    }
    if (isLoading || !permissionsUtilisateur?.userId) {
      toast.error("Utilisateur non valide ou opération en cours.", { autoClose: 5000 });
      return;
    }

    const hasAtLeastOneReadPermission = Object.keys(permissionsUtilisateur.permissions).some(
      key => permissionsUtilisateur.permissions[key].lire
    );

    if (!hasAtLeastOneReadPermission) {
      toast.error("L'utilisateur doit avoir au moins une permission de lecture pour accéder au système.", { autoClose: 5000 });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(
        `/api/users/${permissionsUtilisateur.userId}/permissions`,
        { permissions: permissionsUtilisateur.permissions },
      );
      const updatedUserData = { ...response.data, id: response.data._id || response.data.id };
      setUtilisateurs(prev => prev.map(user =>
        user.id === permissionsUtilisateur.userId ? updatedUserData : user
      ));

      const currentUserId = localStorage.getItem('userId');
      if (currentUserId === permissionsUtilisateur.userId) {
        localStorage.setItem('permissions', JSON.stringify(permissionsUtilisateur.permissions));
        // Rafraîchir les permissions immédiatement
        await refreshPermissions();
      }

      toast.success("Permissions mises à jour avec succès.", { autoClose: 5000 });
      setModalPermissionsVisible(false);
      setPermissionsUtilisateur(null);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.", { autoClose: 5000 });
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        toast.error("Accès refusé : réservé aux Super Admins.", { autoClose: 5000 });
      } else {
        toast.error(error.response?.data.message || "Erreur lors de la mise à jour des permissions.", { autoClose: 5000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const gererSauvegardeUtilisateur = async () => {
    if (isLoading) {
      toast.error("Opération en cours.", { autoClose: 5000 });
      return;
    }

    if (!validateForm(utilisateurEnEdition, mode)) {
      return;
    }

    setIsLoading(true);
    if (mode === 'edit') {
      if (!hasPermission('Utilisateurs', 'modifier')) {
        toast.error("Permission de modification refusée.", { autoClose: 5000 });
        setIsLoading(false);
        return;
      }
      if (!utilisateurEnEdition?.id) {
        toast.error("Utilisateur invalide.", { autoClose: 5000 });
        setIsLoading(false);
        return;
      }
      try {
        const updatedUser = {
          nom: utilisateurEnEdition.nom,
          prenom: utilisateurEnEdition.prenom,
          nomFamille: utilisateurEnEdition.nomFamille,
          email: utilisateurEnEdition.email,
          telephone: utilisateurEnEdition.telephone,
          Groupe: utilisateurEnEdition.Groupe,
          statut: utilisateurEnEdition.statut,
          role: utilisateurEnEdition.role,
          ...(utilisateurEnEdition.password && { password: utilisateurEnEdition.password }),
        };
        const response = await axios.put(`/api/users/${utilisateurEnEdition.id}`, updatedUser);
        const updatedUserData = { ...response.data, id: response.data._id || response.data.id };
        setUtilisateurs(prev => prev.map(user =>
          user.id === utilisateurEnEdition.id ? updatedUserData : user
        ));
        toast.success("Utilisateur mis à jour avec succès.", { autoClose: 5000 });
        setMode(null);
        setUtilisateurEnEdition(null);
        setModalAjoutVisible(false);
        setFormErrors({});
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Session expirée. Veuillez vous reconnecter.", { autoClose: 5000 });
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          toast.error("Accès refusé : réservé aux Super Admins.", { autoClose: 5000 });
        } else {
          toast.error(error.response?.data.message || "Erreur lors de la mise à jour.", { autoClose: 5000 });
        }
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'add') {
      if (!hasPermission('Utilisateurs', 'creer')) {
        toast.error("Permission de création refusée.", { autoClose: 5000 });
        setIsLoading(false);
        return;
      }
      try {
        // Champs pour la table User
        const userData = {
          nom: utilisateurEnEdition.nom,
          prenom: utilisateurEnEdition.prenom,
          nomFamille: utilisateurEnEdition.nomFamille,
          email: utilisateurEnEdition.email,
          telephone: utilisateurEnEdition.telephone,
          Groupe: utilisateurEnEdition.Groupe,
          statut: "Actif", // Statut par défaut pour User
          password: utilisateurEnEdition.password,
          confirmerMotDePasse: utilisateurEnEdition.confirmPassword,
          permissions: defaultPermissions,
          role: utilisateurEnEdition.role
        };

        // Si c'est un mécanicien, ajouter les champs spécifiques directement dans userData
        if (utilisateurEnEdition.role === 'Mécanicien') {
          userData.experience = parseInt(utilisateurEnEdition.experience) || 0;
          userData.specialisation = utilisateurEnEdition.specialisation;
          userData.garage = utilisateurEnEdition.garage;
          userData.dateEmboche = utilisateurEnEdition.dateEmboche;
        }

        const response = await axios.post("/api/users", userData);
        const newUserData = { ...response.data, id: response.data._id || response.data.id };
        setUtilisateurs(prev => [...prev, newUserData]);
        toast.success("Utilisateur ajouté avec succès.", { autoClose: 5000 });
        setMode(null);
        setUtilisateurEnEdition(null);
        setModalAjoutVisible(false);
        setPasswordError(null);
        setFormErrors({});
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Session expirée. Veuillez vous reconnecter.", { autoClose: 5000 });
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          toast.error("Accès refusé : réservé aux Super Admins.", { autoClose: 5000 });
        } else {
          toast.error(error.response?.data.message || "Erreur lors de l'ajout.", { autoClose: 5000 });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const gererAjoutUtilisateur = () => {
    // Récupérer l'ID de l'utilisateur actuel
    const currentUserId = localStorage.getItem('userId');
    // Trouver l'utilisateur actuel dans la liste des utilisateurs
    const currentUser = utilisateurs.find(u => u.id === currentUserId);
    
    // Vérifier si l'utilisateur actuel est un Super Admin
    if (!currentUser || currentUser.role !== 'Super Admin') {
      toast.error("Seuls les Super Admins peuvent créer des utilisateurs.", { autoClose: 5000 });
      return;
    }

    if (!hasPermission('Utilisateurs', 'creer')) {
      toast.error("Permission de création refusée.", { autoClose: 5000 });
      return;
    }

    // Récupérer le rôle depuis l'état de navigation
    const role = location.state?.role || "";

    setUtilisateurEnEdition({
      nom: "",
      prenom: "",
      nomFamille: "",
      email: "",
      telephone: "",
      Groupe: "",
      statut: "Actif",
      password: "",
      confirmPassword: "",
      archived: false,
      role: role, // Utiliser le rôle passé dans l'état de navigation
      experience: "",
      specialisation: "",
      garage: "",
      dateEmboche: new Date().toISOString().split('T')[0]
    });
    setMode('add');
    setModalAjoutVisible(true);
    setPasswordError(null);
    setFormErrors({});
  };

  const demanderConfirmation = (type, userId) => {
    if (!userId) {
      toast.error("Utilisateur invalide.", { autoClose: 5000 });
      return;
    }
    if (type === 'suppression' && !hasPermission('Utilisateurs', 'supprimer')) {
      toast.error("Permission de suppression refusée.", { autoClose: 5000 });
      return;
    }
    if (type === 'archivage' && !hasPermission('Utilisateurs', 'modifier')) {
      toast.error("Permission d'archivage refusée.", { autoClose: 5000 });
      return;
    }
    setActionConfirmation({ type, userId });
    setConfirmationVisible(true);
    fermerActionsUtilisateur();
  };

  const gererConfirmation = async (confirme) => {
    if (!actionConfirmation.userId) {
      toast.error("Utilisateur invalide.", { autoClose: 5000 });
      setConfirmationVisible(false);
      return;
    }
    if (confirme) {
      setIsLoading(true);
      try {
        if (actionConfirmation.type === 'suppression') {
          await axios.delete(`/api/users/${actionConfirmation.userId}`);
          setUtilisateurs(prev => prev.filter(user => user.id !== actionConfirmation.userId));
          toast.success("Utilisateur supprimé avec succès.", { autoClose: 5000 });
        } else if (actionConfirmation.type === 'archivage') {
          const user = utilisateurs.find(u => u.id === actionConfirmation.userId);
          if (!user) {
            toast.error("Utilisateur introuvable.", { autoClose: 5000 });
            setIsLoading(false);
            return;
          }
          const updateData = {
            archived: !user.archived,
            statut: user.archived ? 'Actif' : 'Inactif',
          };
          const response = await axios.put(`/api/users/${actionConfirmation.userId}`, updateData);
          const updatedUserData = { ...response.data, id: response.data._id || response.data.id };
          setUtilisateurs(prev => prev.map(u =>
            u.id === actionConfirmation.userId ? updatedUserData : u
          ));
          toast.success(user.archived ? "Utilisateur désarchivé avec succès." : "Utilisateur archivé avec succès.", { autoClose: 5000 });
        }
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Session expirée. Veuillez vous reconnecter.", { autoClose: 5000 });
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          toast.error("Accès refusé : réservé aux Super Admins.", { autoClose: 5000 });
        } else if (error.response?.status === 400 && error.response?.data.message.includes("assigné à des entités actives")) {
          toast.error("Impossible de supprimer l'utilisateur car il est assigné à des entités actives. Veuillez d'abord le désassigner.", { autoClose: 5000 });
        } else {
          toast.error(error.response?.data.message || `Erreur lors de ${actionConfirmation.type}.`, { autoClose: 5000 });
        }
      } finally {
        setIsLoading(false);
      }
    }
    setConfirmationVisible(false);
    setActionConfirmation({ type: null, userId: null });
  };

  const gererArchivageUtilisateur = (userId) => {
    demanderConfirmation('archivage', userId);
  };

  const gererSuppressionUtilisateur = (userId) => {
    // Récupérer l'ID de l'utilisateur actuel
    const currentUserId = localStorage.getItem('userId');
    // Trouver l'utilisateur actuel dans la liste des utilisateurs
    const currentUser = utilisateurs.find(u => u.id === currentUserId);
    
    // Vérifier si l'utilisateur actuel est un Super Admin
    if (!currentUser || currentUser.role !== 'Super Admin') {
      toast.error("Seuls les Super Admins peuvent supprimer des utilisateurs.", { autoClose: 5000 });
      return;
    }

    demanderConfirmation('suppression', userId);
  };

  const gererModificationUtilisateur = (user) => {
    // Récupérer l'ID de l'utilisateur actuel
    const currentUserId = localStorage.getItem('userId');
    // Trouver l'utilisateur actuel dans la liste des utilisateurs
    const currentUser = utilisateurs.find(u => u.id === currentUserId);
    
    // Vérifier si l'utilisateur actuel est un Super Admin
    if (!currentUser || currentUser.role !== 'Super Admin') {
      toast.error("Seuls les Super Admins peuvent modifier les utilisateurs.", { autoClose: 5000 });
      return;
    }

    if (!hasPermission('Utilisateurs', 'modifier')) {
      toast.error("Permission de modification refusée.", { autoClose: 5000 });
      return;
    }
    if (!user?.id) {
      toast.error("Utilisateur invalide.", { autoClose: 5000 });
      return;
    }
    setUtilisateurEnEdition({
      ...user,
      password: "",
      confirmPassword: "",
    });
    setMode('edit');
    setModalAjoutVisible(true);
    setPasswordError(null);
    setFormErrors({});
    fermerActionsUtilisateur();
  };

  const handleMecanicienSelect = (mecanicien) => {
    setSelectedMecanicien(mecanicien);
    setMecanicienSearch(mecanicien.prenom + " " + mecanicien.nom);
    setShowMecanicienDropdown(false);
  };

  if (loading) return <div className="p-4">Chargement...</div>;
  if (!hasPermission('Utilisateurs', 'lire')) {
    return (
      <div className="bg-gray-50 min-h-screen font-sans p-4">
        <div className="text-red-600">Vous n'avez pas la permission de voir cette page.</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent">
              Gestion des Utilisateurs
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérer les accès et permissions des utilisateurs de la plateforme
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {hasPermission('Utilisateurs', 'creer') && (
              <button
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex-1 sm:flex-none justify-center"
                onClick={gererAjoutUtilisateur}
                disabled={isLoading}
                aria-label="Ajouter un nouvel utilisateur"
              >
                <Plus size={18} className="shrink-0" />
                <span className="whitespace-nowrap">Nouvel Utilisateur</span>
              </button>
            )}
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${showArchived ? 'bg-gray-600' : 'bg-gray-200'} text-${showArchived ? 'white' : 'gray-800'} hover:${showArchived ? 'bg-gray-700' : 'bg-gray-300'} shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 justify-center`}
              onClick={() => setShowArchived(!showArchived)}
              disabled={isLoading}
              aria-label={showArchived ? 'Voir les utilisateurs actifs' : 'Voir les utilisateurs archivés'}
            >
              <Inbox size={18} className="shrink-0" />
              <span className="whitespace-nowrap">{showArchived ? 'Voir Actifs' : 'Voir Archivés'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={termeRecherche}
              onChange={(e) => setTermeRecherche(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              disabled={isLoading}
              aria-label="Rechercher un utilisateur"
            />
          </div>

          <div className="relative">
            <select
              value={GroupeSelectionne}
              onChange={(e) => setGroupeSelectionne(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={isLoading}
              aria-label="Filtrer par groupe"
            >
              <option value="Groupe">Tous les Groupes</option>
              {groupesDisponibles.map((groupe, index) => (
                <option key={index} value={groupe}>
                  {groupe}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <select
              value={statutSelectionne}
              onChange={(e) => setStatutSelectionne(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={isLoading}
              aria-label="Filtrer par statut"
            >
              <option value="statut">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupe</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.length > 0 ? (
                  paginatedData.map((user, index) => (
                    <tr key={user.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 font-medium">
                            {(user.prenom ? user.prenom.charAt(0) : 'N') + (user.nomFamille ? user.nomFamille.charAt(0) : 'U')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.nom || 'Nom inconnu'}</div>
                            <div className="text-xs text-gray-500">{user.email || 'Email inconnu'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="truncate max-w-xs">{user.Groupe || 'Non spécifié'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'Gestionnaire de Parc' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'Mécanicien' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role || 'Non spécifié'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="truncate max-w-xs">{user.email || 'Non spécifié'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.telephone || 'Non spécifié'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.statut === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.statut || 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          {user.archived ? (
                            hasPermission('Utilisateurs', 'modifier') && (
                              <button
                                onClick={() => gererArchivageUtilisateur(user.id)}
                                className="flex ml-8 items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                disabled={isLoading}
                                aria-label="Désarchiver l'utilisateur"
                              >
                                <Archive size={16} />
                                <span>Désarchiver</span>
                              </button>
                            )
                          ) : (
                            (hasPermission('Utilisateurs', 'modifier') || hasPermission('Utilisateurs', 'supprimer')) && (
                              <>
                                <button
                                  className="action-button text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                  onClick={(e) => gererClicActionUtilisateur(user.id, e)}
                                  disabled={isLoading}
                                  aria-label="Plus d'actions"
                                >
                                  <MoreVertical size={18} />
                                </button>
                                {actionsUtilisateurVisible === user.id && (
                                  <div
                                    className={`action-menu absolute right-0 w-48 rounded-lg bg-gray-50 shadow-xl ring-1 ring-gray-200 z-10 animate-in fade-in duration-200 ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'}`}
                                  >
                                    <div className="py-1">
                                      {hasPermission('Utilisateurs', 'modifier') && (
                                        <button
                                          onClick={() => gererModificationUtilisateur(user)}
                                          className="flex items-center px-4 py-2.5 text-sm text-gray-800 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors duration-200"
                                          disabled={isLoading}
                                        >
                                          <Edit size={18} className="mr-2" />
                                          Modifier
                                        </button>
                                      )}
                                      {hasPermission('Utilisateurs', 'modifier') && (
                                        <button
                                          onClick={() => gererAffichagePermissions(user)}
                                          className="flex items-center px-4 py-2.5 text-sm text-gray-800 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors duration-200"
                                          disabled={isLoading}
                                        >
                                          <Lock size={18} className="mr-2" />
                                          Permissions
                                        </button>
                                      )}
                                      {hasPermission('Utilisateurs', 'modifier') && (
                                        <button
                                          onClick={() => gererArchivageUtilisateur(user.id)}
                                          className="flex items-center px-4 py-2.5 text-sm text-gray-800 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors duration-200"
                                          disabled={isLoading}
                                        >
                                          <Archive size={18} className="mr-2" />
                                          Archiver
                                        </button>
                                      )}
                                      {hasPermission('Utilisateurs', 'supprimer') && (
                                        <button
                                          onClick={() => gererSuppressionUtilisateur(user.id)}
                                          className="flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 w-full text-left transition-colors duration-200"
                                          disabled={isLoading}
                                        >
                                          <Trash2 size={18} className="mr-2" />
                                          Supprimer
                                        </button>
                                      )}
                                      <div className="border-t border-gray-200 my-1"></div>
                                      <button
                                        onClick={fermerActionsUtilisateur}
                                        className="flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-800 w-full text-left transition-colors duration-200"
                                        disabled={isLoading}
                                      >
                                        <X size={18} className="mr-2" />
                                        Fermer
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center animate-fadeIn">
                        <Users size={48} className="text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-600">Aucune donnée trouvée</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Aucun utilisateur ne correspond à vos critères de recherche.
                        </p>
                        <button
                          onClick={() => {
                            setTermeRecherche("");
                            setStatutSelectionne("statut");
                            setGroupeSelectionne("Groupe");
                            setCurrentPage(1);
                            setViewAll(false);
                          }}
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300"
                          disabled={isLoading}
                          aria-label="Réinitialiser les filtres"
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2 sm:mb-0">
              Total des utilisateurs : <span className="font-medium">{utilisateursFiltres.length}</span>
            </div>
            <div className="flex items-center gap-4">
              {!ViewAll && totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <button
                    className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <span className="mr-2">←</span>PRÉCÉDENTE
                  </button>
                  <span className="text-sm text-gray-500 mx-4">
                    Page {currentPage} sur {totalPages || 1}
                  </span>
                  <button
                    className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    SUIVANTE <span className="ml-2">→</span>
                  </button>
                </div>
              )}
              <button
                onClick={() => setViewAll(!ViewAll)}
                className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                disabled={isLoading}
                aria-label={ViewAll ? "Afficher par page" : "Afficher tout"}
              >
                {ViewAll ? "Afficher par page" : "Afficher tout"}
              </button>
              <button
                onClick={exporterCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
                disabled={isLoading}
                aria-label="Exporter en CSV"
              >
                <Download size={16} />
                Exporter en CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalPermissionsVisible && permissionsUtilisateur && hasPermission('Utilisateurs', 'modifier') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Permissions de {permissionsUtilisateur.nom}</h2>
                    <p className="text-sm text-gray-500">Gestion des accès et autorisations</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalPermissionsVisible(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  className={`px-4 py-2 rounded-lg font-medium ${permissionCategory === 'Administration' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setPermissionCategory('Administration')}
                  disabled={isLoading}
                  aria-label="Afficher les permissions Administration"
                >
                  Administration
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium ${permissionCategory === 'Maintenance' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setPermissionCategory('Maintenance')}
                  disabled={isLoading}
                  aria-label="Afficher les permissions Maintenance"
                >
                  Maintenance
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium ${permissionCategory === 'Atelier' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setPermissionCategory('Atelier')}
                  disabled={isLoading}
                  aria-label="Afficher les permissions Atelier"
                >
                  Atelier
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {permissionsByCategory[permissionCategory].map(sujet => (
                <div key={sujet.cle} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center space-x-3">
                    <span className="text-xl">{sujet.icone}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{sujet.nom}</h3>
                      <p className="text-xs text-gray-500">{sujet.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                    {sujet.cle === 'Vehicules' 
                      ? ['creer', 'lire', 'modifier', 'supprimer', 'modifierKilometrage'].map(perm => (
                          <div key={perm} className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {perm === 'creer' ? 'Créer' : 
                               perm === 'lire' ? 'Lire' : 
                               perm === 'modifier' ? 'Modifier' : 
                               perm === 'supprimer' ? 'Supprimer' : 
                               'Modifier Kilométrage'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={permissionsUtilisateur.permissions[sujet.cle]?.[perm] ?? false}
                                onChange={() => gererChangementPermission(sujet.cle, perm)}
                                disabled={isLoading}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))
                      : ['creer', 'lire', 'modifier', 'supprimer'].map(perm => (
                          <div key={perm} className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {perm === 'creer' ? 'Créer' : perm === 'lire' ? 'Lire' : perm === 'modifier' ? 'Modifier' : 'Supprimer'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={permissionsUtilisateur.permissions[sujet.cle]?.[perm] ?? false}
                                onChange={() => gererChangementPermission(sujet.cle, perm)}
                                disabled={isLoading}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))
                    }
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setModalPermissionsVisible(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button
                onClick={gererSauvegardePermissions}
                className={`px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
                aria-label="Enregistrer les permissions"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(mode === 'edit' || mode === 'add') && utilisateurEnEdition && (hasPermission('Utilisateurs', 'modifier') || hasPermission('Utilisateurs', 'creer')) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {mode === 'edit' ? 'Modifier Utilisateur' : 'Ajouter un Utilisateur'}
                </h2>
                <button
                  onClick={() => {
                    setMode(null);
                    setModalAjoutVisible(false);
                    setFormErrors({});
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    value={utilisateurEnEdition.prenom || ''}
                    onChange={(e) => setUtilisateurEnEdition({
                      ...utilisateurEnEdition,
                      prenom: e.target.value,
                      nom: `${e.target.value} ${utilisateurEnEdition.nomFamille || ''}`.trim(),
                    })}
                    className={`w-full px-4 py-2 border ${formErrors.prenom ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                    placeholder="Prénom"
                    disabled={isLoading}
                    aria-label="Prénom"
                  />
                  {formErrors.prenom && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {formErrors.prenom}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                  <input
                    type="text"
                    value={utilisateurEnEdition.nomFamille || ''}
                    onChange={(e) => setUtilisateurEnEdition({
                      ...utilisateurEnEdition,
                      nomFamille: e.target.value,
                      nom: `${utilisateurEnEdition.prenom || ''} ${e.target.value}`.trim(),
                    })}
                    className={`w-full px-4 py-2 border ${formErrors.nomFamille ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                    placeholder="Nom de famille"
                    disabled={isLoading}
                    aria-label="Nom de famille"
                  />
                  {formErrors.nomFamille && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {formErrors.nomFamille}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={utilisateurEnEdition.email || ''}
                    onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, email: e.target.value })}
                    className={`w-full px-4 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                    placeholder="email@exemple.com"
                    disabled={isLoading}
                    aria-label="Email"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Téléphone (facultatif)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={utilisateurEnEdition.telephone || ''}
                      onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, telephone: e.target.value })}
                      className={`w-full pl-10 px-4 py-2 border ${formErrors.telephone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                      placeholder="12345678"
                      disabled={isLoading}
                      aria-label="Téléphone"
                    />
                  </div>
                  {formErrors.telephone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {formErrors.telephone}
                    </p>
                  )}
                </div>

                {(mode === 'add' || (mode === 'edit' && utilisateurEnEdition.password)) && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Mot de passe {mode === 'edit' && '(facultatif)'}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key size={16} className="text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={utilisateurEnEdition.password || ''}
                          onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, password: e.target.value })}
                          className={`w-full pl-10 pr-10 py-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                          placeholder="••••••••"
                          disabled={isLoading}
                          aria-label="Mot de passe"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                          {showPassword ? (
                            <EyeOff size={16} className="text-gray-400 hover:text-gray-500" />
                          ) : (
                            <Eye size={16} className="text-gray-400 hover:text-gray-500" />
                          )}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle size={14} className="mr-1" /> {formErrors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Confirmer mot de passe</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key size={16} className="text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={utilisateurEnEdition.confirmPassword || ''}
                          onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, confirmPassword: e.target.value })}
                          className={`w-full pl-10 pr-10 py-2 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                          placeholder="••••••••"
                          disabled={isLoading}
                          aria-label="Confirmer le mot de passe"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                          aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} className="text-gray-400 hover:text-gray-500" />
                          ) : (
                            <Eye size={16} className="text-gray-400 hover:text-gray-500" />
                          )}
                        </button>
                      </div>
                      {formErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle size={14} className="mr-1" /> {formErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Groupe</label>
                  <select
                    value={utilisateurEnEdition.Groupe || ''}
                    onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, Groupe: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                    aria-label="Groupe"
                  >
                    <option value="">Sélectionner un groupe</option>
                    {groupesDisponibles.map((groupe, index) => (
                      <option key={index} value={groupe}>
                        {groupe}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <select
                    value={utilisateurEnEdition.statut || 'Actif'}
                    onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, statut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                    disabled={isLoading}
                    aria-label="Statut"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Rôle</label>
                  <select
                    value={utilisateurEnEdition.role || ''}
                    onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                    disabled={isLoading || location.state?.role === 'Mécanicien'}
                    aria-label="Rôle"
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Gestionnaire de Parc">Gestionnaire de Parc</option>
                    <option value="Mécanicien">Mécanicien</option>
                  </select>
                </div>

                {utilisateurEnEdition.role === 'Mécanicien' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Garage</label>
                      <select
                        value={utilisateurEnEdition.garage || ''}
                        onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, garage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                        required
                      >
                        <option value="">Sélectionner un garage</option>
                        {garages.map((garage) => (
                          <option key={garage._id} value={garage._id}>
                            {garage.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Date d'embauche</label>
                      <input
                        type="date"
                        value={utilisateurEnEdition.dateEmboche || ''}
                        onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, dateEmboche: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Expérience (années)</label>
                      <input
                        type="number"
                        value={utilisateurEnEdition.experience || ''}
                        onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, experience: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        min="0"
                        max="50"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Spécialisation</label>
                      <input
                        type="text"
                        value={utilisateurEnEdition.specialisation || ''}
                        onChange={(e) => setUtilisateurEnEdition({ ...utilisateurEnEdition, specialisation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMode(null);
                  setModalAjoutVisible(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button
                onClick={gererSauvegardeUtilisateur}
                className={`px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
                aria-label={mode === 'edit' ? 'Mettre à jour' : 'Ajouter'}
              >
                {isLoading ? 'Enregistrement...' : (mode === 'edit' ? 'Mettre à jour' : 'Ajouter')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {actionConfirmation.type === 'suppression'
                      ? 'Confirmer la suppression'
                      : actionConfirmation.type === 'archivage' && utilisateurs.find(u => u.id === actionConfirmation.userId)?.archived
                      ? 'Confirmer le désarchivage'
                      : 'Confirmer l\'archivage'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {actionConfirmation.type === 'suppression'
                      ? 'Cette action est irréversible. Voulez-vous continuer ?'
                      : actionConfirmation.type === 'archivage' && utilisateurs.find(u => u.id === actionConfirmation.userId)?.archived
                      ? 'Voulez-vous désarchiver cet utilisateur ?'
                      : 'Voulez-vous archiver cet utilisateur ?'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => gererConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button
                onClick={() => gererConfirmation(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${actionConfirmation.type === 'suppression' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${actionConfirmation.type === 'suppression' ? 'red' : 'indigo'}-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
                aria-label={actionConfirmation.type === 'suppression' ? 'Supprimer' : 'Confirmer'}
              >
                {isLoading ? 'Traitement...' : (actionConfirmation.type === 'suppression' ? 'Supprimer' : 'Confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionUtilisateurs;
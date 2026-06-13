import React, { useState, useEffect, Component } from "react";
import axios from "axios";
import {
  FaTruck,
  FaWrench,
  FaCarCrash,
  FaCheckCircle,
  FaCar,
  FaUserTie,
  FaBuilding,
  FaPlus,
  FaMinus,
  FaCarSide,
  FaUserCog,
  FaDollarSign,
  FaTools,
} from "react-icons/fa";
import { User, FileBarChart, BarChart3, PieChartIcon, LineChart, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis,
  Line,
  ComposedChart,
} from "recharts";
import usePermissions from "../../hooks/usePermissions";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8 text-red-600">
          <h2 className="text-xl font-bold mb-2">Une erreur s'est produite</h2>
          <p>{this.state.error?.message || "Quelque chose s'est mal passé. Veuillez réessayer plus tard."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Palette de couleurs modernes
const COLORS = {
  primary: {
    main: "#4F46E5",
    light: "#818CF8",
    dark: "#3730A3",
    gradient: ["#4F46E5", "#818CF8"],
  },
  secondary: {
    main: "#0EA5E9",
    light: "#38BDF8",
    dark: "#0369A1",
    gradient: ["#0EA5E9", "#38BDF8"],
  },
  success: {
    main: "#10B981",
    light: "#34D399",
    dark: "#047857",
    gradient: ["#10B981", "#34D399"],
  },
  warning: {
    main: "#F59E0B",
    light: "#FBBF24",
    dark: "#B45309",
    gradient: ["#F59E0B", "#FBBF24"],
  },
  error: {
    main: "#EF4444",
    light: "#F87171",
    dark: "#B91C1C",
    gradient: ["#EF4444", "#F87171"],
  },
  purple: {
    main: "#8B5CF6",
    light: "#A78BFA",
    dark: "#6D28D9",
    gradient: ["#8B5CF6", "#A78BFA"],
  },
  teal: {
    main: "#14B8A6",
    light: "#2DD4BF",
    dark: "#0F766E",
    gradient: ["#14B8A6", "#2DD4BF"],
  },
  orange: {
    main: "#F97316",
    light: "#FB923C",
    dark: "#C2410C",
    gradient: ["#F97316", "#FB923C"],
  },
  gray: {
    main: "#6B7280",
    light: "#9CA3AF",
    dark: "#374151",
    gradient: ["#6B7280", "#9CA3AF"],
  },
};

const GROUP_COLORS = {
  "3S": COLORS.primary.main,
  YY: COLORS.success.main,
  BB: COLORS.warning.main,
  TT: COLORS.error.main,
  MM: COLORS.purple.main,
  LT: COLORS.secondary.main,
  RM: COLORS.teal.main,
};

const VEHICLE_STATES = ["Fonctionnel", "Reparation", "Accidenté", "stock"];

const STATE_COLORS = {
  Fonctionnel: COLORS.success.main,
  Reparation: COLORS.warning.main,
  Accidenté: COLORS.error.main,
  stock: COLORS.secondary.main,
};

// Gradient definitions
const gradientDefinitions = (id, colors) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
    <stop offset="95%" stopColor={colors[1]} stopOpacity={0.2} />
  </linearGradient>
);

const radialGradientDefinition = (id, colors) => (
  <radialGradient id={id} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
    <stop offset="0%" stopColor={colors[0]} stopOpacity={0.9} />
    <stop offset="100%" stopColor={colors[1]} stopOpacity={0.8} />
  </radialGradient>
);

// Custom Tooltip, Legend, PieLabel, formatDate, formatNumber
const CustomTooltip = ({ active, payload, label, valueFormatter, labelFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 transition-all duration-300 animate-in fade-in-50 slide-in-from-top-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
              ></div>
              <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.name}: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {valueFormatter ? valueFormatter(entry.value, entry.name) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
          ></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
      style={{ textShadow: "0px 0px 3px rgba(0,0,0,0.5)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.getDate() + "/" + (date.getMonth() + 1);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

const DashboardContentAdmin = ({ statistiques = {} }) => {
  const { permissions, loading: permissionsLoading, error: permissionsError, hasPermission } = usePermissions();
  const [groupesVehicules, setGroupesVehicules] = useState([]);
  const [showMoreGroups, setShowMoreGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [users, setUsers] = useState([]);
  const [repairTrends, setRepairTrends] = useState([]);
  const [vehicleStateData, setVehicleStateData] = useState([]);
  const [groupVehicleData, setGroupVehicleData] = useState([]);
  const [vehicleAgeData, setVehicleAgeData] = useState([]);
  const [vehiclePerformanceData, setVehiclePerformanceData] = useState([]);
  const [maintenanceEfficiencyData, setMaintenanceEfficiencyData] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("month");

  const defaultStats = {
    vehiculesEnAtelier: 0,
    reparationsTerminees: 0,
    reparationsEnCours: 0,
    vehiculesEnAttente: 0,
    vehiculesNonAssignes: 0,
    nombreUrulisateur: 0,
    nombreTotalVehicules: 0,
    nombreConducteurs: 0,
    vehiculesFonctionnels: 0,
    vehiculesStock: 0,
    vehiculesAccidentes: 0,
    vehiculesReparation: 0,
  };

  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Retrieve auth token (assuming it's stored in localStorage)
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const [vehiclesResponse, driversResponse, maintenancesResponse, usersResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/vehicules/all", {
            params: { populate: 'proprietaire conducteur' },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/drivers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/maintenance/maintenances", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Process vehicles
        const vehiclesData = Array.isArray(vehiclesResponse.data)
          ? vehiclesResponse.data
          : vehiclesResponse.data?.data || [];
        const numberedVehicles = vehiclesData
          .map((vehicle, index) => ({
            ...vehicle,
            numero: vehicle.numero || index + 1,
          }))
          .sort((a, b) => a.numero - b.numero);
        setVehicles(numberedVehicles);

        // Process drivers
        const driversData = Array.isArray(driversResponse.data)
          ? driversResponse.data
          : driversResponse.data?.data || [];
        setDrivers(driversData);

        // Process maintenances
        const maintenancesData = Array.isArray(maintenancesResponse.data)
          ? maintenancesResponse.data
          : maintenancesResponse.data?.data || [];
        setMaintenances(maintenancesData);

        // Process users
        const usersData = Array.isArray(usersResponse.data)
          ? usersResponse.data
          : usersResponse.data?.data || [];
        setUsers(usersData);

        // Compute maintenance-related statistics
        const enCoursMaintenances = maintenancesData.filter(m => m.statut === "En cours");
        const termineeMaintenances = maintenancesData.filter(m => m.statut === "Terminée");
        const attenteMaintenances = maintenancesData.filter(m => m.statut === "Backlog" || m.statut === "À faire");

        const vehiculesEnAtelier = new Set(enCoursMaintenances.map(m => m.vehicule?._id)).size;
        const vehiculesEnAttente = new Set(attenteMaintenances.map(m => m.vehicule?._id)).size;

        // Compute vehicle state statistics
        const vehiculesFonctionnels = numberedVehicles.filter(v => v.etat === "Fonctionnel").length;
        const vehiculesReparation = numberedVehicles.filter(v => v.etat === "Reparation").length;
        const vehiculesAccidentes = numberedVehicles.filter(v => v.etat === "Accidenté").length;
        const vehiculesStock = numberedVehicles.filter(v => v.etat === "stock").length;

        // Compute unassigned vehicles
        const vehiculesNonAssignes = numberedVehicles.filter(v => !v.conducteur || !v.conducteur._id).length;

        // Compute trends based on selected period
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentWeek = Math.floor(today.getDate() / 7);

        const currentPeriodStats = {
          vehiculesEnAtelier: 0,
          reparationsTerminees: 0,
          reparationsEnCours: 0,
          vehiculesEnAttente: 0,
          vehiculesNonAssignes: 0,
        };
        const nextPeriodStats = {
          vehiculesEnAtelier: 0,
          reparationsTerminees: 0,
          reparationsEnCours: 0,
          vehiculesEnAttente: 0,
          vehiculesNonAssignes: 0,
        };

        maintenancesData.forEach(m => {
          if (!m.datePrevue) return;
          const date = new Date(m.datePrevue);
          if (isNaN(date.getTime())) return;

          const year = date.getFullYear();
          const month = date.getMonth();
          const week = Math.floor(date.getDate() / 7);

          let currentPeriod = false;
          let nextPeriod = false;

          if (trendPeriod === "year") {
            currentPeriod = year === currentYear;
            nextPeriod = year === currentYear + 1;
          } else if (trendPeriod === "month") {
            currentPeriod = year === currentYear && month === currentMonth;
            nextPeriod = year === (currentMonth + 1 > 11 ? currentYear + 1 : currentYear) && month === (currentMonth + 1) % 12;
          } else if (trendPeriod === "week") {
            currentPeriod = year === currentYear && month === currentMonth && week === currentWeek;
            nextPeriod = year === currentYear && month === currentMonth && week === currentWeek + 1;
          }

          const statsBucket = currentPeriod ? currentPeriodStats : nextPeriod ? nextPeriodStats : null;

          if (statsBucket) {
            if (m.statut === "En cours") {
              statsBucket.reparationsEnCours += 1;
              if (!statsBucket.vehiculeIdsEnCours) statsBucket.vehiculeIdsEnCours = new Set();
              statsBucket.vehiculeIdsEnCours.add(m.vehicule?._id);
            } else if (m.statut === "Terminée") {
              statsBucket.reparationsTerminees += 1;
            } else if (m.statut === "Backlog" || m.statut === "À faire") {
              statsBucket.vehiculesEnAttente += 1;
              if (!statsBucket.vehiculeIdsAttente) statsBucket.vehiculeIdsAttente = new Set();
              statsBucket.vehiculeIdsAttente.add(m.vehicule?._id);
            }
          }
        });

        // For vehiculesNonAssignes, trends are static as they don't depend on time periods
        currentPeriodStats.vehiculesNonAssignes = vehiculesNonAssignes;
        nextPeriodStats.vehiculesNonAssignes = vehiculesNonAssignes;

        currentPeriodStats.vehiculesEnAtelier = currentPeriodStats.vehiculeIdsEnCours?.size || 0;
        currentPeriodStats.vehiculesEnAttente = currentPeriodStats.vehiculeIdsAttente?.size || 0;
        nextPeriodStats.vehiculesEnAtelier = nextPeriodStats.vehiculeIdsEnCours?.size || 0;
        nextPeriodStats.vehiculesEnAttente = nextPeriodStats.vehiculeIdsAttente?.size || 0;

        const calculateTrend = (current, next) => {
          const difference = next - current;
          return {
            trend: `${difference >= 0 ? "+" : ""}${difference}`,
            trendUp: difference >= 0 ? true : difference < 0 ? false : null,
          };
        };

        setStats({
          ...defaultStats,
          vehiculesEnAtelier,
          reparationsTerminees: termineeMaintenances.length,
          reparationsEnCours: enCoursMaintenances.length,
          vehiculesEnAttente,
          vehiculesNonAssignes,
          nombreUrulisateur: usersData.length,
          nombreTotalVehicules: numberedVehicles.length,
          nombreConducteurs: driversData.length,
          vehiculesFonctionnels,
          vehiculesStock,
          vehiculesAccidentes,
          vehiculesReparation,
          trends: {
            vehiculesEnAtelier: calculateTrend(currentPeriodStats.vehiculesEnAtelier, nextPeriodStats.vehiculesEnAtelier),
            reparationsTerminees: calculateTrend(currentPeriodStats.reparationsTerminees, nextPeriodStats.reparationsTerminees),
            reparationsEnCours: calculateTrend(currentPeriodStats.reparationsEnCours, nextPeriodStats.reparationsEnCours),
            vehiculesEnAttente: calculateTrend(currentPeriodStats.vehiculesEnAttente, nextPeriodStats.vehiculesEnAttente),
            vehiculesNonAssignes: calculateTrend(currentPeriodStats.vehiculesNonAssignes, nextPeriodStats.vehiculesNonAssignes),
          },
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!permissionsLoading && hasPermission('maintenance', 'lire')) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [permissionsLoading, hasPermission, trendPeriod]);

  useEffect(() => {
    if (vehicles.length > 0) {
      const groupStats = {};

      vehicles.forEach((vehicle) => {
        const groupName = vehicle.proprietaire?.nom?.trim() || "Groupe Inconnu";
        
        if (!groupStats[groupName]) {
          const initialEtats = {};
          VEHICLE_STATES.forEach((state) => {
            initialEtats[state] = 0;
          });

          groupStats[groupName] = {
            id: groupName.substring(0, 2).toUpperCase(),
            nom: groupName,
            nombreVehicules: 0,
            etats: initialEtats,
            conducteurs: new Set(),
          };
        }

        const group = groupStats[groupName];
        group.nombreVehicules += 1;

        const etat = vehicle.etat || "Indéfini";
        if (VEHICLE_STATES.includes(etat)) {
          group.etats[etat] += 1;
        } else {
          group.etats["Indéfini"] = (group.etats["Indéfini"] || 0) + 1;
        }

        if (vehicle.conducteur?._id) {
          group.conducteurs.add(vehicle.conducteur._id);
        }
      });

      const groupes = Object.values(groupStats).map((group) => ({
        ...group,
        conducteurs: group.conducteurs.size,
      }));

      setGroupesVehicules(groupes);

      const stateData = [
        { name: "Fonctionnel", value: stats.vehiculesFonctionnels, color: STATE_COLORS.Fonctionnel },
        { name: "Réparation", value: stats.vehiculesReparation, color: STATE_COLORS.Reparation },
        { name: "Accidenté", value: stats.vehiculesAccidentes, color: STATE_COLORS.Accidenté },
        { name: "Stock", value: stats.vehiculesStock, color: STATE_COLORS.stock },
      ];
      setVehicleStateData(stateData);

      const groupData = groupes.slice(0, 6).map((group) => {
        const data = { name: group.nom };
        VEHICLE_STATES.forEach((state) => {
          data[state] = group.etats[state] || 0;
        });
        return data;
      });
      setGroupVehicleData(groupData);

      const ageData = groupes.slice(0, 5).map((group) => {
        return {
          group: group.nom,
          "0-2 ans": Math.floor(Math.random() * 20) + 5,
          "3-5 ans": Math.floor(Math.random() * 30) + 10,
          "6-8 ans": Math.floor(Math.random() * 25) + 8,
          "9+ ans": Math.floor(Math.random() * 15) + 3,
        };
      });
      setVehicleAgeData(ageData);

      const performanceData = [];
      for (let i = 0; i < 20; i++) {
        performanceData.push({
          age: Math.floor(Math.random() * 10) + 1,
          maintenance: Math.floor(Math.random() * 10000) + 1000,
          efficiency: Math.floor(Math.random() * 100) + 50,
          name: `Véhicule ${i + 1}`,
          group: groupes[Math.floor(Math.random() * groupes.length)]?.nom || "Groupe A",
        });
      }
      setVehiclePerformanceData(performanceData);
    }
  }, [vehicles, stats]);

  useEffect(() => {
    if (maintenances.length > 0) {
      const today = new Date();
      const trendData = [];

      // Initialize 30 days of data
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        trendData.push({
          date: dateString,
          reparationsTerminees: 0,
          reparationsEnCours: 0,
          vehiculesEnAttente: 0,
        });
      }

      // Aggregate maintenance data
      maintenances.forEach((maintenance) => {
        if (!maintenance.datePrevue) {
          console.warn(`Maintenance ${maintenance._id} has no datePrevue, skipping.`);
          return;
        }
        const date = new Date(maintenance.datePrevue);
        if (isNaN(date.getTime())) {
          console.warn(`Maintenance ${maintenance._id} has invalid datePrevue: ${maintenance.datePrevue}, skipping.`);
          return;
        }
        const maintenanceDate = date.toISOString().split("T")[0];
        const index = trendData.findIndex((d) => d.date === maintenanceDate);

        if (index !== -1) {
          if (maintenance.statut === "Terminée") {
            trendData[index].reparationsTerminees += 1;
          } else if (maintenance.statut === "En cours") {
            trendData[index].reparationsEnCours += 1;
          } else if (maintenance.statut === "Backlog" || maintenance.statut === "À faire") {
            trendData[index].vehiculesEnAttente += 1;
          }
        }
      });

      setRepairTrends(trendData);

      // Maintenance efficiency (simulated, as no backend data available)
      const efficiencyData = [];
      for (let i = 0; i < 12; i++) {
        const month = new Date(today.getFullYear(), i, 1);
        efficiencyData.push({
          month: month.toLocaleDateString("fr-FR", { month: "short" }),
          tempsReparation: Math.floor(Math.random() * 5) + 2,
          coutMoyen: Math.floor(Math.random() * 500) + 300,
          tauxReussite: Math.floor(Math.random() * 20) + 75,
        });
      }
      setMaintenanceEfficiencyData(efficiencyData);
    }
  }, [maintenances]);

  const statsCards = [
    {
      title: "Véhicules en atelier",
      value: stats.vehiculesEnAtelier,
      icon: <FaTruck className="text-indigo-600" />,
      trend: stats.trends?.vehiculesEnAtelier?.trend || "0",
      trendUp: stats.trends?.vehiculesEnAtelier?.trendUp,
    },
    {
      title: "Réparations terminées",
      value: stats.reparationsTerminees,
      icon: <FaCheckCircle className="text-emerald-600" />,
      trend: stats.trends?.reparationsTerminees?.trend || "0",
      trendUp: stats.trends?.reparationsTerminees?.trendUp,
    },
    {
      title: "Réparations en cours",
      value: stats.reparationsEnCours,
      icon: <FaWrench className="text-amber-600" />,
      trend: stats.trends?.reparationsEnCours?.trend || "0",
      trendUp: stats.trends?.reparationsEnCours?.trendUp,
    },
    {
      title: "Véhicules en attente",
      value: stats.vehiculesEnAttente,
      icon: <FaCarCrash className="text-rose-600" />,
      trend: stats.trends?.vehiculesEnAttente?.trend || "0",
      trendUp: stats.trends?.vehiculesEnAttente?.trendUp,
    },
    {
      title: "Véhicules non assignés",
      value: stats.vehiculesNonAssignes,
      icon: <FaCarSide className="text-purple-600" />,
      trend: stats.trends?.vehiculesNonAssignes?.trend || "0",
      trendUp: stats.trends?.vehiculesNonAssignes?.trendUp,
    },
    {
      title: "Utilisateurs",
      value: stats.nombreUrulisateur,
      icon: <User className="text-blue-600" />,
      trend: "0",
      trendUp: null,
    },
    {
      title: "Total véhicules",
      value: stats.nombreTotalVehicules,
      icon: <FaCar className="text-teal-600" />,
      trend: "0",
      trendUp: null,
    },
    {
      title: "Conducteurs",
      value: stats.nombreConducteurs,
      icon: <FaUserTie className="text-gray-600" />,
      trend: "0",
      trendUp: null,
    },
    {
      title: "Groupes de véhicules",
      value: groupesVehicules.length,
      icon: <FaBuilding className="text-orange-600" />,
      trend: "0",
      trendUp: null,
    },
  ];

  const displayedGroups = showMoreGroups ? groupesVehicules : groupesVehicules.slice(0, 4);

  const groupesCards = displayedGroups.map((groupe) => {
    const details = [
      { label: "Véhicules", value: groupe.nombreVehicules },
      { label: "Conducteurs", value: groupe.conducteurs },
    ];
    VEHICLE_STATES.forEach((state) => {
      details.push({ label: state, value: groupe.etats[state] || 0 });
    });

    return {
      title: groupe.nom,
      value: groupe.nombreVehicules,
      icon: <FileBarChart style={{ color: GROUP_COLORS[groupe.id] || "#6366F1" }} />,
      details,
    };
  });

  const handleToggleMoreGroups = () => {
    setShowMoreGroups(!showMoreGroups);
  };

  const handleTrendPeriodChange = (e) => {
    setTrendPeriod(e.target.value);
  };

  if (permissionsLoading) return <div className="text-center p-8">Chargement des permissions...</div>;
  if (permissionsError) return <div className="text-center p-8 text-red-600">Erreur: {permissionsError}</div>;
  if (!hasPermission('maintenance', 'lire')) {
    return (
      <div className="text-center p-8 text-red-600">
        Vous n'avez pas la permission de voir les statistiques des maintenances.
      </div>
    );
  }
  if (loading) return <div className="text-center p-8">Chargement des données...</div>;
  if (error) return <div className="text-center p-8 text-red-600">Erreur: {error}</div>;

  return (
    <ErrorBoundary>
      <div className="ml-0 md:ml-64 pt-16 md:pt-24 p-4 md:p-8 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="mt-6 flex justify-between items-center">
          <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
            Statistiques Générales
          </h2>
          <div className="relative">
            <select
              value={trendPeriod}
              onChange={handleTrendPeriodChange}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="week">1 semaine</option>
              <option value="month">1 mois</option>
              <option value="year">1 an</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {statsCards.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="p-2 md:p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  {React.cloneElement(item.icon, {
                    size: typeof window !== "undefined" && window.innerWidth < 768 ? 20 : 24,
                  })}
                </div>
                <div
                  className={`text-xs md:text-sm ${
                    item.trendUp ? "text-emerald-600" : item.trendUp === false ? "text-rose-600" : "text-gray-500"
                  }`}
                >
                  {item.trend}
                </div>
              </div>
              <div>
                <h3 className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{item.title}</h3>
                <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* État des Véhicules */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <FaCar className="text-indigo-600" size={24} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                État des Véhicules
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {vehicleStateData.map((entry, index) => (
                      <radialGradientDefinition
                        key={`gradient-${index}`}
                        id={`pieGradient${index}`}
                        colors={[entry.color, entry.color.replace("rgb", "rgba").replace(")", ", 0.7)")]}
                      />
                    ))}
                  </defs>
                  <Pie
                    data={vehicleStateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    cornerRadius={3}
                    dataKey="value"
                    nameKey="name"
                    label={renderCustomizedPieLabel}
                  >
                    {vehicleStateData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#pieGradient${index})`}
                        stroke={entry.color}
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendances des Maintenances */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <FaWrench className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                Tendances des Maintenances
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={repairTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTerminees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorEnCours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorAttente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reparationsTerminees"
                    stackId="1"
                    stroke="#10B981"
                    fill="url(#colorTerminees)"
                    name="Maintenances terminées"
                    activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reparationsEnCours"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="url(#colorEnCours)"
                    name="Maintenances en cours"
                    activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="vehiculesEnAttente"
                    stackId="1"
                    stroke="#EF4444"
                    fill="url(#colorAttente)"
                    name="Maintenances en attente"
                    activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance des Techniciens */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <FaUserCog className="text-purple-600" size={24} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                Performance des Techniciens
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={maintenanceEfficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorTauxReussite" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                    domain={[0, 10]}
                    label={{ value: "Jours", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fontSize: 12 } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={{ stroke: "#E5E7EB" }}
                    domain={[0, 100]}
                    label={{ value: "%", angle: 90, position: "insideRight", style: { textAnchor: "middle", fontSize: 12 } }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="tempsReparation"
                    name="Temps moyen de réparation (jours)"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tauxReussite"
                    name="Taux de réussite (%)"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, stroke: "#4F46E5", fill: "white" }}
                    activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Types de Réparations par Marque */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-1 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <FaTools className="text-teal-600" size={24} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                Types de Réparations par Marque
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      marque: 'Renault',
                      mécanique: 25,
                      électrique: 15,
                      carrosserie: 10,
                      pneumatique: 8,
                      autres: 5
                    },
                    {
                      marque: 'Peugeot',
                      mécanique: 20,
                      électrique: 12,
                      carrosserie: 8,
                      pneumatique: 6,
                      autres: 4
                    },
                    {
                      marque: 'Citroën',
                      mécanique: 18,
                      électrique: 10,
                      carrosserie: 7,
                      pneumatique: 5,
                      autres: 3
                    },
                    {
                      marque: 'Toyota',
                      mécanique: 22,
                      électrique: 14,
                      carrosserie: 9,
                      pneumatique: 7,
                      autres: 4
                    },
                    {
                      marque: 'Volkswagen',
                      mécanique: 21,
                      électrique: 13,
                      carrosserie: 8,
                      pneumatique: 6,
                      autres: 4
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorMecanique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorElectrique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorCarrosserie" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorPneumatique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorAutres" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B7280" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6B7280" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="marque"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                    label={{ 
                      value: "Nombre d'interventions", 
                      angle: -90, 
                      position: "insideLeft", 
                      style: { 
                        textAnchor: 'middle',
                        fontSize: 12,
                        fill: '#6B7280'
                      } 
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const total = payload.reduce((sum, entry) => sum + entry.value, 0);
                        return (
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Total: {total} interventions
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '20px'
                    }}
                  />
                  <Bar dataKey="mécanique" name="Mécanique" stackId="a" fill="url(#colorMecanique)" />
                  <Bar dataKey="électrique" name="Électrique" stackId="a" fill="url(#colorElectrique)" />
                  <Bar dataKey="carrosserie" name="Carrosserie" stackId="a" fill="url(#colorCarrosserie)" />
                  <Bar dataKey="pneumatique" name="Pneumatique" stackId="a" fill="url(#colorPneumatique)" />
                  <Bar dataKey="autres" name="Autres" stackId="a" fill="url(#colorAutres)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
            Statistiques par groupe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
            {groupesCards.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-1 md:p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                    {React.cloneElement(item.icon, {
                      size: typeof window !== "undefined" && window.innerWidth < 768 ? 18 : 24,
                    })}
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {item.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{detail.label}</span>
                      <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupesVehicules.length > 4 && (
              <div
                onClick={handleToggleMoreGroups}
                className="relative bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer group h-full min-h-full flex flex-col justify-center items-center"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-all duration-300 mb-3 md:mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 dark:border-blue-500 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
                  {showMoreGroups ? (
                    <FaMinus
                      className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transform transition-transform duration-300"
                      size={typeof window !== "undefined" && window.innerWidth < 768 ? 18 : 24}
                    />
                  ) : (
                    <FaPlus
                      className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transform transition-transform duration-300"
                      size={typeof window !== "undefined" && window.innerWidth < 768 ? 18 : 24}
                    />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-sm md:text-lg font-medium text-gray-900 dark:text-white">
                    {showMoreGroups ? "Masquer" : "Afficher plus"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {showMoreGroups
                      ? `Cacher ${groupesVehicules.length - 4} groupes`
                      : `Voir ${groupesVehicules.length - 4} autres groupes`}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 border-blue-400 dark:border-blue-500 transform translate-x-1 -translate-y-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardContentAdmin;
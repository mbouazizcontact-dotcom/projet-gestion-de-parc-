
import DashboardContentAdmin from "../../Components/DashboardContent/DashboardContentAdmin";
import DashboardContentTech from "../../Components/DashboardContent/DashboardContentTech";
import DefaultLayout from "../../layouts/DefaultLayout";

// Dans votre Dashboard.js
export default function Dashboard() {
  const role = localStorage.getItem("role");

  const renderDashboardContent = () => {
    // Utilisons toLowerCase() pour ignorer la casse
    const roleLC = role ? role.toLowerCase().trim() : '';
    
    switch (roleLC) {
      case 'admin':
        return <DashboardContentAdmin />;
      case 'technicien':
        return <DashboardContentTech />;
      default:
        return (
          <div className="ml-64 pt-24 p-6 mt-6 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
            Rôle inconnu ou accès non autorisé: "{role}"
          </div>
        );
    }
  };

  return (
    <DefaultLayout>
      {renderDashboardContent()}
    </DefaultLayout>
  );
}


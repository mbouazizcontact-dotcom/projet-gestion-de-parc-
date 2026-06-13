import { FaDollarSign, FaUserCog, FaCheckCircle, FaShoppingCart, FaPercent, FaFileInvoiceDollar, FaProjectDiagram, FaTools, FaCar, FaWrench } from 'react-icons/fa';
import RepairTypeChart from '../Chart/RepairTypeChart';
import MaintenanceCostChart from '../Chart/MaintenanceCostChart';
import TechnicianPerformanceChart from '../Chart/TechnicianPerformanceChart';
import FichTable from "../Tables/FichTable";
import ClientTable from "../Tables/ClientTable";
import FactTable from "../Tables/FactTable";
import AppareilAReparaerTable from '../Tables/Technicien/AppareilAReparaerTable';
import TableProduit from '../Tables/Technicien/TableProduit';
import TechTable from '../Tables/Direction/TechTable';
import RscTable from '../Tables/Direction/RscTable';

export default function DashboardContentDR() {
  return (
    <div className="ml-64 pt-24 p-6 mt-6 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Techniciens Actifs",
            value: "9",
            icon: <FaUserCog size={21} color="#422afb" />
          },
          {
            title: "Véhicules en Maintenance",
            value: "12",
            icon: <FaCar size={21} color="#422afb" />
          },
          {
            title: "Réparations en Cours",
            value: "12",
            icon: <FaWrench size={21} color="#422afb" />
          },
          {
            title: "Réparations Terminées",
            value: "259",
            icon: <FaCheckCircle size={21} color="#422afb" />
          },
          {
            title: "Bénéfices Ce Mois",
            value: "120,000 DT",
            icon: <FaDollarSign size={21} color="#422afb" />
          },
          {
            title: "Dépenses Ce Mois",
            value: "75,000 DT",
            icon: <FaShoppingCart size={21} color="#422afb" />
          },
          {
            title: "Factures à Encaisser",
            value: "30,000 DT",
            icon: <FaFileInvoiceDollar size={21} color="#422afb" />
          },
          {
            title: "Marge Bénéficiaire Nette",
            value: "25 %",
            icon: <FaPercent size={21} color="#422afb" />
          }
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f4f7fe] dark:bg-gray-700">
              {item.icon}
            </div>
            <div className="ml-4">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{item.title}</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FaTools className="text-[#422afb]" />
            Types de Réparations
          </h3>
          <RepairTypeChart />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FaDollarSign className="text-[#422afb]" />
            Coûts de Maintenance
          </h3>
          <MaintenanceCostChart />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FaUserCog className="text-[#422afb]" />
            Performance des Techniciens
          </h3>
          <TechnicianPerformanceChart />
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-6">
        <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
          <ClientTable />
        </div>
        <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
          <TechTable />
        </div>
        <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
          <RscTable />
        </div>
        <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
          <FactTable />
        </div>
        <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
          <FichTable />
        </div>
        <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
          <AppareilAReparaerTable />
        </div>
        <div className="p-0 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <TableProduit />
        </div>
      </div>
    </div>
  );
}

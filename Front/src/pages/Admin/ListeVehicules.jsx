import DefaultLayout from "../../layouts/DefaultLayout";
import VehiculeTable from "./VehiculeTable";

export default function ListeVehicules() {
  return (
    <DefaultLayout>
    <div className="ml-64 pt-24 p-3 mt-6 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
      <VehiculeTable></VehiculeTable>
    </div>
  </DefaultLayout>
  )
}

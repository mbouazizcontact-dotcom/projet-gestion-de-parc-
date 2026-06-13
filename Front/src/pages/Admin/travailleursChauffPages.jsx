import DefaultLayout from "../../layouts/DefaultLayout";
import DriverTable from "./chauffTable";

export default function TravailleursConducteurPage() {
  return (
    <DefaultLayout>
      <div className="ml-0 sm:ml-64 pt-16 sm:pt-24 p-4 sm:p-6 mt-4 sm:mt-6 space-y-4 sm:space-y-6 bg-[#f4f7fe] dark:bg-gray-900 min-h-screen">
        <DriverTable />
      </div>
    </DefaultLayout>
  );
}
import DefaultLayout from "../../layouts/DefaultLayout";
import CarburantContent from "../../Components/DashboardContent/CarburantContent";

export default function CarburantRoute() {
  return (
    <DefaultLayout>
      <div className="ml-64 pt-24 p-6 mt-10 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
        <CarburantContent />
      </div>
    </DefaultLayout>
  );
} 
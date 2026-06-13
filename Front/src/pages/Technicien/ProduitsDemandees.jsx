import DefaultLayout from "../../layouts/DefaultLayout";
import ViewAllDemands from "./DemandePieceTable";

export default function ProduitsDemandees() {
  return (
    <DefaultLayout>
      <div className="ml-64 pt-24 p-6 mt-6 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
    <ViewAllDemands></ViewAllDemands>
      </div>
    </DefaultLayout>
  )
}

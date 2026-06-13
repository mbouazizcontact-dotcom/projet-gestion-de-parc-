import DefaultLayout from "../../../layouts/DefaultLayout";
import GarageTable from "./GarageTable";

export default function GarageTable2() {
  return (
    <DefaultLayout>
        <div className="ml-64 pt-24 p-6 mt-10 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
            <GarageTable></GarageTable>
        </div>
        </DefaultLayout>
  
  )
}

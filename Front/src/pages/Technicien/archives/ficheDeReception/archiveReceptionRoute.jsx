import DefaultLayout from "../../../../layouts/DefaultLayout";
import ArchiveReceptionTable from "./ArchiveReceptionTable";

export default function ArchiveReceptionTable1() {
  return (
    <DefaultLayout>
        <div className="ml-64 pt-24 p-6 mt-10 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
            <ArchiveReceptionTable></ArchiveReceptionTable>
        </div>
        </DefaultLayout>
  )
}

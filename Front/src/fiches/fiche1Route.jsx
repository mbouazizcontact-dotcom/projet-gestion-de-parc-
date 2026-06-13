import DefaultLayout from "../layouts/DefaultLayout";
import FicheReparation from "./fiche1";

export default function FicheRep() {
  return (
    <DefaultLayout>
        <div className="ml-64 pt-24 p-6 mt-10 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
            <FicheReparation></FicheReparation>
        </div>
    </DefaultLayout>
  )
}

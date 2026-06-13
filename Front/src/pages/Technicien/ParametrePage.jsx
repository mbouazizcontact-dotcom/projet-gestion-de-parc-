import Page3 from "../../Components/Parametre/page3";
import DefaultLayout from "../../layouts/DefaultLayout";

export default function ParametrePage() {

  return (
    <DefaultLayout>
      <div className="ml-64 pt-24  mt-4 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
        <div className="flex">
          <main className="flex-1 ">
            <Page3 />
          </main>
        </div>
      </div>
    </DefaultLayout>
  );
}

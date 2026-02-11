import Header from "@/components/Layout/Header";
import StudioMain from "./Main";
import Configuration from "./Configuration";
import Response from "./Response";


function Studio() {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white border border-border-light rounded-xl">
      <Header currentPage="studio" />
      <div className="flex-1 flex overflow-hidden">
        <StudioMain />
        <Configuration />
      </div>
      <Response />
    </main>
  );
}

export default Studio;

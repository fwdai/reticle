
import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";

import StudioMain from "./Main";
import Configuration from "./Configuration";
import Response from "./Response";


function Studio() {
  return (
    <MainContent>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <StudioMain />
        <Configuration />
      </div>
      <Response />
    </MainContent>
  );
}

export default Studio;

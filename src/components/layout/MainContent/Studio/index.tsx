import StudioMain from "./Main";
import Configuration from "./Configuration";
import Response from "./Response";

function Studio() {
  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <StudioMain />
        <Configuration />
      </div>
      <Response />
    </>
  );
}

export default Studio;

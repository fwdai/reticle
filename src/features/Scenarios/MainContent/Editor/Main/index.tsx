import { useContext } from "react";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import { TabTitle } from "@/components/ui/Tabs/TabTitle";
import { StudioContext, type EditorTabIndex } from "@/contexts/StudioContext";
import Files from "./Files";
import History from "./History";
import Prompt from "./Prompt";
import SystemMessage from "./System";
import Tools from "./Tools";

const panelContentClass =
  "h-full min-h-0 p-6 overflow-y-auto custom-scrollbar bg-[#FCFDFF]";

function StudioMain() {
  const context = useContext(StudioContext);
  const fileCount = context?.studioState.currentScenario.attachments?.length ?? 0;
  const toolsCount = (context?.studioState.currentScenario.tools?.length ?? 0)
    + (context?.studioState.currentScenario.enabledSharedToolIds?.length ?? 0);

  return (
    <Tabs
      activeIndex={context?.activeEditorTab ?? 0}
      onActiveIndexChange={(index) => context?.setActiveEditorTab(index as EditorTabIndex)}
    >
      <TabPanel title="System">
        <div className={panelContentClass}>
          <SystemMessage />
        </div>
      </TabPanel>
      <TabPanel title="Input">
        <div className={panelContentClass}>
          <Prompt />
        </div>
      </TabPanel>
      <TabPanel title="History">
        <div className={panelContentClass}>
          <History />
        </div>
      </TabPanel>
      <TabPanel title={<TabTitle label="Files" count={fileCount} />}>
        <div className={panelContentClass}>
          <Files />
        </div>
      </TabPanel>
      <TabPanel title={<TabTitle label="Tools" count={toolsCount} />}>
        <div className={panelContentClass}>
          <Tools />
        </div>
      </TabPanel>
    </Tabs>
  );
}

export default StudioMain;

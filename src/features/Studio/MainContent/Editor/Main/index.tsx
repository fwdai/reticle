import { useContext } from "react";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import { StudioContext } from "@/contexts/StudioContext";
import Files from "./Files";
import History from "./History";
import Prompt from "./Prompt";
import SystemMessage from "./System";
import Tools from "./Tools";

function StudioMain() {
  const context = useContext(StudioContext);
  const fileCount = context?.studioState.currentScenario.attachments?.length ?? 0;
  const filesTabTitle = (
    <span className="flex items-center gap-1.5">
      Files
      <span className="rounded-md bg-primary/15 px-1 py-0.5 text-[10px] font-bold text-primary">{fileCount}</span>
    </span>
  );

  return (
    <Tabs>
      <TabPanel title="System">
        <SystemMessage />
      </TabPanel>
      <TabPanel title="Input">
        <Prompt />
      </TabPanel>
      <TabPanel title="History">
        <History />
      </TabPanel>
      <TabPanel title={filesTabTitle}>
        <Files />
      </TabPanel>
      <TabPanel title="Tools">
        <Tools />
      </TabPanel>
    </Tabs>
  );
}

export default StudioMain;

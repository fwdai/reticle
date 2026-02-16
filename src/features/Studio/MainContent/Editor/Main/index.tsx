import { useContext } from "react";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import { TabTitle } from "@/components/ui/Tabs/TabTitle";
import { StudioContext } from "@/contexts/StudioContext";
import Files from "./Files";
import History from "./History";
import Prompt from "./Prompt";
import SystemMessage from "./System";
import Tools from "./Tools";

function StudioMain() {
  const context = useContext(StudioContext);
  const fileCount = context?.studioState.currentScenario.attachments?.length ?? 0;
  const toolsCount = context?.studioState.currentScenario.tools?.length ?? 0;

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
      <TabPanel title={<TabTitle label="Files" count={fileCount} />}>
        <Files />
      </TabPanel>
      <TabPanel title={<TabTitle label="Tools" count={toolsCount} />}>
        <Tools />
      </TabPanel>
    </Tabs>
  );
}

export default StudioMain;

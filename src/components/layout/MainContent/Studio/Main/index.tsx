import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import Context from "./Context";
import Prompt from "./Prompt";
import SystemMessage from "./System";
import Tools from "./Tools";

function StudioMain() {
  return (
    <Tabs>
      <TabPanel title="System">
        <SystemMessage />
      </TabPanel>
      <TabPanel title="Input">
        <Prompt />
      </TabPanel>
      <TabPanel title="Context">
        <Context />
      </TabPanel>
      <TabPanel title="Tools">
        <Tools />
      </TabPanel>
    </Tabs>
  );
}

export default StudioMain;

import { TemplatesProvider } from "@/contexts/TemplatesContext";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

function TemplatesPage() {
  return (
    <TemplatesProvider>
      <Sidebar />
      <MainContent />
    </TemplatesProvider>
  );
}

export default TemplatesPage;

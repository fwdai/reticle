import { StudioProvider } from '@/contexts/StudioContext';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

function StudioPage() {
  return (
    <StudioProvider>
      <Sidebar />
      <MainContent />
    </StudioProvider>
  );
}

export default StudioPage;

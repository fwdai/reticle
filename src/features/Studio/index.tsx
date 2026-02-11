import { StudioProvider } from '@/contexts/StudioContext';
import Sidebar from './Sidebar';
import MainContent from '@/components/Layout/MainContent/Studio';

function StudioPage() {
  return (
    <StudioProvider>
      <Sidebar />
      <MainContent />
    </StudioProvider>
  );
}

export default StudioPage;

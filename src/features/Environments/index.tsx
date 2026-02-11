import Sidebar from './Sidebar';
import EnvironmentsMainContent from '@/components/Layout/MainContent/Environments';

function EnvironmentsPage() {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <EnvironmentsMainContent />
    </div>
  );
}

export default EnvironmentsPage;

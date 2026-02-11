import TemplatesMainContent from '@/components/Layout/MainContent';
import Sidebar from './Sidebar';

function TemplatesPage() {
  return (
    <>
      <Sidebar />
      <TemplatesMainContent currentPage="templates" />
    </ >
  );
}

export default TemplatesPage;

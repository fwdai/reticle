import Sidebar from './Sidebar';
import RunsMainContent from '@/components/Layout/MainContent';

function RunsPage() {
  return (
    <>
      <Sidebar />
      <RunsMainContent currentPage="runs" />
    </ >
  );
}

export default RunsPage;

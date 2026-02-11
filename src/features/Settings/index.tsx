import Sidebar from './Sidebar';
import SettingsMainContent from '@/components/Layout/MainContent';

function SettingsPage() {
  return (
    <>
      <Sidebar />
      <SettingsMainContent currentPage="settings" />
    </ >
  );
}

export default SettingsPage;

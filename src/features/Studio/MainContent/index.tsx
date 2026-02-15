import { useContext } from 'react';
import MainContent from '@/components/Layout/MainContent';
import { StudioContext } from '@/contexts/StudioContext';

import Header from '../Header';
import Editor from './Editor';
import Visualizer from './Visualizer';

function Studio() {
  const context = useContext(StudioContext);
  const viewMode = context?.viewMode ?? 'editor';

  return (
    <MainContent>
      <Header />
      {viewMode === 'editor' ? <Editor /> : <Visualizer />}
    </MainContent>
  );
}

export default Studio;

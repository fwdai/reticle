import { Folder } from "lucide-react";
import { useContext } from 'react';
import { StudioContext } from '@/contexts/StudioContext';

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in Studio sidebar');
    return null;
  }

  const { studioState } = context;
  const { collections } = studioState;

  // Fetch collections on mount or after actions that might change them
  // For now, it's fetched by StudioProvider on mount

  return (
    <>
      <h2 className="text-lg font-bold tracking-tight mb-6 text-sidebar-text">Scenarios</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Collections</h3>
          <nav className="space-y-1">
            {collections.map(collection => (
              <a key={collection.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors" href="#">
                <div className="flex items-center gap-3">
                  <Folder className="text-sm text-sidebar-text" size={16} />
                  <span className="text-sm text-sidebar-text">{collection.name}</span>
                </div>
                {/* <span className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded border border-gray-100">12</span> */}
              </a>
            ))}
          </nav>
        </div>

      </div>
    </>
  );
}

export default Studio;

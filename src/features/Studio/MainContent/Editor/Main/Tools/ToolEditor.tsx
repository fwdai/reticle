import React, { useState, useEffect } from 'react';
import { Tool, ToolParameter } from './types';
import ParameterEditor from './ParameterEditor';
import MockResponseEditor from './MockResponseEditor';
import { Button } from '@/components/ui/button';

interface ToolEditorProps {
  selectedTool: Tool | null;
  onSave: (tool: Tool) => void;
}

const ToolEditor: React.FC<ToolEditorProps> = ({ selectedTool, onSave }) => {
  const [editableTool, setEditableTool] = useState<Tool | null>(selectedTool);

  useEffect(() => {
    setEditableTool(selectedTool);
  }, [selectedTool]);

  if (!editableTool) {
    return (
      <div className="p-6 text-center text-text-muted">
        Select a tool to edit or create a new one.
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editableTool) return;
    const { name, value } = e.target;
    setEditableTool({ ...editableTool, [name]: value });
  };

  const handleParametersChange = (parameters: ToolParameter[]) => {
    if (!editableTool) return;
    setEditableTool({ ...editableTool, parameters });
  };

  const handleMockResponseChange = (mockResponse: string) => {
    if (!editableTool) return;
    setEditableTool({ ...editableTool, mockResponse });
  };

  const handleSave = () => {
    if (editableTool) {
      onSave(editableTool);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* General Info Section */}
        <div className="bg-white border border-border-light rounded-xl shadow-sm">
          <div className="p-4">
            <label htmlFor="name" className="text-sm font-medium text-text-main">
              Tool Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={editableTool.name}
              onChange={handleInputChange}
              placeholder="e.g., getCurrentWeather"
              className="mt-1 block w-full px-3 py-2 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="p-4 border-t border-border-light">
            <label htmlFor="llmDescription" className="text-sm font-medium text-text-main">
              Description for LLM
            </label>
            <textarea
              id="llmDescription"
              name="llmDescription"
              value={editableTool.llmDescription}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe what this tool does for the LLM."
              className="mt-1 block w-full p-3 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary resize-y"
            />
          </div>
          <div className="p-4 border-t border-border-light">
            <label htmlFor="developerDescription" className="text-sm font-medium text-text-main">
              Description for Developer
            </label>
            <textarea
              id="developerDescription"
              name="developerDescription"
              value={editableTool.developerDescription}
              onChange={handleInputChange}
              rows={2}
              placeholder="Internal notes or description for the developer."
              className="mt-1 block w-full p-3 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary resize-y"
            />
          </div>
        </div>

        {/* Parameters Section */}
        <div className="bg-white border border-border-light rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b border-border-light bg-sidebar-light/50">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Parameters
            </h3>
          </div>
          <div className="p-4">
            <ParameterEditor parameters={editableTool.parameters} onChange={handleParametersChange} />
          </div>
        </div>

        {/* Mock Response Section */}
        <div className="bg-white border border-border-light rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b border-border-light bg-sidebar-light/50">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Mock Response
            </h3>
          </div>
          <div className="p-4">
            <MockResponseEditor mockResponse={editableTool.mockResponse} onChange={handleMockResponseChange} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Tool</Button>
        </div>
      </div>
    </div>
  );
};

export default ToolEditor;

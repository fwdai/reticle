import React from 'react';
import { Tool } from './types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface ToolListProps {
  tools: Tool[];
  selectedTool: Tool | null;
  onSelectTool: (tool: Tool) => void;
  onNewTool: () => void;
  onDeleteTool: (toolId: string) => void;
}

const ToolList: React.FC<ToolListProps> = ({ tools, selectedTool, onSelectTool, onNewTool, onDeleteTool }) => {
  return (
    <div className="flex flex-col h-full">
      <Button onClick={onNewTool} variant="outline" className="mb-4">
        <Plus className="mr-2 h-4 w-4" />
        Create New Tool
      </Button>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {tools.map(tool => (
            <li
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className={clsx(
                "cursor-pointer p-2 rounded-md flex justify-between items-center group",
                { "bg-accent text-accent-foreground": selectedTool?.id === tool.id },
                { "hover:bg-accent hover:text-accent-foreground": selectedTool?.id !== tool.id }
              )}
            >
              <span className="truncate">{tool.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTool(tool.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ToolList;

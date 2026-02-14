import React, { useState, useEffect } from 'react';
import ToolList from './ToolList';
import ToolEditor from './ToolEditor';
import { Tool, } from './types';
import { v4 as uuidv4 } from 'uuid';

const sampleTools: Tool[] = [
  {
    id: uuidv4(),
    name: 'getCurrentWeather',
    developerDescription: 'A function to get the current weather for a given location.',
    llmDescription: 'Gets the current weather for a specific location.',
    parameters: [
      { id: uuidv4(), name: 'location', type: 'string', description: 'The city and state, e.g., San Francisco, CA', required: true },
      { id: uuidv4(), name: 'unit', type: 'enum', description: 'The unit to use for the temperature', required: false, enumValues: ['celsius', 'fahrenheit'] },
    ],
    mockResponse: '{ "temperature": "72", "unit": "fahrenheit", "conditions": "Sunny" }',
    enabled: true,
  },
  {
    id: uuidv4(),
    name: 'searchFlights',
    developerDescription: 'Searches for flights between two locations on a given date.',
    llmDescription: 'Searches for flights.',
    parameters: [
      { id: uuidv4(), name: 'origin', type: 'string', description: 'The departure airport code, e.g., SFO', required: true },
      { id: uuidv4(), name: 'destination', type: 'string', description: 'The arrival airport code, e.g., JFK', required: true },
      { id: uuidv4(), name: 'date', type: 'string', description: 'The date of the flight in YYYY-MM-DD format.', required: true },
    ],
    mockResponse: '[]',
    enabled: false,
  },
];

const LOCAL_STORAGE_KEY = 'reticle-tools';

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    try {
      const savedTools = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedTools) {
        setTools(JSON.parse(savedTools));
      } else {
        setTools(sampleTools);
      }
    } catch (error) {
      console.error("Failed to parse tools from localStorage", error);
      setTools(sampleTools);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tools));
  }, [tools]);

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool);
  };

  const handleNewTool = () => {
    const newTool: Tool = {
      id: uuidv4(),
      name: 'NewTool',
      developerDescription: '',
      llmDescription: '',
      parameters: [],
      mockResponse: '{}',
      enabled: false,
    };
    setTools([...tools, newTool]);
    setSelectedTool(newTool);
  };

  const handleSaveTool = (toolToSave: Tool) => {
    const toolExists = tools.some(t => t.id === toolToSave.id);
    let newTools;
    if (toolExists) {
      newTools = tools.map(t => (t.id === toolToSave.id ? toolToSave : t));
    } else {
      newTools = [...tools, toolToSave];
    }
    setTools(newTools);
  };

  const handleDeleteTool = (toolId: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      const newTools = tools.filter(t => t.id !== toolId);
      setTools(newTools);
      if (selectedTool?.id === toolId) {
        setSelectedTool(null);
      }
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 max-w-xs border-r border-border-light">
        <ToolList
          tools={tools}
          selectedTool={selectedTool}
          onSelectTool={handleSelectTool}
          onNewTool={handleNewTool}
          onDeleteTool={handleDeleteTool}
        />
      </div>
      <div className="flex-1">
        <ToolEditor selectedTool={selectedTool} onSave={handleSaveTool} />
      </div>
    </div>
  );
};

export default Tools;

import React from 'react';
import { ToolParameter } from './types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ParameterEditorProps {
  parameters: ToolParameter[];
  onChange: (parameters: ToolParameter[]) => void;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({ parameters, onChange }) => {

  const handleParamChange = (id: string, field: keyof ToolParameter, value: any) => {
    const updatedParameters = parameters.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChange(updatedParameters);
  };

  const addParameter = () => {
    const newParam: ToolParameter = {
      id: uuidv4(),
      name: '',
      type: 'string',
      description: '',
      required: false,
    };
    onChange([...parameters, newParam]);
  };

  const removeParameter = (id: string) => {
    onChange(parameters.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {parameters.map((param) => (
        <div key={param.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border-light">
          <input
            type="text"
            placeholder="name"
            value={param.name}
            onChange={e => handleParamChange(param.id, 'name', e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <select
            value={param.type}
            onChange={e => handleParamChange(param.id, 'type', e.target.value)}
            className="px-3 py-2 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="enum">enum</option>
          </select>
          <input
            type="text"
            placeholder="description"
            value={param.description}
            onChange={e => handleParamChange(param.id, 'description', e.target.value)}
            className="flex-2 px-3 py-2 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary w-1/3"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={param.required}
              onChange={e => handleParamChange(param.id, 'required', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label className="text-sm text-text-muted">Required</label>
          </div>
          <Button variant="ghost" size="icon" className="text-text-muted hover:text-destructive" onClick={() => removeParameter(param.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
       <Button variant="outline" size="sm" className="mt-2" onClick={addParameter}>
        <Plus size={16} className="mr-2" />
        Add Parameter
      </Button>
    </div>
  );
};

export default ParameterEditor;

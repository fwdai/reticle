import React from 'react';

interface MockResponseEditorProps {
  mockResponse: string;
  onChange: (value: string) => void;
}

const MockResponseEditor: React.FC<MockResponseEditorProps> = ({ mockResponse, onChange }) => {
  return (
    <div>
      <textarea
        className="w-full h-48 p-3 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary resize-y"
        value={mockResponse}
        onChange={e => onChange(e.target.value)}
        placeholder='{ "status": "success", "data": { "temperature": 72, "unit": "fahrenheit" } }'
      />
    </div>
  );
};

export default MockResponseEditor;

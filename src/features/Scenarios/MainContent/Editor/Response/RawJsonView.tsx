import type { ResponseState } from '@/contexts/StudioContext';

interface RawJsonViewProps {
  response: ResponseState;
}

function RawJsonView({ response }: RawJsonViewProps) {
  const jsonString = JSON.stringify(response, null, 2);

  return (
    <div className="max-w-4xl mx-auto">
      <pre className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-x-auto text-sm font-mono text-text-main whitespace-pre-wrap break-words">
        {jsonString}
      </pre>
    </div>
  );
}

export default RawJsonView;

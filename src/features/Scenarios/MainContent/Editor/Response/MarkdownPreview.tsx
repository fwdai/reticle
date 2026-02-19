import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2" {...props} />
          ),
          code: (codeProps) => {
            const { node, className, children, inline, ...props } = codeProps as typeof codeProps & {
              inline?: boolean;
            };
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <pre className="bg-gray-100 p-2 rounded-md mb-2 overflow-x-auto">
                <code className={`language-${match[1]}`} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-200 px-1 py-0.5 rounded-md" {...props}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;

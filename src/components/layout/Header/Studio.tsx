import { useContext } from 'react';
import { Play, Save, Share, Loader2 } from "lucide-react";
import { StudioContext } from '@/contexts/StudioContext';
import { generateText } from '@/lib/registry';

function StudioHeader() {
  const context = useContext(StudioContext);

  const handleRunClick = async () => {
    if (!context) {
      console.error('StudioContext not found');
      return;
    }

    const { systemPrompt, userPrompt, configuration } = context.studioState.currentInteraction;

    // Set loading state
    context.setStudioState((prev) => ({
      ...prev,
      isLoading: true,
      response: null,
    }));

    try {
      console.log('System Prompt:', systemPrompt);
      console.log('User Prompt:', userPrompt);
      console.log('Running with configuration:', configuration);

      const result = await generateText(userPrompt, { systemPrompt, ...configuration });
      // Latency is now measured at the HTTP request level and returned from generateText
      const latency = result.latency;


      // Store response in state
      const usage = result.usage;
      context.setStudioState((prev) => ({
        ...prev,
        isLoading: false,
        response: {
          text: result.text,
          usage: usage ? {
            promptTokens: usage.inputTokens,
            completionTokens: usage.outputTokens,
            totalTokens: usage.totalTokens,
          } : undefined,
          latency,
        },
      }));
    } catch (error) {
      console.error('Error generating text:', error);

      // Store error in state
      // Note: latency won't be available on error since the request didn't complete
      context.setStudioState((prev) => ({
        ...prev,
        isLoading: false,
        response: {
          text: '',
          error: error instanceof Error ? error.message : 'An unknown error occurred',
          latency: undefined,
        },
      }));
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-text-muted">Studio</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-text-main">New Interaction</span>
        {false ? (
          <span className="bg-green-50 text-[10px] text-green-600 font-bold px-2 py-0.5 rounded-full border border-green-100 ml-2 uppercase tracking-tight">Saved</span>
        ) : (
          <span className="bg-gray-100 text-[10px] text-gray-600 font-bold px-2 py-0.5 rounded-full border border-gray-100 ml-2 uppercase tracking-tight">Unsaved</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white shadow-sm text-text-main">Editor</button>
          <button className="px-4 py-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors">Visualizer</button>
        </div>
        <div className="h-6 w-px bg-border-light"></div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunClick}
            disabled={context?.studioState.isLoading}
            className="bg-primary hover:bg-[#048fa9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
            {context?.studioState.isLoading ? (
              <Loader2 size={18} className="font-bold animate-spin" />
            ) : (
              <Play size={18} className="font-bold" />
            )}
            Run
          </button>
          <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Save size={18} />
          </button>
          <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Share size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

export default StudioHeader;

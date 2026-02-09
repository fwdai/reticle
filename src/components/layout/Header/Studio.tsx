import { useContext } from 'react';
import { Play, Save, Share, Loader2 } from "lucide-react";
import { StudioContext } from '@/contexts/StudioContext';
import { generateText } from '@/lib/registry';

function StudioHeader() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in StudioHeader');
    // Fallback or throw an error depending on desired behavior
    return null;
  }

  const { studioState, setStudioState, saveScenario } = context;
  const { currentScenario, isLoading, isSaved } = studioState;
  const { systemPrompt, userPrompt, configuration } = currentScenario;

  const handleRunClick = async () => {
    // Set loading state
    setStudioState((prev) => ({
      ...prev,
      isLoading: true,
      response: null,
    }));

    try {
      console.log('System Prompt:', systemPrompt);
      console.log('User Prompt:', userPrompt);
      console.log('Running with configuration:', configuration);

      const result = await generateText(userPrompt, { systemPrompt, ...configuration });
      const latency = result.latency;

      // Store response in state
      const usage = result.usage;
      setStudioState((prev) => ({
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
        isSaved: false, // Running modifies the scenario, so it becomes unsaved
      }));
    } catch (error) {
      console.error('Error generating text:', error);

      // Store error in state
      setStudioState((prev) => ({
        ...prev,
        isLoading: false,
        response: {
          text: '',
          error: error instanceof Error ? error.message : 'An unknown error occurred',
          latency: undefined,
        },
        isSaved: false, // An error implies the state might be different or not successfully processed
      }));
    }
  };

  const handleSaveClick = async () => {
    // For now, using null to indicate that the name should be taken from currentScenario.name
    await saveScenario(null); 
  };

  const statusBadge = isSaved ? (
    <span className="bg-green-50 text-[10px] text-green-600 font-bold px-2 py-0.5 rounded-full border border-green-100 ml-2 uppercase tracking-tight">Saved</span>
  ) : (
    <span className="bg-gray-100 text-[10px] text-gray-600 font-bold px-2 py-0.5 rounded-full border border-gray-100 ml-2 uppercase tracking-tight">Unsaved</span>
  );

  return (
    <>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-text-muted">Scenario</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-text-main">{currentScenario.name}</span>
        {statusBadge}
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
            disabled={isLoading}
            className="bg-primary hover:bg-[#048fa9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
            {isLoading ? (
              <Loader2 size={18} className="font-bold animate-spin" />
            ) : (
              <Play size={18} className="font-bold" />
            )}
            Run
          </button>
          <button 
            onClick={handleSaveClick}
            disabled={isLoading || isSaved} // Cannot save if loading or already saved
            className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
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
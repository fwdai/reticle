import reticleLogo from "@/assets/reticle-logo.svg";

/**
 * Full-screen loading state shown during app startup.
 * Follows Tauri recommendation: main window with loading indicator rather than
 * a separate splash window for fast-loading apps.
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sidebar-light">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Icon with Rings */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer Ring */}
          <div className="absolute size-36 border-2 border-dashed border-blue-300 rounded-full animate-pulse-ring-outer" />
          {/* Inner Ring */}
          <div className="absolute size-28 border-2 border-dashed border-primary rounded-full animate-pulse-ring-inner" />
          {/* Central Icon */}
          <div className="relative flex items-center justify-center size-16 bg-primary rounded-xl shadow-xl shadow-primary/50">
            <img
              src={reticleLogo}
              alt="Reticle"
              className="size-8 animate-pulse-icon"
            />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500 w-48 text-center">
          Launching Reticle<span className="loading-ellipsis w-1.5 inline-block"></span>
        </p>
      </div>
    </div>
  );
}

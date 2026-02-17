import { useContext, useCallback } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import type { AttachedFile } from "@/contexts/StudioContext";
import { FileDropZone } from "./FileDropZone";
import { FileList as AttachedFileList } from "./FileList";
import { SupportedFormatsHint } from "./SupportedFormatsHint";

function Files() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error("Files must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const files = studioState.currentScenario.attachments ?? [];

  const setFiles = useCallback(
    (newFiles: AttachedFile[] | ((prev: AttachedFile[]) => AttachedFile[])) => {
      setStudioState((prev) => ({
        ...prev,
        currentScenario: {
          ...prev.currentScenario,
          attachments:
            typeof newFiles === "function"
              ? newFiles(prev.currentScenario.attachments ?? [])
              : newFiles,
        },
      }));
    },
    [setStudioState]
  );

  const addFiles = useCallback(
    (fileList: globalThis.FileList) => {
      const newFiles: AttachedFile[] = Array.from(fileList).map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [setFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [setFiles]
  );

  return (
    <div className="max-w-4xl flex flex-col space-y-5 mx-auto">
      <FileDropZone onFilesAdded={addFiles} />

      {files.length > 0 && (
        <AttachedFileList
          files={files}
          onRemove={removeFile}
          onClearAll={() => setFiles([])}
        />
      )}

      <SupportedFormatsHint />
    </div>
  );
}

export default Files;

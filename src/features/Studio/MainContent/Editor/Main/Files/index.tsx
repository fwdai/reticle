import { useContext, useCallback, useState } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import type { AttachedFile } from "@/contexts/StudioContext";
import { FileDropZone } from "./FileDropZone";
import { FileList as AttachedFileList } from "./FileList";
import { SupportedFormatsHint } from "./SupportedFormatsHint";
import { storeFileAsBlob } from "./attachmentService";
import { insertAttachment } from "@/lib/storage";

function Files() {
  const context = useContext(StudioContext);
  const [isAdding, setIsAdding] = useState(false);

  if (!context) {
    throw new Error("Files must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const files = studioState.currentScenario.attachments ?? [];
  const scenarioId = studioState.scenarioId;

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
    async (fileList: globalThis.FileList) => {
      if (fileList.length === 0) return;
      setIsAdding(true);
      try {
        const baseIndex = files.length;
        const newFiles: AttachedFile[] = [];
        for (let i = 0; i < fileList.length; i++) {
          const f = fileList[i];
          const path = await storeFileAsBlob(f);
          const attachment: AttachedFile = {
            id: crypto.randomUUID(),
            name: f.name,
            size: f.size,
            type: f.type || "application/octet-stream",
            path,
          };
          newFiles.push(attachment);

          if (scenarioId) {
            await insertAttachment(attachment, scenarioId, baseIndex + i);
          }
        }
        setFiles((prev) => [...prev, ...newFiles]);
      } catch (err) {
        console.error("Failed to add files:", err);
      } finally {
        setIsAdding(false);
      }
    },
    [setFiles, scenarioId, files.length]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [setFiles]
  );

  return (
    <div className="max-w-4xl flex flex-col space-y-5 mx-auto">
      <FileDropZone onFilesAdded={addFiles} disabled={isAdding} />

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

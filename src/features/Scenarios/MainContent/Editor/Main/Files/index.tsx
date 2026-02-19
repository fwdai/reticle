import { useContext, useCallback, useState } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import type { AttachedFile } from "@/contexts/StudioContext";
import { FileDropZone } from "./FileDropZone";
import { FileList as AttachedFileList } from "./FileList";
import { SupportedFormatsHint } from "./SupportedFormatsHint";
import { storeFileAsBlob, deleteBlob } from "./attachmentService";
import {
  insertAttachment,
  deleteAttachmentById,
  deleteAttachmentsByScenarioId,
} from "@/lib/storage";

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
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;

      try {
        if (file.path) {
          await deleteBlob(file.path);
        }
        if (scenarioId) {
          await deleteAttachmentById(id);
        }
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } catch (err) {
        console.error("Failed to remove file:", err);
      }
    },
    [setFiles, scenarioId, files]
  );

  const handleClearAll = useCallback(async () => {
    try {
      for (const file of files) {
        if (file.path) {
          await deleteBlob(file.path);
        }
      }
      if (scenarioId) {
        await deleteAttachmentsByScenarioId(scenarioId);
      }
      setFiles([]);
    } catch (err) {
      console.error("Failed to clear files:", err);
    }
  }, [setFiles, scenarioId, files]);

  return (
    <div className="max-w-4xl flex flex-col space-y-5 mx-auto">
      <FileDropZone onFilesAdded={addFiles} disabled={isAdding} />

      {files.length > 0 && (
        <AttachedFileList
          files={files}
          onRemove={removeFile}
          onClearAll={handleClearAll}
        />
      )}

      <SupportedFormatsHint />
    </div>
  );
}

export default Files;

import { invoke } from "@tauri-apps/api/core";
import { getOrCreateAccount } from "@/lib/storage";

/**
 * Deletes a blob file from the app data workspace folder.
 */
export async function deleteBlob(blobPath: string): Promise<void> {
  await invoke("delete_attachment_blob", { blobPath });
}

/**
 * Reads a File and returns its content as base64 string.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Stores a file in the app data folder at workspaces/<account_id>/blobs/<sha256>
 * and returns the full path to the stored blob.
 */
export async function storeFileAsBlob(file: File): Promise<string> {
  const account = await getOrCreateAccount();
  const base64 = await fileToBase64(file);
  return invoke<string>("store_attachment_blob", {
    fileBase64: base64,
    accountId: account.id,
  });
}

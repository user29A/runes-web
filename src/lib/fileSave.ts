const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

type SaveFilePickerWindow = Window &
  typeof globalThis & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  };

export function getSequenceFilename(
  runeNames: string[],
  extension: string,
): string {
  const base = runeNames
    .map((name) => name.replace(INVALID_FILENAME_CHARS, "_").trim())
    .filter(Boolean)
    .join("-");

  const normalizedExtension = extension.startsWith(".")
    ? extension
    : `.${extension}`;

  return `${base || "sequence"}${normalizedExtension}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function saveBlobWithPicker(
  blob: Blob,
  suggestedName: string,
  fileType: {
    description: string;
    mimeType: string;
    extension: string;
  },
): Promise<void> {
  const savePicker = (window as SaveFilePickerWindow).showSaveFilePicker;

  if (!savePicker) {
    downloadBlob(blob, suggestedName);
    return;
  }

  try {
    const handle = await savePicker({
      suggestedName,
      types: [
        {
          description: fileType.description,
          accept: { [fileType.mimeType]: [fileType.extension] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    throw error;
  }
}
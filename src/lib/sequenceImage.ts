import { getSequenceFilename, saveBlobWithPicker } from "@/lib/fileSave";
import { type Rune, getRuneImagePath } from "@/lib/runes";

const BACKGROUND_THRESHOLD = 24;
const SYMBOL_HEIGHT = 128;
const SYMBOL_GAP = 10;
const CANVAS_PADDING = 16;
const JPEG_QUALITY = 0.92;

type ContentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CroppedSymbol = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

export type SequenceImageResult = {
  dataUrl: string;
  blob: Blob;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function getContentBounds(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): ContentBounds | null {
  const { data } = context.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      if (
        red > BACKGROUND_THRESHOLD ||
        green > BACKGROUND_THRESHOLD ||
        blue > BACKGROUND_THRESHOLD
      ) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function extractSymbolCanvas(
  image: HTMLImageElement,
): Promise<CroppedSymbol> {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext("2d");
  if (!sourceContext) {
    throw new Error("Canvas not supported");
  }

  sourceContext.drawImage(image, 0, 0);
  const bounds = getContentBounds(
    sourceContext,
    image.naturalWidth,
    image.naturalHeight,
  );

  const cropCanvas = document.createElement("canvas");
  const cropContext = cropCanvas.getContext("2d");
  if (!cropContext) {
    throw new Error("Canvas not supported");
  }

  if (!bounds) {
    cropCanvas.width = image.naturalWidth;
    cropCanvas.height = image.naturalHeight;
    cropContext.drawImage(image, 0, 0);
    return {
      canvas: cropCanvas,
      width: cropCanvas.width,
      height: cropCanvas.height,
    };
  }

  cropCanvas.width = bounds.width;
  cropCanvas.height = bounds.height;
  cropContext.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height,
  );

  return {
    canvas: cropCanvas,
    width: bounds.width,
    height: bounds.height,
  };
}

export async function buildSequenceImage(
  runes: Rune[],
): Promise<SequenceImageResult | null> {
  if (runes.length === 0) {
    return null;
  }

  const symbols = await Promise.all(
    runes.map(async (rune) => {
      const image = await loadImage(getRuneImagePath(rune));
      return extractSymbolCanvas(image);
    }),
  );

  const scaledWidths = symbols.map(
    (symbol) => (symbol.width * SYMBOL_HEIGHT) / symbol.height,
  );
  const totalWidth =
    CANVAS_PADDING * 2 +
    scaledWidths.reduce((sum, width) => sum + width, 0) +
    SYMBOL_GAP * Math.max(symbols.length - 1, 0);
  const totalHeight = CANVAS_PADDING * 2 + SYMBOL_HEIGHT;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = Math.max(1, Math.ceil(totalWidth));
  outputCanvas.height = totalHeight;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) {
    throw new Error("Canvas not supported");
  }

  outputContext.fillStyle = "#000000";
  outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  let x = CANVAS_PADDING;
  for (const symbol of symbols) {
    const drawWidth = (symbol.width * SYMBOL_HEIGHT) / symbol.height;
    outputContext.drawImage(
      symbol.canvas,
      x,
      CANVAS_PADDING,
      drawWidth,
      SYMBOL_HEIGHT,
    );
    x += drawWidth + SYMBOL_GAP;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
          return;
        }

        reject(new Error("Failed to encode JPEG"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  return {
    dataUrl: outputCanvas.toDataURL("image/jpeg", JPEG_QUALITY),
    blob,
  };
}

export async function saveSequenceImage(
  runeNames: string[],
  blob: Blob,
): Promise<void> {
  if (runeNames.length === 0) {
    return;
  }

  await saveBlobWithPicker(blob, getSequenceFilename(runeNames, ".jpg"), {
    description: "JPEG Image",
    mimeType: "image/jpeg",
    extension: ".jpg",
  });
}
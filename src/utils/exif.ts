/**
 * Reads the EXIF orientation tag from a JPEG file's raw bytes.
 * Returns an integer 1–8 (1 = upright, no rotation needed).
 * Returns 1 for non-JPEG files or if no EXIF data is found.
 */
export function readExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);

  // Must start with JPEG SOI marker 0xFFD8
  if (view.getUint16(0) !== 0xffd8) return 1;

  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    offset += 2;

    // APP1 marker where EXIF lives
    if (marker === 0xffe1) {
      const segmentLength = view.getUint16(offset);
      // Check for "Exif\0\0" header
      if (view.getUint32(offset + 2) === 0x45786966 && view.getUint16(offset + 6) === 0x0000) {
        const tiffStart = offset + 8;
        const littleEndian = view.getUint16(tiffStart) === 0x4949;
        const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const numEntries = view.getUint16(tiffStart + ifdOffset, littleEndian);

        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
          if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
            // Orientation tag found
            return view.getUint16(entryOffset + 8, littleEndian);
          }
        }
      }
      offset += segmentLength;
    } else if ((marker & 0xff00) === 0xff00) {
      // Skip other markers
      offset += view.getUint16(offset);
    } else {
      break;
    }
  }
  return 1;
}

/**
 * Draws an image onto a canvas with EXIF orientation correction applied.
 * Returns the canvas with the image drawn in its correct upright orientation.
 */
export function drawWithOrientation(
  img: HTMLImageElement,
  orientation: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const rotated = orientation >= 5; // 5–8 are transposed (width/height swap)
  canvas.width = rotated ? img.height : img.width;
  canvas.height = rotated ? img.width : img.height;
  const ctx = canvas.getContext("2d")!;

  // Apply transform based on EXIF orientation
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, img.width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, img.width, img.height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, img.height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, img.height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, img.height, img.width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, img.width); break;
    default: break; // orientation 1 — no transform needed
  }

  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Loads a File into an HTMLImageElement and returns both the image
 * and a canvas that has been corrected for EXIF orientation.
 */
export async function loadImageWithOrientation(
  file: File
): Promise<{ img: HTMLImageElement; corrected: HTMLCanvasElement }> {
  const buffer = await file.arrayBuffer();
  const orientation = readExifOrientation(buffer);

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const el = new Image();
    el.onload = () => res(el);
    el.onerror = rej;
    el.src = URL.createObjectURL(file);
  });

  const corrected = drawWithOrientation(img, orientation);
  return { img, corrected };
}

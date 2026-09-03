// Kompresi gambar di browser sebelum upload: resize ke lebar maksimal
// ~1000px dan turunkan quality JPEG bertahap sampai ukurannya di bawah
// target (default 500KB). Pakai Canvas API native, tanpa library tambahan.
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxSizeBytes?: number; initialQuality?: number } = {}
): Promise<File> {
  const { maxWidth = 1000, maxSizeBytes = 500 * 1024, initialQuality = 0.8 } = options;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di browser ini.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = initialQuality;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size <= maxSizeBytes || quality <= 0.3) break;
    quality -= 0.15;
  }

  if (!blob) throw new Error("Gagal mengompres gambar.");

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

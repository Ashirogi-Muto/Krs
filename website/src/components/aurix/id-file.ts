// Browser side of student ID uploads (team registration and ID re-upload)
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

/** Shrinks photos in the browser (max 1600 px, JPEG) so uploads stay small; PDFs are sent as-is. */
export async function prepareIdFile(file: File): Promise<File> {
  if (file.type === 'application/pdf' || !file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.82, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
      }
    }
  } catch {
    // Fall back to the original file; the size check below still applies
  }
  return file
}

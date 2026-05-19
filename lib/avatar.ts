export async function imageFileToDataUrl(file: File | null): Promise<string> {
  if (!file || file.size === 0) return "";
  if (file.size > 2 * 1024 * 1024) throw new Error("Image must be under 2 MB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

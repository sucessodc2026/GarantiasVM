export function parseGoogleDriveLink(url: string): string | null {
  if (!url) return null;
  // https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  // https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  // https://drive.google.com/uc?export=download&id=FILE_ID — already direct
  const directMatch = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (directMatch) return url;
  // https://lh3.googleusercontent.com/d/FILE_ID — already direct
  if (url.includes('googleusercontent.com')) return url;
  return null;
}

export function isGoogleDriveLink(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}

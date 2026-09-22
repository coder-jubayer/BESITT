export type ChatAttachmentKind = 'image' | 'video' | 'file';

export const CHAT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

export const CHAT_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];

export const CHAT_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.3gp', '.webm', '.mkv', '.avi'];

export const CHAT_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.rtf',
  '.odt',
  '.ods',
  '.odp',
  '.zip',
  '.rar',
  '.7z',
];

export const CHAT_ALLOWED_EXTENSIONS = [
  ...CHAT_IMAGE_EXTENSIONS,
  ...CHAT_VIDEO_EXTENSIONS,
  ...CHAT_DOCUMENT_EXTENSIONS,
];

function extensionOf(filename?: string): string {
  const match = /\.[a-z0-9]+$/i.exec((filename || '').trim());
  return match ? match[0].toLowerCase() : '';
}

/**
 * Mobile uploads frequently report `application/octet-stream` for documents, so the
 * extension is treated as the source of truth whenever the mime type is not specific.
 */
export function chatAttachmentKind(mime?: string, filename?: string): ChatAttachmentKind | null {
  const ext = extensionOf(filename);
  const type = (mime || '').toLowerCase();

  if (CHAT_IMAGE_EXTENSIONS.includes(ext) || /^image\//.test(type)) return 'image';
  if (CHAT_VIDEO_EXTENSIONS.includes(ext) || /^video\//.test(type)) return 'video';
  if (CHAT_DOCUMENT_EXTENSIONS.includes(ext)) return 'file';

  return null;
}

export function safeChatExtension(filename?: string, fallback = ''): string {
  const ext = extensionOf(filename);
  return CHAT_ALLOWED_EXTENSIONS.includes(ext) ? ext : fallback;
}

export function chatAttachmentPlaceholder(kind: ChatAttachmentKind): string {
  if (kind === 'image') return 'Sent a photo';
  if (kind === 'video') return 'Sent a video';
  return 'Sent a document';
}

export function chatAttachmentPreview(kind: ChatAttachmentKind): string {
  if (kind === 'image') return 'Photo';
  if (kind === 'video') return 'Video';
  return 'Document';
}

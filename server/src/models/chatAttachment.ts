import { Schema } from 'mongoose';
import { ChatAttachmentKind } from '../constants/chatAttachments';

export interface IChatAttachment {
  path: string;
  name: string;
  mime: string;
  size: number;
  kind: ChatAttachmentKind;
}

export interface ChatAttachmentDto {
  url: string;
  name: string;
  mime: string;
  size: number;
  kind: ChatAttachmentKind;
}

export type ResolveFileUrl = (path?: string) => string | undefined;

export const chatAttachmentSchema = new Schema<IChatAttachment>(
  {
    path: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    mime: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    kind: { type: String, required: true, enum: ['image', 'video', 'file'] },
  },
  { _id: false },
);

/**
 * Messages sent before documents were supported only stored a bare `image` path, so
 * they are surfaced as image attachments to keep a single shape on the client.
 */
export function chatAttachmentDto(
  attachment: IChatAttachment | undefined | null,
  legacyImage: string | undefined,
  resolveUrl: ResolveFileUrl,
): ChatAttachmentDto | undefined {
  if (attachment?.path) {
    const url = resolveUrl(attachment.path);
    if (!url) return undefined;
    return {
      url,
      name: attachment.name,
      mime: attachment.mime,
      size: attachment.size,
      kind: attachment.kind,
    };
  }

  if (legacyImage) {
    const url = resolveUrl(legacyImage);
    if (!url) return undefined;
    return { url, name: 'photo', mime: 'image/*', size: 0, kind: 'image' };
  }

  return undefined;
}

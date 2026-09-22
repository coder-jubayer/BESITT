import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  ChatAttachmentDto,
  IChatAttachment,
  ResolveFileUrl,
  chatAttachmentDto,
  chatAttachmentSchema,
} from './chatAttachment';

export interface IInboxMessage {
  threadId: string;
  senderId: string;
  senderName: string;
  text: string;
  image?: string;
  attachment?: IChatAttachment;
  seenAt?: Date;
  createdAt: Date;
}

export interface IInboxMessageDocument extends IInboxMessage, Document {
  toSafeJSON(actorId: string, resolveUrl: ResolveFileUrl): {
    id: string;
    threadId: string;
    senderId: string;
    senderName: string;
    text: string;
    image?: string;
    attachment?: ChatAttachmentDto;
    mine: boolean;
    seen: boolean;
    createdAt: string;
  };
}

const inboxMessageSchema = new Schema<IInboxMessageDocument>(
  {
    threadId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true, trim: true },
    text: { type: String, trim: true, default: '' },
    image: { type: String, trim: true },
    attachment: { type: chatAttachmentSchema, required: false },
    seenAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inboxMessageSchema.index({ threadId: 1, createdAt: 1 });

inboxMessageSchema.methods.toSafeJSON = function toSafeJSON(
  actorId: string,
  resolveUrl: ResolveFileUrl,
) {
  const attachment = chatAttachmentDto(this.attachment, this.image, resolveUrl);
  return {
    id: this._id.toString(),
    threadId: this.threadId,
    senderId: this.senderId,
    senderName: this.senderName,
    text: this.text || '',
    image: attachment?.kind === 'image' ? attachment.url : undefined,
    attachment,
    mine: this.senderId === actorId,
    seen: Boolean(this.seenAt),
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.InboxMessage) {
  mongoose.deleteModel('InboxMessage');
}

export const InboxMessage: Model<IInboxMessageDocument> = mongoose.model<IInboxMessageDocument>(
  'InboxMessage',
  inboxMessageSchema,
);

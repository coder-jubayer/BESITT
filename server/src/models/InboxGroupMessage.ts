import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  ChatAttachmentDto,
  IChatAttachment,
  ResolveFileUrl,
  chatAttachmentDto,
  chatAttachmentSchema,
} from './chatAttachment';

export interface IInboxGroupMessage {
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  image?: string;
  attachment?: IChatAttachment;
  seenBy: string[];
  createdAt: Date;
}

export interface IInboxGroupMessageDocument extends IInboxGroupMessage, Document {
  toSafeJSON(
    actorId: string,
    memberIds: string[],
    resolveUrl: ResolveFileUrl,
  ): {
    id: string;
    groupId: string;
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

const inboxGroupMessageSchema = new Schema<IInboxGroupMessageDocument>(
  {
    groupId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true, trim: true },
    text: { type: String, trim: true, default: '' },
    image: { type: String, trim: true },
    attachment: { type: chatAttachmentSchema, required: false },
    seenBy: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inboxGroupMessageSchema.index({ groupId: 1, createdAt: 1 });

inboxGroupMessageSchema.methods.toSafeJSON = function toSafeJSON(
  actorId: string,
  memberIds: string[],
  resolveUrl: ResolveFileUrl,
) {
  const others = (memberIds || []).filter((id) => id !== this.senderId);
  const seenBy = this.seenBy || [];
  const seen = others.length > 0 && others.every((id) => seenBy.includes(id));
  const attachment = chatAttachmentDto(this.attachment, this.image, resolveUrl);
  return {
    id: this._id.toString(),
    groupId: this.groupId,
    senderId: this.senderId,
    senderName: this.senderName,
    text: this.text || '',
    image: attachment?.kind === 'image' ? attachment.url : undefined,
    attachment,
    mine: this.senderId === actorId,
    seen,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.InboxGroupMessage) {
  mongoose.deleteModel('InboxGroupMessage');
}

export const InboxGroupMessage: Model<IInboxGroupMessageDocument> = mongoose.model<IInboxGroupMessageDocument>(
  'InboxGroupMessage',
  inboxGroupMessageSchema,
);

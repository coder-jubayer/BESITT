import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInboxMessage {
  threadId: string;
  senderId: string;
  senderName: string;
  text: string;
  seenAt?: Date;
  createdAt: Date;
}

export interface IInboxMessageDocument extends IInboxMessage, Document {
  toSafeJSON(actorId: string): {
    id: string;
    threadId: string;
    senderId: string;
    senderName: string;
    text: string;
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
    text: { type: String, required: true, trim: true },
    seenAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inboxMessageSchema.index({ threadId: 1, createdAt: 1 });

inboxMessageSchema.methods.toSafeJSON = function toSafeJSON(actorId: string) {
  return {
    id: this._id.toString(),
    threadId: this.threadId,
    senderId: this.senderId,
    senderName: this.senderName,
    text: this.text,
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

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInboxGroupMessage {
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  seenBy: string[];
  createdAt: Date;
}

export interface IInboxGroupMessageDocument extends IInboxGroupMessage, Document {
  toSafeJSON(
    actorId: string,
    memberIds: string[],
  ): {
    id: string;
    groupId: string;
    senderId: string;
    senderName: string;
    text: string;
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
    text: { type: String, required: true, trim: true },
    seenBy: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inboxGroupMessageSchema.index({ groupId: 1, createdAt: 1 });

inboxGroupMessageSchema.methods.toSafeJSON = function toSafeJSON(actorId: string, memberIds: string[]) {
  const others = (memberIds || []).filter((id) => id !== this.senderId);
  const seenBy = this.seenBy || [];
  const seen = others.length > 0 && others.every((id) => seenBy.includes(id));
  return {
    id: this._id.toString(),
    groupId: this.groupId,
    senderId: this.senderId,
    senderName: this.senderName,
    text: this.text,
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

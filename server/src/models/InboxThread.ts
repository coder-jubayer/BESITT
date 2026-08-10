import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInboxThread {
  buildingId: string;
  userA: string;
  userB: string;
  userAName: string;
  userBName: string;
  userARole: string;
  userBRole: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  userAUnread: number;
  userBUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInboxThreadDocument extends IInboxThread, Document {
  toSafeJSON(actorId: string): {
    id: string;
    otherId: string;
    otherName: string;
    otherRole: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unread: number;
  };
}

const inboxThreadSchema = new Schema<IInboxThreadDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    userA: { type: String, required: true, index: true },
    userB: { type: String, required: true, index: true },
    userAName: { type: String, required: true, trim: true },
    userBName: { type: String, required: true, trim: true },
    userARole: { type: String, required: true },
    userBRole: { type: String, required: true },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
    userAUnread: { type: Number, default: 0 },
    userBUnread: { type: Number, default: 0 },
  },
  { timestamps: true },
);

inboxThreadSchema.index({ userA: 1, userB: 1 }, { unique: true });
inboxThreadSchema.index({ userA: 1, lastMessageAt: -1 });
inboxThreadSchema.index({ userB: 1, lastMessageAt: -1 });

inboxThreadSchema.methods.toSafeJSON = function toSafeJSON(actorId: string) {
  const isA = this.userA === actorId;
  return {
    id: this._id.toString(),
    otherId: isA ? this.userB : this.userA,
    otherName: isA ? this.userBName : this.userAName,
    otherRole: isA ? this.userBRole : this.userARole,
    lastMessage: this.lastMessage,
    lastMessageAt: this.lastMessageAt ? this.lastMessageAt.toISOString() : undefined,
    unread: isA ? this.userAUnread : this.userBUnread,
  };
};

if (mongoose.models.InboxThread) {
  mongoose.deleteModel('InboxThread');
}

export const InboxThread: Model<IInboxThreadDocument> = mongoose.model<IInboxThreadDocument>(
  'InboxThread',
  inboxThreadSchema,
);

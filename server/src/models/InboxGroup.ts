import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInboxGroupMember {
  id: string;
  name: string;
  role?: string;
}

export interface IInboxGroup {
  buildingId: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  members: IInboxGroupMember[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IInboxGroupDocument extends IInboxGroup, Document {
  toSafeJSON(actorId: string): {
    id: string;
    name: string;
    createdBy: string;
    isOwner: boolean;
    memberIds: string[];
    members: IInboxGroupMember[];
    memberCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
    updatedAt?: string;
    unread: number;
  };
}

const inboxGroupSchema = new Schema<IInboxGroupDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, index: true },
    memberIds: { type: [String], required: true, default: [] },
    members: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          role: { type: String },
          _id: false,
        },
      ],
      default: [],
    },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
    unreadIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

inboxGroupSchema.index({ memberIds: 1, lastMessageAt: -1 });

inboxGroupSchema.methods.toSafeJSON = function toSafeJSON(actorId: string) {
  return {
    id: this._id.toString(),
    name: this.name,
    createdBy: this.createdBy,
    isOwner: this.createdBy === actorId,
    memberIds: this.memberIds,
    members: this.members || [],
    memberCount: (this.memberIds || []).length,
    lastMessage: this.lastMessage,
    lastMessageAt: this.lastMessageAt ? this.lastMessageAt.toISOString() : undefined,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
    unread: (this.unreadIds || []).includes(actorId) ? 1 : 0,
  };
};

if (mongoose.models.InboxGroup) {
  mongoose.deleteModel('InboxGroup');
}

export const InboxGroup: Model<IInboxGroupDocument> = mongoose.model<IInboxGroupDocument>(
  'InboxGroup',
  inboxGroupSchema,
);

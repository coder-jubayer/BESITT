import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotice {
  title: string;
  body: string;
  buildingId: string;
  createdBy: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoticeDocument extends INotice, Document {
  toSafeJSON(isNew?: boolean): {
    id: string;
    title: string;
    content: string;
    author: string;
    date: string;
    createdAt: string;
    buildingId: string;
    isNew: boolean;
  };
}

const NEW_MS = 48 * 60 * 60 * 1000;

const noticeSchema = new Schema<INoticeDocument>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    buildingId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

noticeSchema.index({ buildingId: 1, createdAt: -1 });

noticeSchema.methods.toSafeJSON = function toSafeJSON(isNew?: boolean) {
  const createdAt = this.createdAt ?? new Date();
  return {
    id: this._id.toString(),
    title: this.title,
    content: this.body,
    author: this.authorName,
    date: createdAt.toISOString(),
    createdAt: createdAt.toISOString(),
    buildingId: this.buildingId,
    isNew: isNew ?? Date.now() - createdAt.getTime() < NEW_MS,
  };
};

if (mongoose.models.Notice) {
  mongoose.deleteModel('Notice');
}

export const Notice: Model<INoticeDocument> = mongoose.model<INoticeDocument>('Notice', noticeSchema);

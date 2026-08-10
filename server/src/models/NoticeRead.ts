import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INoticeRead {
  userId: string;
  noticeId: string;
  readAt: Date;
}

export interface INoticeReadDocument extends INoticeRead, Document {}

const noticeReadSchema = new Schema<INoticeReadDocument>(
  {
    userId: { type: String, required: true, index: true },
    noticeId: { type: String, required: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

noticeReadSchema.index({ userId: 1, noticeId: 1 }, { unique: true });

if (mongoose.models.NoticeRead) {
  mongoose.deleteModel('NoticeRead');
}

export const NoticeRead: Model<INoticeReadDocument> = mongoose.model<INoticeReadDocument>(
  'NoticeRead',
  noticeReadSchema,
);

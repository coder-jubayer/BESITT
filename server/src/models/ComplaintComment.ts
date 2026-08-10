import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IComplaintComment {
  complaintId: string;
  buildingId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  isSystem?: boolean;
  createdAt: Date;
}

export interface IComplaintCommentDocument extends IComplaintComment, Document {
  toSafeJSON(): {
    id: string;
    complaintId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    text: string;
    isSystem?: boolean;
    createdAt: string;
  };
}

const complaintCommentSchema = new Schema<IComplaintCommentDocument>(
  {
    complaintId: { type: String, required: true, index: true },
    buildingId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

complaintCommentSchema.index({ complaintId: 1, createdAt: 1 });

complaintCommentSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    complaintId: this.complaintId,
    authorId: this.authorId,
    authorName: this.authorName,
    authorRole: this.authorRole,
    text: this.text,
    isSystem: this.isSystem,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.ComplaintComment) {
  mongoose.deleteModel('ComplaintComment');
}

export const ComplaintComment: Model<IComplaintCommentDocument> = mongoose.model<IComplaintCommentDocument>(
  'ComplaintComment',
  complaintCommentSchema,
);

import mongoose, { Document, Schema, Model } from 'mongoose';

export type ComplaintCommentMediaKind = 'image' | 'video';

export interface IComplaintCommentMedia {
  path: string;
  kind: ComplaintCommentMediaKind;
}

export interface IComplaintComment {
  complaintId: string;
  buildingId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  media: IComplaintCommentMedia[];
  isSystem?: boolean;
  createdAt: Date;
}

export interface IComplaintCommentDocument extends IComplaintComment, Document {
  toSafeJSON(media?: Array<{ url: string; kind: ComplaintCommentMediaKind }>): {
    id: string;
    complaintId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    text: string;
    media: Array<{ url: string; kind: ComplaintCommentMediaKind }>;
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
    text: { type: String, trim: true, default: '' },
    media: {
      type: [
        {
          path: { type: String, required: true },
          kind: { type: String, enum: ['image', 'video'], required: true },
          _id: false,
        },
      ],
      default: [],
    },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

complaintCommentSchema.index({ complaintId: 1, createdAt: 1 });

complaintCommentSchema.methods.toSafeJSON = function toSafeJSON(
  media?: Array<{ url: string; kind: ComplaintCommentMediaKind }>,
) {
  return {
    id: this._id.toString(),
    complaintId: this.complaintId,
    authorId: this.authorId,
    authorName: this.authorName,
    authorRole: this.authorRole,
    text: this.text || '',
    media: media ?? [],
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

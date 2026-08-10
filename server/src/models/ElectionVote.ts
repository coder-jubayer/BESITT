import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IElectionVote {
  electionId: string;
  candidateId: string;
  buildingId: string;
  userId: string;
  createdAt: Date;
}

export interface IElectionVoteDocument extends IElectionVote, Document {}

const electionVoteSchema = new Schema<IElectionVoteDocument>(
  {
    electionId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    buildingId: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

electionVoteSchema.index({ electionId: 1, userId: 1 }, { unique: true });

if (mongoose.models.ElectionVote) {
  mongoose.deleteModel('ElectionVote');
}

export const ElectionVote: Model<IElectionVoteDocument> = mongoose.model<IElectionVoteDocument>(
  'ElectionVote',
  electionVoteSchema,
);

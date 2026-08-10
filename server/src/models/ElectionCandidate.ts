import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IElectionCandidate {
  electionId: string;
  buildingId: string;
  name: string;
  unitNumber?: string;
  image?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IElectionCandidateDocument extends IElectionCandidate, Document {
  toSafeJSON(imageUrl?: string): {
    id: string;
    electionId: string;
    name: string;
    unitNumber?: string;
    image?: string;
  };
}

const electionCandidateSchema = new Schema<IElectionCandidateDocument>(
  {
    electionId: { type: String, required: true, index: true },
    buildingId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    unitNumber: { type: String, trim: true },
    image: { type: String, trim: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

electionCandidateSchema.index({ electionId: 1, createdAt: 1 });

electionCandidateSchema.methods.toSafeJSON = function toSafeJSON(imageUrl?: string) {
  return {
    id: this._id.toString(),
    electionId: this.electionId,
    name: this.name,
    unitNumber: this.unitNumber,
    image: imageUrl ?? this.image,
  };
};

if (mongoose.models.ElectionCandidate) {
  mongoose.deleteModel('ElectionCandidate');
}

export const ElectionCandidate: Model<IElectionCandidateDocument> = mongoose.model<IElectionCandidateDocument>(
  'ElectionCandidate',
  electionCandidateSchema,
);

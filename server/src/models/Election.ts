import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IElection {
  buildingId: string;
  title: string;
  position: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  showResults: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IElectionDocument extends IElection, Document {
  toSafeJSON(): {
    id: string;
    buildingId: string;
    title: string;
    position: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    showResults: boolean;
    createdByName: string;
    createdAt: string;
  };
}

const electionSchema = new Schema<IElectionDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    showResults: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

electionSchema.index({ buildingId: 1, startsAt: -1 });

electionSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    buildingId: this.buildingId,
    title: this.title,
    position: this.position,
    description: this.description,
    startsAt: this.startsAt.toISOString(),
    endsAt: this.endsAt.toISOString(),
    showResults: this.showResults,
    createdByName: this.createdByName,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.Election) {
  mongoose.deleteModel('Election');
}

export const Election: Model<IElectionDocument> = mongoose.model<IElectionDocument>('Election', electionSchema);

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBuilding {
  name: string;
  createdBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBuildingDocument extends IBuilding, Document {
  toSafeJSON(): { id: string; name: string; isActive: boolean };
}

const buildingSchema = new Schema<IBuildingDocument>(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

buildingSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    isActive: this.isActive,
  };
};

if (mongoose.models.Building) {
  mongoose.deleteModel('Building');
}

export const Building: Model<IBuildingDocument> = mongoose.model<IBuildingDocument>(
  'Building',
  buildingSchema,
);

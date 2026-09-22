import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IResidentDue {
  buildingId: string;
  year: number;
  month: number;
  amount: number;
  note?: string;
  setBy: string;
  setByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResidentDueDocument extends IResidentDue, Document {
  toSafeJSON(): {
    id: string;
    buildingId: string;
    year: number;
    month: number;
    amount: number;
    note?: string;
    setByName: string;
    updatedAt: string;
  };
}

const residentDueSchema = new Schema<IResidentDueDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    year: { type: Number, required: true, min: 2020, max: 2100 },
    month: { type: Number, required: true, min: 1, max: 12 },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    setBy: { type: String, required: true },
    setByName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

residentDueSchema.index({ buildingId: 1, year: 1, month: 1 }, { unique: true });

residentDueSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    buildingId: this.buildingId,
    year: this.year,
    month: this.month,
    amount: this.amount,
    note: this.note,
    setByName: this.setByName,
    updatedAt: (this.updatedAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.ResidentDue) {
  mongoose.deleteModel('ResidentDue');
}

export const ResidentDue: Model<IResidentDueDocument> = mongoose.model<IResidentDueDocument>(
  'ResidentDue',
  residentDueSchema,
);

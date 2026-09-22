import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IResidentDuePayment {
  buildingId: string;
  year: number;
  month: number;
  userId: string;
  amount: number;
  collectedBy: string;
  collectedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResidentDuePaymentDocument extends IResidentDuePayment, Document {
  toSafeJSON(): {
    id: string;
    userId: string;
    year: number;
    month: number;
    amount: number;
    collectedByName: string;
    collectedAt: string;
  };
}

const residentDuePaymentSchema = new Schema<IResidentDuePaymentDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    year: { type: Number, required: true, min: 2020, max: 2100 },
    month: { type: Number, required: true, min: 1, max: 12 },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    collectedBy: { type: String, required: true },
    collectedByName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

residentDuePaymentSchema.index({ buildingId: 1, year: 1, month: 1, userId: 1 }, { unique: true });

residentDuePaymentSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    userId: this.userId,
    year: this.year,
    month: this.month,
    amount: this.amount,
    collectedByName: this.collectedByName,
    collectedAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.ResidentDuePayment) {
  mongoose.deleteModel('ResidentDuePayment');
}

export const ResidentDuePayment: Model<IResidentDuePaymentDocument> =
  mongoose.model<IResidentDuePaymentDocument>('ResidentDuePayment', residentDuePaymentSchema);

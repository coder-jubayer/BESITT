import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IExpenseCategory {
  buildingId: string;
  value: string;
  label: string;
  color: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseCategoryDocument extends IExpenseCategory, Document {
  toSafeJSON(): { value: string; label: string; color: string; custom: true };
}

const expenseCategorySchema = new Schema<IExpenseCategoryDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

expenseCategorySchema.index({ buildingId: 1, value: 1 }, { unique: true });

expenseCategorySchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    value: this.value,
    label: this.label,
    color: this.color,
    custom: true as const,
  };
};

if (mongoose.models.ExpenseCategory) {
  mongoose.deleteModel('ExpenseCategory');
}

export const ExpenseCategory: Model<IExpenseCategoryDocument> = mongoose.model<IExpenseCategoryDocument>(
  'ExpenseCategory',
  expenseCategorySchema,
);

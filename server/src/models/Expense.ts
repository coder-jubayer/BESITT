import mongoose, { Document, Schema, Model } from 'mongoose';
import { CategoryMeta, expenseCategoryMeta } from '../constants/expenses';

export interface IExpense {
  year: number;
  month: number;
  buildingId: string;
  category: string;
  amount: number;
  note?: string;
  addedBy: string;
  addedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseDocument extends IExpense, Document {
  toSafeJSON(extras?: CategoryMeta[]): {
    id: string;
    year: number;
    month: number;
    buildingId: string;
    category: string;
    categoryLabel: string;
    color: string;
    amount: number;
    note?: string;
    addedByName: string;
    createdAt: string;
  };
}

const expenseSchema = new Schema<IExpenseDocument>(
  {
    year: { type: Number, required: true, min: 2020, max: 2100 },
    month: { type: Number, required: true, min: 1, max: 12 },
    buildingId: { type: String, required: true, index: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true },
    addedBy: { type: String, required: true },
    addedByName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

expenseSchema.index({ buildingId: 1, year: 1, month: 1, createdAt: -1 });

expenseSchema.methods.toSafeJSON = function toSafeJSON(extras: CategoryMeta[] = []) {
  const meta = expenseCategoryMeta(this.category, extras);
  return {
    id: this._id.toString(),
    year: this.year,
    month: this.month,
    buildingId: this.buildingId,
    category: this.category,
    categoryLabel: meta.label,
    color: meta.color,
    amount: this.amount,
    note: this.note,
    addedByName: this.addedByName,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.Expense) {
  mongoose.deleteModel('Expense');
}

export const Expense: Model<IExpenseDocument> = mongoose.model<IExpenseDocument>('Expense', expenseSchema);

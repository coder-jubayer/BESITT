import mongoose, { Document, Schema, Model } from 'mongoose';
import { directoryTypeMeta } from '../constants/directory';

export interface IDirectoryContact {
  buildingId: string;
  type?: string;
  typeLabel?: string;
  name: string;
  phone: string;
  note?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDirectoryContactDocument extends IDirectoryContact, Document {
  toSafeJSON(): {
    id: string;
    buildingId: string;
    type?: string;
    typeLabel: string;
    icon: string;
    name: string;
    phone: string;
    note?: string;
    createdByName: string;
    createdAt: string;
  };
}

const directoryContactSchema = new Schema<IDirectoryContactDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    type: { type: String, trim: true },
    typeLabel: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

directoryContactSchema.index({ buildingId: 1, type: 1, createdAt: 1 });

directoryContactSchema.methods.toSafeJSON = function toSafeJSON() {
  const meta = directoryTypeMeta(this.type, this.typeLabel);
  return {
    id: this._id.toString(),
    buildingId: this.buildingId,
    type: this.type || undefined,
    typeLabel: meta.label,
    icon: meta.icon,
    name: this.name,
    phone: this.phone,
    note: this.note,
    createdByName: this.createdByName,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.DirectoryContact) {
  mongoose.deleteModel('DirectoryContact');
}

export const DirectoryContact: Model<IDirectoryContactDocument> = mongoose.model<IDirectoryContactDocument>(
  'DirectoryContact',
  directoryContactSchema,
);

import mongoose, { Document, Schema, Model } from 'mongoose';

export type ListingStatus = 'active' | 'removed';

export interface IMarketplaceListing {
  buildingId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail?: string;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketplaceListingDocument extends IMarketplaceListing, Document {
  toSafeJSON(imageUrls?: string[]): {
    id: string;
    buildingId: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    sellerId: string;
    sellerName: string;
    sellerPhone?: string;
    sellerEmail?: string;
    status: ListingStatus;
    createdAt: string;
  };
}

const marketplaceListingSchema = new Schema<IMarketplaceListingDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    sellerPhone: { type: String, trim: true },
    sellerEmail: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'removed'], default: 'active', index: true },
  },
  { timestamps: true },
);

marketplaceListingSchema.index({ buildingId: 1, status: 1, createdAt: -1 });

marketplaceListingSchema.methods.toSafeJSON = function toSafeJSON(imageUrls?: string[]) {
  return {
    id: this._id.toString(),
    buildingId: this.buildingId,
    title: this.title,
    description: this.description,
    price: this.price,
    images: imageUrls ?? this.images,
    sellerId: this.sellerId,
    sellerName: this.sellerName,
    sellerPhone: this.sellerPhone,
    sellerEmail: this.sellerEmail,
    status: this.status,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.MarketplaceListing) {
  mongoose.deleteModel('MarketplaceListing');
}

export const MarketplaceListing: Model<IMarketplaceListingDocument> =
  mongoose.model<IMarketplaceListingDocument>('MarketplaceListing', marketplaceListingSchema);

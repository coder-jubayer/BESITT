import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMarketplaceThread {
  buildingId: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  buyerUnread: number;
  sellerUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketplaceThreadDocument extends IMarketplaceThread, Document {
  toSafeJSON(
    actorId: string,
    listingImageUrl?: string,
  ): {
    id: string;
    listingId: string;
    listingTitle: string;
    listingImage?: string;
    otherId: string;
    otherName: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unread: number;
    isSeller: boolean;
  };
}

const marketplaceThreadSchema = new Schema<IMarketplaceThreadDocument>(
  {
    buildingId: { type: String, required: true, index: true },
    listingId: { type: String, required: true, index: true },
    listingTitle: { type: String, required: true, trim: true },
    listingImage: { type: String, trim: true },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true, trim: true },
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
    buyerUnread: { type: Number, default: 0 },
    sellerUnread: { type: Number, default: 0 },
  },
  { timestamps: true },
);

marketplaceThreadSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });
marketplaceThreadSchema.index({ buyerId: 1, lastMessageAt: -1 });
marketplaceThreadSchema.index({ sellerId: 1, lastMessageAt: -1 });

marketplaceThreadSchema.methods.toSafeJSON = function toSafeJSON(actorId: string, listingImageUrl?: string) {
  const isSeller = this.sellerId === actorId;
  return {
    id: this._id.toString(),
    listingId: this.listingId,
    listingTitle: this.listingTitle,
    listingImage: listingImageUrl ?? this.listingImage,
    otherId: isSeller ? this.buyerId : this.sellerId,
    otherName: isSeller ? this.buyerName : this.sellerName,
    lastMessage: this.lastMessage,
    lastMessageAt: this.lastMessageAt ? this.lastMessageAt.toISOString() : undefined,
    unread: isSeller ? this.sellerUnread : this.buyerUnread,
    isSeller,
  };
};

if (mongoose.models.MarketplaceThread) {
  mongoose.deleteModel('MarketplaceThread');
}

export const MarketplaceThread: Model<IMarketplaceThreadDocument> = mongoose.model<IMarketplaceThreadDocument>(
  'MarketplaceThread',
  marketplaceThreadSchema,
);

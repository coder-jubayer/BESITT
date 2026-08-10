import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMarketplaceMessage {
  threadId: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

export interface IMarketplaceMessageDocument extends IMarketplaceMessage, Document {
  toSafeJSON(actorId: string): {
    id: string;
    threadId: string;
    listingId: string;
    senderId: string;
    senderName: string;
    text: string;
    mine: boolean;
    createdAt: string;
  };
}

const marketplaceMessageSchema = new Schema<IMarketplaceMessageDocument>(
  {
    threadId: { type: String, required: true, index: true },
    listingId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

marketplaceMessageSchema.index({ threadId: 1, createdAt: 1 });

marketplaceMessageSchema.methods.toSafeJSON = function toSafeJSON(actorId: string) {
  return {
    id: this._id.toString(),
    threadId: this.threadId,
    listingId: this.listingId,
    senderId: this.senderId,
    senderName: this.senderName,
    text: this.text,
    mine: this.senderId === actorId,
    createdAt: (this.createdAt ?? new Date()).toISOString(),
  };
};

if (mongoose.models.MarketplaceMessage) {
  mongoose.deleteModel('MarketplaceMessage');
}

export const MarketplaceMessage: Model<IMarketplaceMessageDocument> =
  mongoose.model<IMarketplaceMessageDocument>('MarketplaceMessage', marketplaceMessageSchema);

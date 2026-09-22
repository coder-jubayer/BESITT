import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, UserRole } from '../constants/roles';

export interface IUser {
  name: string;
  /** Optional: residents who self-register with a building code sign in by phone instead. */
  email?: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  unitNumber?: string;
  buildingId?: string;
  expoPushToken?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidate: string): Promise<boolean>;
  toSafeJSON(buildingName?: string, buildingCode?: string): Omit<IUser, 'password'> & {
    id: string;
    buildingName?: string;
    buildingCode?: string;
  };
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true, unique: true, sparse: true },
    avatar: { type: String, trim: true },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: 'resident',
    },
    unitNumber: { type: String, trim: true },
    buildingId: { type: String, trim: true },
    expoPushToken: { type: String, trim: true, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON(
  buildingName?: string,
  buildingCode?: string,
) {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    unitNumber: this.unitNumber,
    buildingId: this.buildingId,
    buildingName,
    buildingCode,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

if (mongoose.models.User) {
  mongoose.deleteModel('User');
}

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);

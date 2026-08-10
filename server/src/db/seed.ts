import { User } from '../models/User';
import { Building } from '../models/Building';
import { Notice } from '../models/Notice';
import { Expense } from '../models/Expense';
import { DirectoryContact } from '../models/DirectoryContact';

const ADMIN_EMAIL = 'admin@bm.com';
const ADMIN_PASSWORD = 'admin123';

export async function seedAdminUser(): Promise<void> {
  await User.collection.updateMany({ role: 'admin' }, { $set: { role: 'app_admin' } });
  await User.collection.updateMany({ role: 'treasurer' }, { $set: { role: 'committee' } });

  let defaultBuilding = await Building.findOne({ name: 'Default Community' });
  if (!defaultBuilding) {
    defaultBuilding = await Building.create({ name: 'Default Community' });
  }

  await User.collection.updateMany(
    {
      role: { $ne: 'app_admin' },
      $or: [
        { buildingId: { $exists: false } },
        { buildingId: null },
        { buildingId: '' },
        { buildingId: 'building-1' },
      ],
    },
    { $set: { buildingId: defaultBuilding._id.toString() } },
  );

  await seedSampleNotices(defaultBuilding._id.toString());
  await seedSampleExpenses(defaultBuilding._id.toString());
  await seedSampleDirectory(defaultBuilding._id.toString());

  const committeeEmail = 'committee@bm.com';
  const existingCommittee = await User.findOne({ email: committeeEmail });
  if (!existingCommittee) {
    await User.create({
      name: 'Committee Member',
      email: committeeEmail,
      password: 'committee123',
      role: 'committee',
      buildingId: defaultBuilding._id.toString(),
    });
    console.log(`Committee user seeded (${committeeEmail})`);
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    await User.collection.updateOne(
      { _id: existing._id },
      { $set: { role: 'app_admin', name: existing.name === 'Building Admin' ? 'App Admin' : existing.name }, $unset: { buildingId: 1 } },
    );
    console.log(
      existing.role === 'app_admin' && !existing.buildingId
        ? 'App admin already exists'
        : 'Existing admin promoted to App Admin',
    );
    return;
  }

  await User.create({
    name: 'App Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'app_admin',
  });

  console.log(`App admin seeded (${ADMIN_EMAIL})`);
}

async function seedSampleNotices(buildingId: string): Promise<void> {
  const count = await Notice.countDocuments({ buildingId });
  if (count > 0) return;

  await Notice.insertMany([
    {
      title: 'Water Supply Interruption',
      body: 'There will be no water supply on Friday from 10 AM to 2 PM due to maintenance.',
      buildingId,
      createdBy: 'seed',
      authorName: 'Committee',
      createdAt: new Date(),
    },
    {
      title: 'Annual General Meeting',
      body: 'The AGM will be held on the 15th of next month in the Community Hall.',
      buildingId,
      createdBy: 'seed',
      authorName: 'Committee',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      title: 'Lift 2 Maintenance',
      body: 'Lift 2 will be under maintenance this weekend.',
      buildingId,
      createdBy: 'seed',
      authorName: 'Maintenance',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log('Sample notices seeded');
}

async function seedSampleExpenses(buildingId: string): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const count = await Expense.countDocuments({ buildingId, year, month, addedBy: 'seed' });
  if (count > 0) return;

  await Expense.insertMany([
    { year, month, buildingId, category: 'guard_salary', amount: 45000, addedBy: 'seed', addedByName: 'Committee' },
    { year, month, buildingId, category: 'electricity', amount: 32000, addedBy: 'seed', addedByName: 'Committee' },
    { year, month, buildingId, category: 'lift', amount: 15000, addedBy: 'seed', addedByName: 'Committee' },
    { year, month, buildingId, category: 'cleaner_salary', amount: 12000, addedBy: 'seed', addedByName: 'Committee' },
    { year, month, buildingId, category: 'wasa', amount: 8000, addedBy: 'seed', addedByName: 'Committee' },
    { year, month, buildingId, category: 'other', amount: 5000, note: 'Miscellaneous supplies', addedBy: 'seed', addedByName: 'Committee' },
  ]);

  console.log(`Sample expenses seeded for ${month}/${year}`);
}

async function seedSampleDirectory(buildingId: string): Promise<void> {
  const count = await DirectoryContact.countDocuments({ buildingId, createdBy: 'seed' });
  if (count > 0) return;

  await DirectoryContact.insertMany([
    { buildingId, type: 'fire', name: 'Dhaka Fire Service', phone: '199', createdBy: 'seed', createdByName: 'Committee' },
    { buildingId, type: 'police', name: 'Local Police Station', phone: '999', createdBy: 'seed', createdByName: 'Committee' },
    { buildingId, type: 'property_manager', name: 'Property Manager', phone: '+8801711000001', createdBy: 'seed', createdByName: 'Committee' },
    { buildingId, type: 'security', name: 'Main Gate Security', phone: '+8801711000002', createdBy: 'seed', createdByName: 'Committee' },
    { buildingId, type: 'gas', name: 'Titas Gas Supplier', phone: '+8801711000003', createdBy: 'seed', createdByName: 'Committee' },
    { buildingId, type: 'welfare', name: 'Welfare Society Help Desk', phone: '+8801711000004', createdBy: 'seed', createdByName: 'Committee' },
  ]);

  console.log('Sample directory contacts seeded');
}

export type UserRole =
  | 'app_admin'
  | 'building_admin'
  | 'committee'
  | 'guard'
  | 'resident';

export const ROLE_LABELS: Record<UserRole, string> = {
  app_admin: 'App Admin',
  building_admin: 'Building Admin',
  committee: 'Committee',
  guard: 'Security Guard',
  resident: 'Resident',
};

export function isAppAdmin(role?: UserRole | null): boolean {
  return role === 'app_admin';
}

export function isBuildingAdmin(role?: UserRole | null): boolean {
  return role === 'building_admin';
}

export function canManageUsers(role?: UserRole | null): boolean {
  return isAppAdmin(role) || isBuildingAdmin(role);
}

export function canPostNotices(role?: UserRole | null): boolean {
  return role === 'committee' || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canManageExpenses(role?: UserRole | null): boolean {
  return role === 'committee' || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canManageDirectory(role?: UserRole | null): boolean {
  return role === 'committee' || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canCreateListing(role?: UserRole | null): boolean {
  return role === 'resident' || role === 'committee' || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canManageElections(role?: UserRole | null): boolean {
  return role === 'committee' || isBuildingAdmin(role) || isAppAdmin(role);
}

export function canCastVote(role?: UserRole | null): boolean {
  return role === 'resident';
}

export function isResident(role?: UserRole | null): boolean {
  return role === 'resident';
}

export function canMutateUser(actorId?: string, actorRole?: UserRole | null, target?: User | null): boolean {
  if (!actorId || !actorRole || !target) return false;
  if (target.id === actorId) return false;
  if (isAppAdmin(actorRole)) return true;
  if (isBuildingAdmin(actorRole)) {
    return target.role === 'committee' || target.role === 'guard' || target.role === 'resident';
  }
  return false;
}

export interface Building {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  unitNumber?: string;
  buildingId?: string;
  buildingName?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface HealthCheckResponse {
  success: boolean;
  status: string;
  timestamp: string;
  environment: string;
  database: string;
  version: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UsersListResponse {
  users: User[];
  roles: { value: UserRole; label: string }[];
  buildings?: Building[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  createdAt?: string;
  buildingId?: string;
  isNew?: boolean;
  unread?: boolean;
}

export interface NoticesListResponse {
  notices: Notice[];
  canPost: boolean;
  unreadCount?: number;
  buildings?: Building[];
}

export type ExpenseCategory = string;

export interface ExpenseCategoryOption {
  value: ExpenseCategory;
  label: string;
  color: string;
  custom?: boolean;
}

export interface ExpenseItem {
  id: string;
  year: number;
  month: number;
  buildingId: string;
  category: ExpenseCategory;
  categoryLabel: string;
  color: string;
  amount: number;
  note?: string;
  addedByName: string;
  createdAt: string;
}

export interface ExpenseBreakdown {
  category: ExpenseCategory;
  label: string;
  color: string;
  amount: number;
  percent: number;
}

export interface ExpensesMonthResponse {
  year: number;
  month: number;
  monthLabel: string;
  total: number;
  canManage: boolean;
  categories: ExpenseCategoryOption[];
  breakdown: ExpenseBreakdown[];
  expenses: ExpenseItem[];
  buildings?: Building[];
}

export type DirectoryType = string;

export interface DirectoryTypeOption {
  value: DirectoryType;
  label: string;
  icon: string;
  custom?: boolean;
}

export interface DirectoryContact {
  id: string;
  buildingId: string;
  type?: DirectoryType;
  typeLabel: string;
  icon: string;
  name: string;
  phone: string;
  note?: string;
  createdByName?: string;
  createdAt?: string;
}

export interface DirectoryListResponse {
  contacts: DirectoryContact[];
  types: DirectoryTypeOption[];
  canManage: boolean;
  buildings?: Building[];
}

export interface MarketplaceListing {
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
  status?: string;
  createdAt?: string;
  isMine?: boolean;
  canDelete?: boolean;
}

export interface MarketplaceListResponse {
  listings: MarketplaceListing[];
  canCreate: boolean;
  buildings?: Building[];
}

export interface MarketplaceThread {
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
}

export interface MarketplaceChatMessage {
  id: string;
  threadId: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  mine: boolean;
  createdAt: string;
}

export interface MarketplaceThreadDetail {
  thread: MarketplaceThread;
  messages: MarketplaceChatMessage[];
}

export type ElectionStatus = 'upcoming' | 'open' | 'closed';

export interface ElectionCandidate {
  id: string;
  electionId: string;
  name: string;
  unitNumber?: string;
  image?: string;
  votes?: number;
  percent?: number;
}

export interface ElectionSummary {
  id: string;
  buildingId: string;
  title: string;
  position: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  showResults: boolean;
  status: ElectionStatus;
  periodLabel: string;
  candidateCount: number;
  totalVotes?: number;
  canManage: boolean;
  canVote: boolean;
  hasVoted: boolean;
  myCandidateId?: string;
  resultsVisible: boolean;
  createdByName?: string;
}

export interface ElectionDetailResponse {
  election: ElectionSummary;
  candidates: ElectionCandidate[];
}

export interface ElectionsListResponse {
  elections: ElectionSummary[];
  canManage: boolean;
  buildings?: Building[];
}

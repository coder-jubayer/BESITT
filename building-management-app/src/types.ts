export type ViewState = 
  | 'login'
  | 'home'
  | 'services'
  | 'community'
  | 'guests'
  | 'profile'
  | 'notices'
  | 'expenses'
  | 'amenities'
  | 'marketplace'
  | 'voting'
  | 'directory'
  | 'complaints'
  | 'messages'
  | 'rentals';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'committee' | 'guard' | 'manager';
  unit: string;
  avatar?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  isNew: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  color: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  availableSlots: number;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  image: string;
  sellerName: string;
  date: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  votes: number;
  image: string;
}

export interface GuestRequest {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  time: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  icon: string;
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  date: string;
}

import { 
  Notice, ExpenseCategory, Amenity, MarketplaceItem, 
  Candidate, GuestRequest, Contact, Complaint 
} from './types';

export const mockNotices: Notice[] = [
  { id: '1', title: 'Water Supply Interruption', content: 'There will be no water supply on Friday from 10 AM to 2 PM due to maintenance.', date: 'Today, 09:00 AM', author: 'Management', isNew: true },
  { id: '2', title: 'Annual General Meeting', content: 'The AGM will be held on the 15th of next month in the Community Hall.', date: 'Yesterday', author: 'Committee', isNew: false },
  { id: '3', title: 'Lift 2 Maintenance', content: 'Lift 2 will be under maintenance this weekend.', date: 'Oct 12', author: 'Maintenance', isNew: false },
];

export const mockExpenses: ExpenseCategory[] = [
  { id: '1', name: 'Guard Salary', amount: 45000, color: 'bg-indigo-500' },
  { id: '2', name: 'Electricity Bill', amount: 32000, color: 'bg-yellow-500' },
  { id: '3', name: 'Lift Maintenance', amount: 15000, color: 'bg-emerald-500' },
  { id: '4', name: 'Cleaner Salary', amount: 12000, color: 'bg-cyan-500' },
  { id: '5', name: 'WASA Bill', amount: 8000, color: 'bg-blue-500' },
  { id: '6', name: 'Other Expenses', amount: 5000, color: 'bg-gray-400' },
];

export const mockAmenities: Amenity[] = [
  { id: '1', name: 'Swimming Pool', icon: 'Waves', availableSlots: 4 },
  { id: '2', name: 'Guest Parking', icon: 'Car', availableSlots: 2 },
  { id: '3', name: 'Community Hall', icon: 'PartyPopper', availableSlots: 1 },
  { id: '4', name: 'Table Tennis', icon: 'Activity', availableSlots: 3 },
  { id: '5', name: 'Billiard Room', icon: 'CircleDot', availableSlots: 0 },
];

export const mockMarketplace: MarketplaceItem[] = [
  { id: '1', title: 'Wooden Dining Table', price: 150, image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=300&h=300', sellerName: 'Apt 4B', date: '2 hrs ago' },
  { id: '2', title: 'Mountain Bike', price: 200, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=300&h=300', sellerName: 'Apt 12A', date: '5 hrs ago' },
  { id: '3', title: 'IKEA Bookshelf', price: 45, image: 'https://images.unsplash.com/photo-1594620113682-1c7b5084931a?auto=format&fit=crop&q=80&w=300&h=300', sellerName: 'Apt 7C', date: '1 day ago' },
];

export const mockCandidates: Candidate[] = [
  { id: '1', name: 'Robert Chen', position: 'President', votes: 142, image: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Sarah Jenkins', position: 'President', votes: 128, image: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Michael Ross', position: 'Treasurer', votes: 180, image: 'https://i.pravatar.cc/150?u=3' },
];

export const mockGuests: GuestRequest[] = [
  { id: '1', name: 'Amazon Delivery', phone: '+1 234 567 8900', purpose: 'Delivery', time: '10 mins ago', status: 'pending' },
  { id: '2', name: 'John Smith', phone: '+1 987 654 3210', purpose: 'Personal', time: '2 hours ago', status: 'approved' },
  { id: '3', name: 'Plumber', phone: '+1 555 123 4567', purpose: 'Maintenance', time: 'Yesterday', status: 'approved' },
];

export const mockContacts: Contact[] = [
  { id: '1', name: 'Main Gate Security', role: 'Security Guard', phone: '100', icon: 'Shield' },
  { id: '2', name: 'Property Manager', role: 'Management', phone: '+1 800 123 4567', icon: 'Briefcase' },
  { id: '3', name: 'Local Police', role: 'Emergency', phone: '911', icon: 'Siren' },
  { id: '4', name: 'Fire Station', role: 'Emergency', phone: '912', icon: 'Flame' },
  { id: '5', name: 'City Hospital', role: 'Medical', phone: '913', icon: 'Stethoscope' },
  { id: '6', name: 'Gas Supplier', role: 'Utility', phone: '+1 800 555 0000', icon: 'Wrench' },
];

export const mockComplaints: Complaint[] = [
  { id: '1', title: 'Leaking pipe in bathroom', category: 'Plumbing', status: 'in_progress', date: 'Today' },
  { id: '2', title: 'AC not cooling', category: 'Electrical', status: 'open', date: 'Yesterday' },
  { id: '3', title: 'Lobby light broken', category: 'Common Area', status: 'resolved', date: 'Oct 10' },
];

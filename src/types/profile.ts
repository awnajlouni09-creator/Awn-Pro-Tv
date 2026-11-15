export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  pin?: string; // 4-digit PIN for parental lock
  bgColor: string;
  createdAt: number;
}

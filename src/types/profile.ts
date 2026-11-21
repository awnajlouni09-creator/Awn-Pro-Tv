export type MaturityRating = 'kids' | '7+' | '13+' | '16+' | '18+';
export type SubtitleSize = 'small' | 'medium' | 'large';
export type ProfileLanguage = 'ar' | 'en' | 'fr' | 'tr';
export type SubtitleLanguage = 'none' | 'ar' | 'en' | 'fr';

export interface ProfilePreferences {
  language: ProfileLanguage;
  maturityRating: MaturityRating;
  autoplayNext: boolean;
  autoplayPreviews: boolean;
  subtitleLanguage: SubtitleLanguage;
  subtitleSize: SubtitleSize;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  isPrimary?: boolean;
  pin?: string; // 4-digit PIN for profile lock or kids exit
  bgColor: string;
  createdAt: number;
  preferences?: ProfilePreferences;
}

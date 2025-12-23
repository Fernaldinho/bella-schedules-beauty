export interface Professional {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  services: string[];
  availableDays: number[]; // 0-6 (Sunday-Saturday)
  availableHours: { start: string; end: string };
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  professionalId: string;
  category: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string;
  appointments: Appointment[];
}

export type ImageFormat = 'square' | 'rectangular' | 'circular';

// Novo sistema de aparência guiada
export type SalonStyle = 'luxo' | 'delicado' | 'moderno' | 'natural' | 'impactante';
export type ButtonEmphasis = 'discreto' | 'equilibrado' | 'chamativo';
export type ColorMode = 'has_colors' | 'no_colors';

export interface SalonAppearance {
  style: SalonStyle;
  colorMode: ColorMode;
  colorCount: 1 | 2 | 3;
  primaryColor: string;      // Cor principal (HSL)
  secondaryColor: string;    // Cor secundária (HSL)
  supportColor: string;      // Cor de apoio (HSL)
  buttonEmphasis: ButtonEmphasis;
}

// Cores finais calculadas pelo sistema
export interface ComputedColors {
  buttonBackground: string;
  buttonText: string;
  gradientStart: string;
  gradientEnd: string;
  accent: string;
}

// Mantido para compatibilidade
export type ThemePreset = 'purple' | 'rose' | 'gold' | 'custom';

export interface CustomColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
}

export interface SocialMedia {
  instagram: string;
  whatsapp: string;
  facebook: string;
  tiktok: string;
}

export interface SalonStats {
  rating: string;
  clientCount: string;
  since: string;
}

export interface SalonSettings {
  name: string;
  description: string;
  welcomeText: string;
  whatsapp: string;
  coverPhoto: string;
  logoUrl: string;
  logoFormat: ImageFormat;
  themePreset: ThemePreset;
  customColors: CustomColors;
  appearance?: SalonAppearance;
  priceColor: string;
  socialMedia: SocialMedia;
  stats: SalonStats;
  workingDays: number[];
  openingHours: { start: string; end: string };
}

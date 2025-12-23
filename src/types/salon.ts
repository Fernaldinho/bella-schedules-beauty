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
export type ThemePreset = 'purple' | 'rose' | 'gold' | 'custom';

export interface CustomColors {
  primary: string;       // Cor do botão
  primaryForeground: string; // Cor do texto do botão
  secondary: string;     // Cor do fundo (início do degradê)
  accent: string;        // Cor do fundo (fim do degradê)
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
  priceColor: string;
  socialMedia: SocialMedia;
  openingHours: { start: string; end: string };
  workingDays: number[];
  stats: SalonStats;
}

export interface Subscription {
  isActive: boolean;
  plan: 'pro' | null;
  price: number;
  expiresAt: string | null;
}

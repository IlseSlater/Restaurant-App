export interface Company {
  id: string;
  name: string;
  slug: string;
  guid?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  currency: string;
  latitude?: number;
  longitude?: number;
  locationRadius?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


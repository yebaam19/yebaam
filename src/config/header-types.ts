import type { ComponentType } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  phone?: string;
  cedula?: string;
  ciudad?: string;
  reputationPoints?: number;
  badge?: string;
  bio?: string;
  status?: string;
  userType: 'PROPIETARIO' | 'INQUILINO' | 'EMPRESA';
  roles: string[];
}

export interface MenuItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string | null;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

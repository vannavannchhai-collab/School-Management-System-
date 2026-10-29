import type { DatabaseSnapshot } from '../src/types';

export interface SeedUserAccount {
  id: string;
  username: string;
  passwordPlain?: string;
  role: 'admin' | 'teacher' | 'accountant' | 'student';
  nameKh: string;
  nameEn: string;
  titleKh: string;
  titleEn: string;
  email: string;
  phone: string;
  linkedId: string;
  avatarColor: string;
}

export function buildInitialSeedData(): Omit<DatabaseSnapshot, 'users'> & {
  users: SeedUserAccount[];
};

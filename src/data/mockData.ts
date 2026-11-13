import { Company, Permit, LKPMRecord, WarningLetter, EmailLog, ComplianceLogEvent, UserAccount, ConsultationApplication } from '../types';

// Helper to get relative ISO date string (YYYY-MM-DD)
export const getRelativeDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-superadmin',
    name: 'Super Administrator',
    username: 'superadmin',
    password: 'superadmin123',
    email: 'superadmin@kepatuhanplus.id',
    role: 'superadmin',
    roleTitle: 'Super Admin',
    description: 'Kewenangan Tertinggi: Menambah & Menghapus User Petugas, Koordinator, dan Monitoring serta Mengatur Hak Akses.',
    avatarColor: 'bg-purple-600'
  }
];

// All initial datasets are empty - ready for user upload
export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_PERMITS: Permit[] = [];

export const INITIAL_LKPM_RECORDS: LKPMRecord[] = [];

export const INITIAL_WARNING_LETTERS: WarningLetter[] = [];

export const INITIAL_EMAIL_LOGS: EmailLog[] = [];

export const INITIAL_COMPLIANCE_EVENTS: ComplianceLogEvent[] = [];

export const INITIAL_CONSULTATIONS: ConsultationApplication[] = [];

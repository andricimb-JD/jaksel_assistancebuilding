export type CompanyScale = 'Besar' | 'Menengah' | 'Kecil' | 'Mikro';

export type UserRole = 'petugas' | 'koordinator' | 'monitor' | 'superadmin' | 'pelaku_usaha';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  description: string;
  avatarColor: string;
  // Optional for Pelaku Usaha (Pengelola Gedung)
  companyName?: string;
  buildingName?: string;
  nib?: string;
  buildingType?: string;
  address?: string;
  phone?: string;
}

export type ConsultationStatus = 
  | 'Menunggu Verifikasi' 
  | 'Diverifikasi & Dijadwalkan' 
  | 'Sedang Didampingi' 
  | 'Selesai' 
  | 'Perlu Perbaikan';

export interface ConsultationApplication {
  id: string;
  refNumber: string;
  submittedAt: string;
  userId?: string;
  userName?: string;
  buildingName: string;
  buildingType: string;
  companyName: string;
  nib: string;
  address: string;
  district: string;
  picName: string;
  picPhone: string;
  picEmail?: string;
  consultationDate: string;
  method: string;
  topic: string;
  notes: string;
  ownedPermits: string[];
  uploadedFiles: Record<string, string>;
  preparedRequirementsCount?: number;
  status: ConsultationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  officerNotes?: string;
  previousDate?: string;
  rescheduledBy?: string;
  rescheduledAt?: string;
  rescheduleReason?: string;
}

export interface BuildingSelfCheckResult {
  buildingName: string;
  buildingType: string;
  district: string;
  address: string;
  ownedPermits: string[];
  uploadedFiles: Record<string, string>; // permitKey -> fileName
  checkedRequirements: Record<string, string[]>; // permitKey -> array of satisfied question indices or text
  completedAt: string;
  consultationRequested?: boolean;
  consultationDate?: string;
  consultationNotes?: string;
}

export interface Company {
  id: string;
  name: string;
  nib: string;
  npwp: string;
  address: string;
  city: string;
  province: string;
  picName: string;
  picEmail: string;
  picPhone: string;
  scale: CompanyScale;
  sector: string;
}

export type PermitCategory = 
  | 'Legalitas Dasar' 
  | 'Lingkungan Hidup' 
  | 'Bangunan & Konstruksi' 
  | 'Kesehatan & Pangan' 
  | 'K3 & Ketenagakerjaan' 
  | 'Operasional & Teknis' 
  | 'Mutu & Standar Industri'
  | 'Penyelenggaraan Reklame';

export type PermitStatus = 'active' | 'warning_90' | 'warning_30' | 'warning_7' | 'expired';

export type FollowUpStatus = 'Sudah Ditindaklanjuti' | 'Belum Ditindaklanjuti' | 'Dalam Proses';

export interface Permit {
  id: string;
  companyId: string;
  companyName: string;
  nib?: string;
  permitName: string;
  category: PermitCategory;
  documentNumber: string;
  issuingAuthority: string;
  issuedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  picName: string;
  picEmail: string;
  reminderIntervals: number[];
  address?: string; // Alamat Perusahaan / Lokasi Gedung
  usage?: string; // Pengunaan / Peruntukan Dokumen
  notes?: string;
  lastEmailSentDate?: string;
  status?: PermitStatus;
  daysRemaining?: number;
  followUpStatus?: FollowUpStatus;
  followUpDate?: string;
  followUpNotes?: string;
}

export type LKPMPeriod = 'Triwulan I' | 'Triwulan II' | 'Triwulan III' | 'Triwulan IV' | 'Semester I' | 'Semester II';
export type LKPMStatus = 'Belum Lapor' | 'Draf' | 'Perlu Perbaikan' | 'Terkirim' | 'Disetujui';
export type LKPMSanction = 'Aman' | 'Peringatan Tertulis I' | 'Peringatan Tertulis II' | 'Pembekuan Izin Sementara';

export interface LKPMRecord {
  id: string;
  companyId: string;
  companyName: string;
  nib: string;
  kbliCode: string;
  kbliTitle: string;
  projectLocation: string;
  scale: CompanyScale;
  period: LKPMPeriod;
  year: number;
  deadlineDate: string; // YYYY-MM-DD
  investmentRealization: number; // IDR
  status: LKPMStatus;
  sanctionLevel: LKPMSanction;
  picName: string;
  picEmail: string;
  lastReminderSent?: string;
  submissionDate?: string;
  officerNotes?: string;
  followUpStatus?: FollowUpStatus;
  followUpDate?: string;
  followUpNotes?: string;
}

export interface WarningLetterItem {
  itemType: 'PERMIT' | 'LKPM';
  itemName: string;
  referenceNumber: string;
  deadlineOrExpiry: string;
  daysRemainingOrOverdue: number;
  legalBasis: string;
  actionRequired: string;
}

export interface WarningLetter {
  id: string;
  letterNumber: string;
  letterDate: string;
  type: 
    | 'Teguran Izin Kedaluwarsa' 
    | 'Teguran Kepatuhan LKPM' 
    | 'Surat Peringatan Tertulis I' 
    | 'Surat Peringatan Tertulis II' 
    | 'Surat Peringatan Terakhir'
    | 'Surat Peringatan Tertulis Terpadu (Izin Kedaluwarsa & Keterlambatan LKPM)';
  urgency: 'Biasa' | 'Segera' | 'Sangat Segera / Mendesak';
  companyId: string;
  companyName: string;
  companyNIB: string;
  companyAddress: string;
  recipientName: string;
  recipientRole: string;
  recipientEmail: string;
  subject: string;
  senderOrganization: string;
  signatoryName: string;
  signatoryTitle: string;
  deadlineDays: number;
  items: WarningLetterItem[];
  additionalNotes?: string;
  generatedAt: string;
  status: 'Draf' | 'Diterbitkan' | 'Terkirim via Email' | 'Ditindaklanjuti';
  followUpStatus?: FollowUpStatus;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  category: 'Pengingat Perizinan' | 'Teguran LKPM' | 'Surat Resmi Terbit' | 'Notifikasi Sistem' | 'Teguran Terpadu NIB';
  subject: string;
  bodyPreview: string;
  fullHtml: string;
  sentAt: string;
  status: 'Berhasil Terkirim' | 'Antrean' | 'Gagal';
  triggerType: 'Otomatis (Jadwal H-30)' | 'Otomatis (Jadwal H-7)' | 'Manual Admin' | 'Peringatan Darurat';
}

export type ComparisonStatus = 'DUAL_VIOLATION' | 'PERMIT_ONLY_ISSUE' | 'LKPM_ONLY_ISSUE' | 'FULLY_COMPLIANT';

export interface NIBComparisonEntity {
  nib: string;
  companyId: string;
  companyName: string;
  scale: CompanyScale;
  sector: string;
  address: string;
  picName: string;
  picEmail: string;
  picPhone: string;
  
  // Permits breakdown
  totalPermits: number;
  expiredPermits: Permit[];
  criticalPermits: Permit[]; // <= 30 days
  warningPermits: Permit[]; // 30-90 days
  safePermits: Permit[]; // > 90 days
  allPermits: Permit[];
  hasExpiredOrCriticalPermit: boolean;

  // LKPM breakdown
  totalLKPM: number;
  unfiledLKPM: LKPMRecord[]; // Belum Lapor
  revisionLKPM: LKPMRecord[]; // Perlu Perbaikan
  approvedLKPM: LKPMRecord[];
  draftLKPM: LKPMRecord[];
  allLKPM: LKPMRecord[];
  hasUnfiledOrRevisionLKPM: boolean;

  // Status Komparasi
  comparisonStatus: ComparisonStatus;
  statusLabel: string;
  statusDescription: string;
  badgeColor: string;
}

export interface ComplianceLogEvent {
  id: string;
  timestamp: string;
  type: 'PERMIT_EXPIRING' | 'LKPM_OVERDUE' | 'EMAIL_SENT' | 'LETTER_GENERATED' | 'DATA_IMPORTED' | 'STATUS_UPDATED';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  entityName: string;
}

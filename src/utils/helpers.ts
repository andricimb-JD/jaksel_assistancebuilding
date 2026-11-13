import * as XLSX from 'xlsx';
import { Permit, PermitStatus, LKPMRecord, WarningLetter, Company, NIBComparisonEntity, ComparisonStatus } from '../types';

const INDONESIAN_ENGLISH_MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, peb: 2, februari: 2, pebruari: 2, february: 2,
  mar: 3, mrt: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, aug: 8, agustus: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, nop: 11, november: 11, nopember: 11,
  des: 12, dec: 12, desember: 12, december: 12
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatYmdIfValid = (year: number, month: number, day: number): string => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return '';
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  ) {
    return '';
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

export const parseSpreadsheetDate = (rawValue: unknown): string => {
  if (rawValue === null || rawValue === undefined || rawValue === '') return '';

  if (rawValue instanceof Date) {
    if (isNaN(rawValue.getTime())) return '';
    return formatYmdIfValid(rawValue.getFullYear(), rawValue.getMonth() + 1, rawValue.getDate());
  }

  if (typeof rawValue === 'number') {
    if (!Number.isFinite(rawValue) || rawValue <= 0) return '';
    const intVal = Math.trunc(rawValue);
    const ymdNumMatch = String(intVal).match(/^(19|20)(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/);
    if (ymdNumMatch) {
      return formatYmdIfValid(
        Number(`${ymdNumMatch[1]}${ymdNumMatch[2]}`),
        Number(ymdNumMatch[3]),
        Number(ymdNumMatch[4])
      );
    }
    if (rawValue < 2958465) {
      const parsed = XLSX.SSF.parse_date_code(rawValue);
      if (parsed) {
        return formatYmdIfValid(parsed.y, parsed.m, parsed.d);
      }
    }
    return '';
  }

  const str = String(rawValue).trim().replace(/^'+/, '').trim();
  if (!str || str === '-') return '';

  // Excel serial number stored as string (e.g. "45235" or "46331.5")
  if (/^\d{4,6}(\.\d+)?$/.test(str)) {
    const num = Number(str);
    if (num >= 1000 && num < 2958465) {
      const parsed = XLSX.SSF.parse_date_code(num);
      if (parsed) {
        const formatted = formatYmdIfValid(parsed.y, parsed.m, parsed.d);
        if (formatted) return formatted;
      }
    }
  }

  // Compact YYYYMMDD (e.g. "20261105")
  const compactMatch = str.match(/^(19|20)(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/);
  if (compactMatch) {
    return formatYmdIfValid(
      Number(`${compactMatch[1]}${compactMatch[2]}`),
      Number(compactMatch[3]),
      Number(compactMatch[4])
    );
  }

  // ISO or YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD (with optional timestamp)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (ymdMatch) {
    return formatYmdIfValid(Number(ymdMatch[1]), Number(ymdMatch[2]), Number(ymdMatch[3]));
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with optional timestamp)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[T\s].*)?$/);
  if (dmyMatch) {
    const p1 = Number(dmyMatch[1]);
    const p2 = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const month = p2 > 12 && p1 <= 12 ? p1 : p2;
    const day = p2 > 12 && p1 <= 12 ? p2 : p1;
    return formatYmdIfValid(year, month, day);
  }

  // DD/MM/YY or DD-MM-YY or DD.MM.YY
  const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})(?:\s.*)?$/);
  if (dmyShortMatch) {
    const p1 = Number(dmyShortMatch[1]);
    const p2 = Number(dmyShortMatch[2]);
    const yy = Number(dmyShortMatch[3]);
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    const month = p2 > 12 && p1 <= 12 ? p1 : p2;
    const day = p2 > 12 && p1 <= 12 ? p2 : p1;
    return formatYmdIfValid(year, month, day);
  }

  // DD MMM YYYY or DD-MMM-YYYY (Indonesian / English months)
  const textMonthDmy = str.match(/^(\d{1,2})[\s\-/.]+([a-zA-Z]+)[\s\-/.,]+(\d{2,4})(?:\s.*)?$/);
  if (textMonthDmy) {
    const day = Number(textMonthDmy[1]);
    const monthNum = INDONESIAN_ENGLISH_MONTHS[textMonthDmy[2].toLowerCase()];
    const rawYear = Number(textMonthDmy[3]);
    const year = textMonthDmy[3].length === 2 ? (rawYear >= 70 ? 1900 + rawYear : 2000 + rawYear) : rawYear;
    if (monthNum) {
      return formatYmdIfValid(year, monthNum, day);
    }
  }

  // MMM DD, YYYY (e.g. "Nov 5, 2023")
  const textMonthMdy = str.match(/^([a-zA-Z]+)[\s\-/.]+(\d{1,2})[,\s\-/.]+(\d{2,4})(?:\s.*)?$/);
  if (textMonthMdy) {
    const monthNum = INDONESIAN_ENGLISH_MONTHS[textMonthMdy[1].toLowerCase()];
    const day = Number(textMonthMdy[2]);
    const rawYear = Number(textMonthMdy[3]);
    const year = textMonthMdy[3].length === 2 ? (rawYear >= 70 ? 1900 + rawYear : 2000 + rawYear) : rawYear;
    if (monthNum) {
      return formatYmdIfValid(year, monthNum, day);
    }
  }

  const parsedFallback = new Date(str);
  if (!isNaN(parsedFallback.getTime())) {
    return formatYmdIfValid(
      parsedFallback.getFullYear(),
      parsedFallback.getMonth() + 1,
      parsedFallback.getDate()
    );
  }

  return '';
};

const parseIsoLocalDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const normalized = parseSpreadsheetDate(dateString) || dateString;
  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
};

export const calculateDaysRemaining = (expiryDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseIsoLocalDate(expiryDateStr);
  if (!expiry) return NaN;
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getPermitStatus = (daysRemaining: number): PermitStatus => {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 7) return 'warning_7';
  if (daysRemaining <= 30) return 'warning_30';
  if (daysRemaining <= 90) return 'warning_90';
  return 'active';
};

export const getPermitStatusBadge = (status: PermitStatus, daysRemaining: number) => {
  switch (status) {
    case 'expired':
      return {
        label: `Kedaluwarsa (${Math.abs(daysRemaining)} hari lalu)`,
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
        badge: 'Kedaluwarsa'
      };
    case 'warning_7':
      return {
        label: `Kritis: Sisa ${daysRemaining} Hari`,
        color: 'bg-red-100 text-red-900 border-red-300 animate-pulse',
        dot: 'bg-red-600',
        badge: 'Kritis H-7'
      };
    case 'warning_30':
      return {
        label: `Mendesak: Sisa ${daysRemaining} Hari`,
        color: 'bg-amber-100 text-amber-900 border-amber-300',
        dot: 'bg-amber-500',
        badge: 'Peringatan H-30'
      };
    case 'warning_90':
      return {
        label: `Perhatian: Sisa ${daysRemaining} Hari`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        dot: 'bg-yellow-500',
        badge: 'Waspada H-90'
      };
    case 'active':
    default:
      return {
        label: `Aktif (${daysRemaining} Hari)`,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        badge: 'Aman'
      };
  }
};

export const formatIndonesianDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const d = parseIsoLocalDate(dateString);
  if (!d) return dateString;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

export const formatCurrencyIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateComplianceScore = (permits: Permit[], lkpmRecords: LKPMRecord[]) => {
  if (permits.length === 0 && lkpmRecords.length === 0) return 100;

  let permitPoints = 0;
  permits.forEach((p) => {
    const days = calculateDaysRemaining(p.expiryDate);
    if (days < 0) {
      permitPoints += 0;
    } else if (days <= 7) {
      permitPoints += 30;
    } else if (days <= 30) {
      permitPoints += 60;
    } else if (days <= 90) {
      permitPoints += 85;
    } else {
      permitPoints += 100;
    }
  });

  const avgPermitScore = permits.length > 0 ? permitPoints / permits.length : 100;

  let lkpmPoints = 0;
  lkpmRecords.forEach((l) => {
    if (l.status === 'Disetujui') lkpmPoints += 100;
    else if (l.status === 'Terkirim') lkpmPoints += 90;
    else if (l.status === 'Perlu Perbaikan') lkpmPoints += 60;
    else if (l.status === 'Draf') lkpmPoints += 40;
    else if (l.status === 'Belum Lapor') {
      const isPast = calculateDaysRemaining(l.deadlineDate) < 0;
      lkpmPoints += isPast ? 0 : 25;
    }
  });

  const avgLkpmScore = lkpmRecords.length > 0 ? lkpmPoints / lkpmRecords.length : 100;

  // 60% Weight on Permits, 40% Weight on LKPM
  const overallScore = Math.round(avgPermitScore * 0.55 + avgLkpmScore * 0.45);
  return Math.min(100, Math.max(0, overallScore));
};

export const generateSampleCsvLKPM = (): string => {
  const headers = [
    'Nama Perusahaan',
    'NIB',
    'Kode KBLI',
    'Judul KBLI',
    'Lokasi Proyek',
    'Skala Usaha',
    'Periode LKPM',
    'Tahun',
    'Batas Waktu (YYYY-MM-DD)',
    'Nilai Investasi (IDR)',
    'Status Pelaporan',
    'Tingkat Sanksi',
    'Nama PIC',
    'Email PIC',
    'Catatan Petugas'
  ];

  const sampleRows = [
    [
      'PT Nusantara Petrokimia Raya',
      '1289000452109',
      '20111',
      'Industri Kimia Dasar Anorganik Khlor dan Alkali',
      'Kawasan Industri Cilegon Kav. B-12 Banten',
      'Besar',
      'Triwulan III',
      '2026',
      '2026-10-15',
      '24500000000',
      'Belum Lapor',
      'Peringatan Tertulis I',
      'Andri Wicaksono',
      'andri.cimb@gmail.com',
      'Melewati batas pelaporan triwulanan'
    ],
    [
      'PT Indo Prima Manufaktur Tbk',
      '9120008471923',
      '29300',
      'Industri Suku Cadang Dan Aksesori Kendaraan Bermotor Roda Empat',
      'Kawasan MM2100 Cikarang Barat Bekasi',
      'Besar',
      'Triwulan III',
      '2026',
      '2026-10-15',
      '15200000000',
      'Belum Lapor',
      'Peringatan Tertulis II',
      'Budi Santoso',
      'legal.indoprima@corp.co.id',
      'Segera submit sebelum pembekuan fasilitas'
    ],
    [
      'PT Sentosa Logistik Abadi',
      '0192837465019',
      '52101',
      'Pergudangan dan Penyimpanan',
      'Kawasan Berikat Nusantara Marunda',
      'Menengah',
      'Triwulan III',
      '2026',
      '2026-10-15',
      '6500000000',
      'Belum Lapor',
      'Peringatan Tertulis I',
      'Siti Nurhaliza',
      'siti.sentosa@gmail.com',
      'Belum ada draft masuk'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  return csvContent;
};

export const calculateFollowUpMetrics = (permits: Permit[], lkpmRecords: LKPMRecord[]) => {
  // Urgent permits needing action (expired or <= 90 days)
  const urgentPermits = permits.filter((p) => calculateDaysRemaining(p.expiryDate) <= 90);
  const followedUpPermits = urgentPermits.filter((p) => p.followUpStatus === 'Sudah Ditindaklanjuti');
  const inProgressPermits = urgentPermits.filter((p) => p.followUpStatus === 'Dalam Proses');
  const pendingPermits = urgentPermits.filter((p) => !p.followUpStatus || p.followUpStatus === 'Belum Ditindaklanjuti');

  const urgentPermitsCount = urgentPermits.length;
  const followedUpPermitsCount = followedUpPermits.length;
  const inProgressPermitsCount = inProgressPermits.length;
  const pendingPermitsCount = pendingPermits.length;

  const permitFollowedUpPct = urgentPermitsCount > 0 
    ? Math.round((followedUpPermitsCount / urgentPermitsCount) * 100) 
    : 0;
  const permitInProgressPct = urgentPermitsCount > 0 
    ? Math.round((inProgressPermitsCount / urgentPermitsCount) * 100) 
    : 0;
  const permitPendingPct = urgentPermitsCount > 0 
    ? Math.max(0, 100 - permitFollowedUpPct - permitInProgressPct) 
    : 0;

  // Urgent LKPM needing action (Belum Lapor, Perlu Perbaikan)
  const urgentLKPM = lkpmRecords.filter((l) => l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan');
  const followedUpLKPM = urgentLKPM.filter((l) => l.followUpStatus === 'Sudah Ditindaklanjuti');
  const inProgressLKPM = urgentLKPM.filter((l) => l.followUpStatus === 'Dalam Proses');
  const pendingLKPM = urgentLKPM.filter((l) => !l.followUpStatus || l.followUpStatus === 'Belum Ditindaklanjuti');

  const urgentLKPMCount = urgentLKPM.length;
  const followedUpLKPMCount = followedUpLKPM.length;
  const inProgressLKPMCount = inProgressLKPM.length;
  const pendingLKPMCount = pendingLKPM.length;

  const lkpmFollowedUpPct = urgentLKPMCount > 0
    ? Math.round((followedUpLKPMCount / urgentLKPMCount) * 100)
    : 0;
  const lkpmInProgressPct = urgentLKPMCount > 0
    ? Math.round((inProgressLKPMCount / urgentLKPMCount) * 100)
    : 0;
  const lkpmPendingPct = urgentLKPMCount > 0
    ? Math.max(0, 100 - lkpmFollowedUpPct - lkpmInProgressPct)
    : 0;

  // Total Action Items and Cumulative Percentages
  const totalActionItems = urgentPermitsCount + urgentLKPMCount;
  const totalFollowedUp = followedUpPermitsCount + followedUpLKPMCount;
  const totalInProgress = inProgressPermitsCount + inProgressLKPMCount;
  const totalPending = pendingPermitsCount + pendingLKPMCount;

  const overallFollowedUpPct = totalActionItems > 0 
    ? Math.round((totalFollowedUp / totalActionItems) * 100) 
    : 0;
  const overallInProgressPct = totalActionItems > 0 
    ? Math.round((totalInProgress / totalActionItems) * 100) 
    : 0;
  const overallPendingPct = totalActionItems > 0 
    ? Math.max(0, 100 - overallFollowedUpPct - overallInProgressPct) 
    : 0;

  return {
    urgentPermitsCount,
    followedUpPermitsCount,
    inProgressPermitsCount,
    pendingPermitsCount,
    permitFollowedUpPct,
    permitInProgressPct,
    permitPendingPct,
    permitFollowUpRate: permitFollowedUpPct,

    urgentLKPMCount,
    followedUpLKPMCount,
    inProgressLKPMCount,
    pendingLKPMCount,
    lkpmFollowedUpPct,
    lkpmInProgressPct,
    lkpmPendingPct,
    lkpmFollowUpRate: lkpmFollowedUpPct,

    totalActionItems,
    totalFollowedUp,
    totalInProgress,
    totalPending,
    overallFollowedUpPct,
    overallInProgressPct,
    overallPendingPct,
    overallFollowUpRate: overallFollowedUpPct
  };
};

export const generateSampleCsvPermits = (): string => {
  const headers = [
    'Nama Perusahaan',
    'Alamat',
    'Nama Perizinan',
    'Pengunaan',
    'Nomor Izin',
    'Tanggal Terbit (YYYY-MM-DD)',
    'Tanggal Kedaluwarsa (YYYY-MM-DD)',
    'Nama Penangung Jawab',
    'Email',
    'Catatan Teknis'
  ];

  const sampleRows = [
    [
      'PT Nusantara Petrokimia Raya',
      'Jl. Gatot Subroto Kav. 42, Jakarta Selatan',
      'Izin Lingkungan Hidup (Persetujuan Lingkungan / AMDAL)',
      'Pabrik Industri Kimia & Gudang Bahan Baku',
      'SK.520/MENLHK/SETJEN/PLA.4/2021',
      '2023-11-05',
      '2026-11-05',
      'Andri Wicaksono',
      'andri.cimb@gmail.com',
      'Kajian teknis addendum AMDAL dan persetujuan air limbah'
    ],
    [
      'PT Cipta Pangan Lestari',
      'Jl. TB Simatupang No. 18, Pasar Minggu, Jakarta Selatan',
      'Sertifikat Halal BPJPH (Bahan Baku & Lini Produksi)',
      'Fasilitas Pengolahan Makanan & Minuman Kemasan',
      'ID00410000189420921',
      '2022-11-15',
      '2026-11-15',
      'Hendra Gunawan',
      'andri.cimb@gmail.com',
      'Audit internal SJPH telah siap'
    ],
    [
      'PT Indo Prima Manufaktur Tbk',
      'Jl. HR Rasuna Said Blok X-5, Setiabudi, Jakarta Selatan',
      'Sertifikat Laik Fungsi (SLF) Gedung Pabrik & Gudang A',
      'Gedung Pabrik Manufaktur & Logistik Modern',
      '640/SLF-DPMPTSP/JS/2021',
      '2021-10-15',
      '2026-10-15',
      'Budi Santoso',
      'legal.indoprima@corp.co.id',
      'Dokumen perpanjangan SLF struktur baja'
    ],
    [
      'PT Media Citra Megatron',
      'Jl. Jenderal Sudirman Kav. 52-53, Kebayoran Baru, Jakarta Selatan',
      'Izin Penyelenggaraan Reklame (IPR JakEVO)',
      'Megatron / Videotron LED Fasad Gedung',
      'IPR-PTSP-JS/2023/8891',
      '2023-08-20',
      '2026-08-20',
      'Ahmad Fauzi',
      'reklame@mediacitra.id',
      'Struktur reklame ber-IPTB dan bukti SKPD/SSPD Bapenda DKI'
    ],
    [
      'CV Berkah Energi Mandiri',
      'Jl. Kemang Raya No. 101, Mampang Prapatan, Jakarta Selatan',
      'Surat Izin Laik Operasi (SLO) Genset Pembangkit Darurat 500 kVA',
      'Sistem Kelistrikan Cadangan Gedung Bertingkat',
      'SLO-DJE/ESDM/2024/771',
      '2024-12-20',
      '2026-12-20',
      'Rahmat Hidayat',
      'rahmat.energi@gmail.com',
      'Jadwal inspeksi teknis dari LIT'
    ]
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  return csvContent;
};

/**
 * Normalizes Indonesian company and business actor names:
 * 1. Removes common legal entity prefixes and suffixes (PT, CV, UD, TBK, PERSERO, etc.)
 * 2. Strips punctuation, special characters, and extraneous spacing
 * 3. Returns a clean uppercase tokenized string
 */
export const normalizeCompanyName = (rawName: string): string => {
  if (!rawName) return '';
  let str = rawName.toUpperCase();

  // Remove legal entities (PT, CV, UD, TBK, etc.)
  str = str.replace(/\b(P\.?T\.?|C\.?V\.?|U\.?D\.?|TBK|PERSERO|PERSEROAN TERBATAS|YAYASAN|KOPERASI|PERUM|FIRMA|FA)\b/gi, ' ');

  // Remove all non-alphanumeric characters (punctuation, symbols, quotes, brackets)
  str = str.replace(/[^A-Z0-9\s]/gi, ' ');

  // Trim and collapse multiple spaces into single space
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Calculates string similarity ratio (0 to 1) using Levenshtein distance
 */
export const calculateSimilarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const costs = new Array();
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return (longerLength - costs[shorter.length]) / longerLength;
};

/**
 * Smart matching for Indonesian company/business names:
 * 1. Exact string match (ignoring case & whitespace)
 * 2. Normalized name match (without PT/CV/Tbk/dots/commas)
 * 3. Token-sorted match (e.g., "HOTEL CIPUTRA" matches "CIPUTRA HOTEL")
 * 4. High-confidence fuzzy similarity (threshold >= 0.88)
 */
export const isCompanyNameMatch = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;

  const raw1 = name1.trim().toLowerCase();
  const raw2 = name2.trim().toLowerCase();
  if (raw1 === raw2) return true;

  const norm1 = normalizeCompanyName(name1);
  const norm2 = normalizeCompanyName(name2);
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;

  // Token sort match (e.g. "CIPUTRA HOTEL" vs "HOTEL CIPUTRA")
  const tokens1 = norm1.split(' ').sort().join(' ');
  const tokens2 = norm2.split(' ').sort().join(' ');
  if (tokens1 === tokens2) return true;

  // Substring match for substantial names (>= 8 chars)
  if (norm1.length >= 8 && norm2.length >= 8) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  }

  // Fuzzy match for minor typos (>= 88% similarity)
  if (norm1.length >= 6 && norm2.length >= 6) {
    const sim = calculateSimilarity(norm1, norm2);
    if (sim >= 0.88) return true;
  }

  return false;
};

export const buildNIBComparisonList = (
  companies: Company[],
  permits: Permit[],
  lkpmRecords: LKPMRecord[]
): NIBComparisonEntity[] => {
  // Aggregate companies from companies list + any distinct entity in permits or lkpm
  const companyMap = new Map<string, Company>();

  companies.forEach((c) => {
    companyMap.set(c.nib || c.id, c);
  });

  permits.forEach((p) => {
    // Check if already matched by NIB or smart company name
    let existingKey: string | null = null;
    if (p.nib && companyMap.has(p.nib)) {
      existingKey = p.nib;
    } else {
      for (const [key, comp] of companyMap.entries()) {
        if ((p.nib && comp.nib === p.nib) || isCompanyNameMatch(p.companyName, comp.name)) {
          existingKey = key;
          break;
        }
      }
    }

    if (!existingKey) {
      const key = p.nib || p.companyName;
      companyMap.set(key, {
        id: p.companyId || `comp-${key}`,
        name: p.companyName,
        nib: p.nib || '0000000000000',
        npwp: '-',
        address: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        picName: p.picName || 'Penanggung Jawab',
        picEmail: p.picEmail || 'andri.cimb@gmail.com',
        picPhone: '-',
        scale: 'Besar',
        sector: p.category || 'Umum'
      });
    }
  });

  lkpmRecords.forEach((l) => {
    // Check if already matched by NIB or smart company name
    let existingKey: string | null = null;
    if (l.nib && l.nib !== '0000000000000' && companyMap.has(l.nib)) {
      existingKey = l.nib;
    } else {
      for (const [key, comp] of companyMap.entries()) {
        if ((l.nib && l.nib !== '0000000000000' && comp.nib === l.nib) || isCompanyNameMatch(l.companyName, comp.name)) {
          existingKey = key;
          // If the LKPM record lacks NIB but the matched company has one, enrich it!
          if ((!l.nib || l.nib === '0000000000000') && comp.nib && comp.nib !== '0000000000000') {
            l.nib = comp.nib;
          }
          break;
        }
      }
    }

    if (!existingKey) {
      const key = (l.nib && l.nib !== '0000000000000') ? l.nib : l.companyName;
      companyMap.set(key, {
        id: l.companyId || `comp-${key}`,
        name: l.companyName,
        nib: l.nib || '0000000000000',
        npwp: '-',
        address: l.projectLocation || 'DKI Jakarta',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        picName: l.picName || 'Penanggung Jawab',
        picEmail: l.picEmail || 'andri.cimb@gmail.com',
        picPhone: '-',
        scale: l.scale || 'Besar',
        sector: l.kbliTitle || 'Umum'
      });
    }
  });

  const allEffectiveCompanies = Array.from(companyMap.values());

  return allEffectiveCompanies.map((company) => {
    // Find all permits belonging to this company/NIB using NIB or Smart Name Matching
    const companyPermits = permits.filter((p) => {
      if (p.companyId && p.companyId === company.id) return true;
      if (p.nib && company.nib && p.nib !== '0000000000000' && p.nib === company.nib) return true;
      return isCompanyNameMatch(p.companyName, company.name);
    });

    // Find all LKPM belonging to this company/NIB using NIB or Smart Name Matching
    const companyLKPM = lkpmRecords.filter((l) => {
      if (l.companyId && l.companyId === company.id) return true;
      if (l.nib && company.nib && l.nib !== '0000000000000' && l.nib === company.nib) return true;
      return isCompanyNameMatch(l.companyName, company.name);
    });

    const expiredPermits = companyPermits.filter((p) => calculateDaysRemaining(p.expiryDate) < 0);
    const criticalPermits = companyPermits.filter((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      return days >= 0 && days <= 30;
    });
    const warningPermits = companyPermits.filter((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      return days > 30 && days <= 90;
    });
    const safePermits = companyPermits.filter((p) => calculateDaysRemaining(p.expiryDate) > 90);

    const unfiledLKPM = companyLKPM.filter((l) => l.status === 'Belum Lapor');
    const revisionLKPM = companyLKPM.filter((l) => l.status === 'Perlu Perbaikan');
    const approvedLKPM = companyLKPM.filter((l) => l.status === 'Disetujui');
    const draftLKPM = companyLKPM.filter((l) => l.status === 'Draf');

    const hasExpiredOrCriticalPermit = expiredPermits.length > 0 || criticalPermits.length > 0;
    const hasUnfiledOrRevisionLKPM = unfiledLKPM.length > 0 || revisionLKPM.length > 0;

    let comparisonStatus: ComparisonStatus = 'FULLY_COMPLIANT';
    let statusLabel = '✅ Patuh Penuh';
    let statusDescription = 'Seluruh izin aktif & LKPM telah disetujui';
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (hasExpiredOrCriticalPermit && hasUnfiledOrRevisionLKPM) {
      comparisonStatus = 'DUAL_VIOLATION';
      statusLabel = '🚨 Pelanggaran Ganda';
      statusDescription = 'Izin Habis/Kritis SEKALIGUS Belum Lapor LKPM';
      badgeColor = 'bg-rose-600 text-white border-rose-700 shadow-sm';
    } else if (hasExpiredOrCriticalPermit && !hasUnfiledOrRevisionLKPM) {
      comparisonStatus = 'PERMIT_ONLY_ISSUE';
      statusLabel = '⚠️ Izin Habis / Kritis Saja';
      statusDescription = 'Perlu perpanjangan izin, pelaporan LKPM tertib';
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (!hasExpiredOrCriticalPermit && hasUnfiledOrRevisionLKPM) {
      comparisonStatus = 'LKPM_ONLY_ISSUE';
      statusLabel = '⚠️ Belum Lapor LKPM Saja';
      statusDescription = 'Kewajiban LKPM tertunda, izin usaha aman';
      badgeColor = 'bg-indigo-100 text-indigo-900 border-indigo-300';
    }

    return {
      nib: company.nib,
      companyId: company.id,
      companyName: company.name,
      scale: company.scale,
      sector: company.sector,
      address: company.address,
      picName: company.picName,
      picEmail: company.picEmail,
      picPhone: company.picPhone,

      totalPermits: companyPermits.length,
      expiredPermits,
      criticalPermits,
      warningPermits,
      safePermits,
      allPermits: companyPermits,
      hasExpiredOrCriticalPermit,

      totalLKPM: companyLKPM.length,
      unfiledLKPM,
      revisionLKPM,
      approvedLKPM,
      draftLKPM,
      allLKPM: companyLKPM,
      hasUnfiledOrRevisionLKPM,

      comparisonStatus,
      statusLabel,
      statusDescription,
      badgeColor
    };
  });
};

export const generateEmailNotificationTemplate = (
  type: 'PERMIT' | 'LKPM' | 'WARNING_LETTER' | 'DUAL_VIOLATION',
  recipientName: string,
  companyName: string,
  itemTitle: string,
  daysCount: number,
  extraDetails?: string,
  nibNumber?: string
) => {
  const isExpired = daysCount < 0;
  const absDays = Math.abs(daysCount);

  let badgeColor = '#e11d48';
  let statusHeadline = 'PERINGATAN RESMI KEPATUHAN PERUSAHAAN';
  let messageIntro = '';

  if (type === 'PERMIT') {
    if (isExpired) {
      statusHeadline = 'PERIZINAN KEDALUWARSA - TINDAKAN SEGERA DIPERLUKAN';
      messageIntro = `Dokumen perizinan/sertifikat usaha <strong>${itemTitle}</strong> milik <strong>${companyName}</strong> telah <strong>KEDALUWARSA sejak ${absDays} hari lalu</strong>.`;
    } else {
      statusHeadline = `PERINGATAN MASA BERLAKU (SISA ${daysCount} HARI)`;
      messageIntro = `Masa berlaku perizinan/sertifikat <strong>${itemTitle}</strong> milik <strong>${companyName}</strong> tersisa <strong>${daysCount} hari kalender</strong> lagi.`;
    }
  } else if (type === 'LKPM') {
    badgeColor = '#dc2626';
    statusHeadline = 'TEGURAN KETERLAMBATAN PELAPORAN LKPM (OSS-BKPM)';
    messageIntro = `Perusahaan <strong>${companyName}</strong> terdeteksi <strong>BELUM MENYAMPAIKAN Laporan Kegiatan Penanaman Modal (LKPM)</strong> untuk periode <strong>${itemTitle}</strong> yang telah melewati batas akhir. Segera laksanakan pelaporan pada sistem OSS-RBA.`;
  } else if (type === 'DUAL_VIOLATION') {
    badgeColor = '#991b1b';
    statusHeadline = 'PERINGATAN RESMI TERPADU: PELANGGARAN GANDA PERIZINAN & LKPM';
    messageIntro = `Berdasarkan audit komparasi terpadu berbasis NIB (<strong>${nibNumber || '-'}</strong>), perusahaan <strong>${companyName}</strong> terdeteksi memiliki <strong>PELANGGARAN GANDA</strong>: Dokumen perizinan telah <strong>kedaluwarsa/kritis</strong> SEKALIGUS <strong>belum menyampaikan kewajiban Laporan Kegiatan Penanaman Modal (LKPM)</strong> pada sistem OSS-RBA.`;
  } else {
    badgeColor = '#b91c1c';
    statusHeadline = 'PENERBITAN SURAT TEGURAN RESMI KEPATUHAN';
    messageIntro = `Telah diterbitkan Surat Teguran Resmi Kepatuhan Perizinan dan Pelaporan Investasi untuk <strong>${companyName}</strong>.`;
  }

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #38bdf8;">KEPATUHAN<span style="color:#ffffff;">PLUS</span></h2>
          <span style="background: ${badgeColor}; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
            ${type === 'DUAL_VIOLATION' ? 'SP Terpadu NIB' : 'Notifikasi Resmi'}
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Sistem Manajemen & Pengawasan Masa Berlaku Perizinan & LKPM Berbasis OSS-RBA</p>
      </div>

      <div style="padding: 28px;">
        <div style="border-left: 4px solid ${badgeColor}; padding-left: 14px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 16px; font-weight: 700;">${statusHeadline}</h3>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            NIB: <strong>${nibNumber || 'Terdaftar'}</strong> | Tanggal Audit: ${formatIndonesianDate(new Date().toISOString())}
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
          Kepada Yth.<br/>
          <strong>Bapak/Ibu ${recipientName}</strong><br/>
          Penanggung Jawab Kepatuhan & Perizinan (PIC)<br/>
          <strong>${companyName}</strong>
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          ${messageIntro}
        </p>

        ${extraDetails ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Rincian Pelanggaran Terpadu:</h4>
          <div style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.6;">${extraDetails}</div>
        </div>` : ''}

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
            <strong>Peringatan Hukum & Batas Waktu:</strong> Sesuai PP No. 5 Tahun 2021 dan Peraturan BKPM No. 5 Tahun 2021, kelalaian ganda ini wajib diselesaikan dalam tempo paling lambat <strong>5 (lima) hari kerja</strong>. Pengabaian surat teguran ini akan ditindaklanjuti dengan pembekuan izin operasional dan pemblokiran hak akses NIB pada portal OSS-RBA.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="#" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 14px; border-radius: 8px; display: inline-block;">
            Konfirmasi Penyelesaian Kepatuhan NIB
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Email ini diterbitkan melalui Sistem Terpadu Pengawasan Kepatuhan OSS-RBA & BKPM. Anda menerima peringatan resmi ini karena tercatat sebagai PIC berwenang untuk <strong>${companyName}</strong> (NIB: ${nibNumber || '-'}).
        </p>
      </div>
    </div>
  `;
};


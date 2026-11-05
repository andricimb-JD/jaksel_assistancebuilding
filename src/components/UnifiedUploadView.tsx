import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Search, 
  Info,
  Check,
  FileText,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Permit, 
  LKPMRecord, 
  PermitCategory, 
  LKPMStatus, 
  LKPMPeriod, 
  LKPMSanction, 
  Company, 
  UserAccount 
} from '../types';
import { 
  generateSampleCsvPermits, 
  generateSampleCsvLKPM, 
  formatCurrencyIDR, 
  formatIndonesianDate,
  calculateDaysRemaining,
  getPermitStatusBadge
} from '../utils/helpers';

interface UnifiedUploadViewProps {
  companies: Company[];
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  currentUser: UserAccount;
  onBulkImportPermits: (importedPermits: Permit[]) => void;
  onBulkImportLKPM: (importedRecords: LKPMRecord[]) => void;
  onDeletePermit?: (id: string) => void;
  onDeleteLKPM?: (id: string) => void;
}

export const UnifiedUploadView: React.FC<UnifiedUploadViewProps> = ({
  companies,
  permits,
  lkpmRecords,
  currentUser,
  onBulkImportPermits,
  onBulkImportLKPM,
  onDeletePermit,
  onDeleteLKPM
}) => {
  // Main Category Tab: 'permits' | 'lkpm' | 'history'
  const [activeUploadSection, setActiveUploadSection] = useState<'permits' | 'lkpm' | 'history'>('permits');
  
  // Input method for current upload: 'upload' (file) | 'paste' (text)
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');

  // Permit Upload State
  const [permitFileName, setPermitFileName] = useState<string | null>(null);
  const [permitValidatedData, setPermitValidatedData] = useState<Permit[]>([]);
  const [permitErrorMessages, setPermitErrorMessages] = useState<string[]>([]);
  const [permitPasteText, setPermitPasteText] = useState('');
  const [isProcessingPermit, setIsProcessingPermit] = useState(false);
  const [permitDragActive, setPermitDragActive] = useState(false);
  const permitFileInputRef = useRef<HTMLInputElement>(null);

  // LKPM Upload State
  const [lkpmFileName, setLkpmFileName] = useState<string | null>(null);
  const [lkpmValidatedData, setLkpmValidatedData] = useState<LKPMRecord[]>([]);
  const [lkpmErrorMessages, setLkpmErrorMessages] = useState<string[]>([]);
  const [lkpmPasteText, setLkpmPasteText] = useState('');
  const [isProcessingLKPM, setIsProcessingLKPM] = useState(false);
  const [lkpmDragActive, setLkpmDragActive] = useState(false);
  const lkpmFileInputRef = useRef<HTMLInputElement>(null);

  // History / Search State
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'all' | 'permits' | 'lkpm'>('all');

  // ----------------------------------------------------
  // TEMPLATE DOWNLOADS
  // ----------------------------------------------------
  const handleDownloadPermitCsvTemplate = () => {
    const csvContent = generateSampleCsvPermits();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Upload_Perizinan_Sertifikat.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPermitXlsxTemplate = () => {
    const ws_data = [
      [
        'Nama Perusahaan',
        'NIB',
        'Nama Perizinan',
        'Kategori',
        'Nomor Dokumen',
        'Instansi Penerbit',
        'Tanggal Terbit (YYYY-MM-DD)',
        'Tanggal Kedaluwarsa (YYYY-MM-DD)',
        'Nama PIC',
        'Email PIC',
        'Catatan Teknis'
      ],
      [
        'PT Nusantara Petrokimia Raya',
        '1289000452109',
        'Izin Lingkungan Hidup (Persetujuan Lingkungan / AMDAL)',
        'Lingkungan Hidup',
        'SK.520/MENLHK/SETJEN/PLA.4/2021',
        'Kementerian Lingkungan Hidup dan Kehutanan RI',
        '2023-11-05',
        '2026-11-05',
        'Andri Wicaksono',
        'andri.cimb@gmail.com',
        'Kajian teknis addendum AMDAL dan persetujuan air limbah'
      ],
      [
        'PT Indo Prima Manufaktur Tbk',
        '9120008471923',
        'Sertifikat Laik Fungsi (SLF) Gedung Pabrik & Gudang A',
        'Bangunan & Konstruksi',
        '640/SLF-DPMPTSP/BKS/2021',
        'Dinas PMPTSP & Tata Bangunan Kab. Bekasi',
        '2021-10-20',
        '2026-10-20',
        'Budi Santoso',
        'legal.indoprima@corp.co.id',
        'Pemeriksaan struktur arsitektur pabrik berkala'
      ],
      [
        'PT Cipta Pangan Lestari',
        '8120309988776',
        'Sertifikat Halal BPJPH (Bahan Baku & Lini Produksi)',
        'Kesehatan & Pangan',
        'ID00410000189420921',
        'BPJPH Kementerian Agama RI',
        '2022-11-15',
        '2026-11-15',
        'Hendra Gunawan',
        'andri.cimb@gmail.com',
        'Audit internal SJPH telah siap'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Perizinan');
    XLSX.writeFile(wb, `Template_Upload_Perizinan_Sertifikat.xlsx`);
  };

  const handleDownloadLKPMCsvTemplate = () => {
    const csvContent = generateSampleCsvLKPM();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Upload_LKPM_BKPM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLKPMXlsxTemplate = () => {
    const ws_data = [
      [
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
      ],
      [
        'PT Nusantara Petrokimia Raya',
        '1289000452109',
        '20111',
        'Industri Kimia Dasar Anorganik Khlor dan Alkali',
        'Kawasan Industri Cilegon Kav. B-12 Banten',
        'Besar',
        'Triwulan III',
        2026,
        '2026-10-15',
        24500000000,
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
        'Industri Suku Cadang Otomotif',
        'Kawasan MM2100 Cikarang Barat',
        'Besar',
        'Triwulan III',
        2026,
        '2026-10-15',
        15200000000,
        'Belum Lapor',
        'Peringatan Tertulis II',
        'Budi Santoso',
        'legal.indoprima@corp.co.id',
        'Terancam sanksi SP2'
      ],
      [
        'CV Berkah Energi Mandiri',
        '9120401122334',
        '35101',
        'Pembangkitan Tenaga Listrik Biomassa',
        'Jl. Ahmad Yani No. 88 Banjarbaru',
        'Kecil',
        'Semester I',
        2026,
        '2026-11-30',
        1200000000,
        'Draf',
        'Aman',
        'Rahmat Hidayat',
        'rahmat.energi@gmail.com',
        'Draf internal disiapkan'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template LKPM BKPM');
    XLSX.writeFile(wb, `Template_Upload_LKPM_BKPM.xlsx`);
  };

  // ----------------------------------------------------
  // PARSER: PERMIT ROWS
  // ----------------------------------------------------
  const processRawPermitRows = (rows: any[]) => {
    const validated: Permit[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return row[rowKey];
            }
          }
        }
        return '';
      };

      const companyName = String(getVal('Nama Perusahaan', 'Perusahaan', 'NamaPT', 'Nama') || '').trim();
      const nib = String(getVal('NIB', 'Nomor Induk Berusaha') || '').trim();
      const permitName = String(getVal('Nama Perizinan', 'Perizinan', 'Nama Dokumen', 'Izin') || '').trim();
      const categoryRaw = String(getVal('Kategori', 'Kategori Izin', 'Category') || 'Legalitas Dasar').trim();
      const documentNumber = String(getVal('Nomor Dokumen', 'No Dokumen', 'No Izin', 'Nomor SK') || 'PENDING-REG').trim();
      const issuingAuthority = String(getVal('Instansi Penerbit', 'Penerbit', 'Instansi') || 'BKPM / OSS-RBA').trim();
      const issuedDate = String(getVal('Tanggal Terbit', 'Tgl Terbit', 'Issued Date') || new Date().toISOString().split('T')[0]).trim();
      const expiryDate = String(getVal('Tanggal Kedaluwarsa', 'Tgl Habis', 'Expiry Date', 'Masa Berlaku') || '').trim();
      const picName = String(getVal('Nama PIC', 'PIC', 'Penanggung Jawab') || 'Andri Wicaksono').trim();
      const picEmail = String(getVal('Email PIC', 'Email', 'Surel') || 'andri.cimb@gmail.com').trim();
      const notes = String(getVal('Catatan Teknis', 'Catatan', 'Notes') || '').trim();

      if (!companyName) {
        errors.push(`Baris ${idx + 1}: Nama Perusahaan kosong`);
        return;
      }
      if (!permitName) {
        errors.push(`Baris ${idx + 1}: Nama Perizinan kosong`);
        return;
      }
      if (!expiryDate) {
        errors.push(`Baris ${idx + 1}: Tanggal Kedaluwarsa kosong`);
        return;
      }

      const matchedCompany = companies.find(
        (c) => c.name.toLowerCase() === companyName.toLowerCase() || (nib && c.nib === nib)
      );
      const companyId = matchedCompany ? matchedCompany.id : `comp-auto-${Date.now().toString().slice(-4)}-${idx}`;
      const resolvedNib = nib || (matchedCompany ? matchedCompany.nib : undefined);

      let category: PermitCategory = 'Legalitas Dasar';
      const catLower = categoryRaw.toLowerCase();
      if (catLower.includes('lingkungan')) category = 'Lingkungan Hidup';
      else if (catLower.includes('bangunan') || catLower.includes('konstruksi')) category = 'Bangunan & Konstruksi';
      else if (catLower.includes('kesehatan') || catLower.includes('pangan') || catLower.includes('halal')) category = 'Kesehatan & Pangan';
      else if (catLower.includes('k3') || catLower.includes('ketenagakerjaan')) category = 'K3 & Ketenagakerjaan';
      else if (catLower.includes('operasional') || catLower.includes('teknis')) category = 'Operasional & Teknis';
      else if (catLower.includes('mutu') || catLower.includes('standar')) category = 'Mutu & Standar Industri';

      validated.push({
        id: `prm-bulk-${Date.now().toString().slice(-6)}-${idx}`,
        companyId,
        companyName,
        nib: resolvedNib,
        permitName,
        category,
        documentNumber,
        issuingAuthority,
        issuedDate,
        expiryDate,
        picName,
        picEmail,
        reminderIntervals: [90, 30, 14, 7],
        followUpStatus: 'Belum Ditindaklanjuti',
        notes
      });
    });

    setPermitValidatedData(validated);
    setPermitErrorMessages(errors);
  };

  const handlePermitFileUpload = (file: File) => {
    setIsProcessingPermit(true);
    setPermitFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        processRawPermitRows(json);
      } catch (err: any) {
        setPermitErrorMessages([`Gagal memproses file perizinan: ${err.message || 'Format tidak valid'}`]);
      } finally {
        setIsProcessingPermit(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePermitPasteProcess = () => {
    if (!permitPasteText.trim()) return;
    try {
      const workbook = XLSX.read(permitPasteText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      processRawPermitRows(json);
      setPermitFileName('Manual_CSV_Paste_Perizinan.csv');
    } catch (err: any) {
      setPermitErrorMessages([`Gagal mengurai teks CSV perizinan: ${err.message}`]);
    }
  };

  const handleCommitPermitImport = () => {
    if (permitValidatedData.length === 0) return;
    onBulkImportPermits(permitValidatedData);
    handleResetPermit();
    setActiveUploadSection('history');
  };

  const handleResetPermit = () => {
    setPermitFileName(null);
    setPermitValidatedData([]);
    setPermitErrorMessages([]);
    setPermitPasteText('');
    if (permitFileInputRef.current) permitFileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // PARSER: LKPM ROWS
  // ----------------------------------------------------
  const processRawLKPMRows = (rows: any[]) => {
    const validated: LKPMRecord[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return row[rowKey];
            }
          }
        }
        return '';
      };

      const companyName = String(getVal('Nama Perusahaan', 'Perusahaan', 'NamaPT', 'Nama') || '').trim();
      const nib = String(getVal('NIB', 'Nomor Induk Berusaha') || '0000000000000').trim();
      const kbliCode = String(getVal('Kode KBLI', 'KBLI', 'Kode') || '00000').trim();
      const kbliTitle = String(getVal('Judul KBLI', 'KBLI Description', 'Nama KBLI') || 'Kegiatan Usaha Berbasis Risiko').trim();
      const projectLocation = String(getVal('Lokasi Proyek', 'Lokasi', 'Alamat Proyek') || 'Indonesia').trim();
      const scale = (String(getVal('Skala Usaha', 'Skala') || 'Besar').trim()) as any;
      const period = (String(getVal('Periode LKPM', 'Periode', 'Triwulan') || 'Triwulan III').trim()) as LKPMPeriod;
      const year = Number(getVal('Tahun', 'Year')) || 2026;
      const deadlineDate = String(getVal('Batas Waktu', 'Batas Lapor', 'Deadline') || '2026-10-15').trim();
      const investmentRealization = Number(String(getVal('Nilai Investasi', 'Realisasi Investasi', 'Investasi') || '0').replace(/[^0-9]/g, '')) || 0;
      const statusRaw = String(getVal('Status Pelaporan', 'Status', 'Status LKPM') || 'Belum Lapor').trim();
      const sanctionRaw = String(getVal('Tingkat Sanksi', 'Sanksi') || 'Aman').trim();
      const picName = String(getVal('Nama PIC', 'PIC', 'Penanggung Jawab') || 'Admin Kepatuhan').trim();
      const picEmail = String(getVal('Email PIC', 'Email', 'Surel') || 'andri.cimb@gmail.com').trim();
      const officerNotes = String(getVal('Catatan Petugas', 'Catatan', 'Notes') || '').trim();

      if (!companyName) {
        errors.push(`Baris ${idx + 1}: Nama Perusahaan kosong`);
        return;
      }

      const matchedCompany = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
      const companyId = matchedCompany ? matchedCompany.id : `comp-auto-${Date.now().toString().slice(-4)}-${idx}`;

      let status: LKPMStatus = 'Belum Lapor';
      if (statusRaw.toLowerCase().includes('setuju')) status = 'Disetujui';
      else if (statusRaw.toLowerCase().includes('kirim')) status = 'Terkirim';
      else if (statusRaw.toLowerCase().includes('perbaikan') || statusRaw.toLowerCase().includes('revisi')) status = 'Perlu Perbaikan';
      else if (statusRaw.toLowerCase().includes('draf') || statusRaw.toLowerCase().includes('draft')) status = 'Draf';
      else status = 'Belum Lapor';

      let sanction: LKPMSanction = 'Aman';
      if (sanctionRaw.toLowerCase().includes('ii') || sanctionRaw.toLowerCase().includes('2')) sanction = 'Peringatan Tertulis II';
      else if (sanctionRaw.toLowerCase().includes('i') || sanctionRaw.toLowerCase().includes('1')) sanction = 'Peringatan Tertulis I';
      else if (sanctionRaw.toLowerCase().includes('beku')) sanction = 'Pembekuan Izin Sementara';

      validated.push({
        id: `lkpm-bulk-${Date.now().toString().slice(-6)}-${idx}`,
        companyId,
        companyName,
        nib: nib || (matchedCompany ? matchedCompany.nib : '1289000123456'),
        kbliCode,
        kbliTitle,
        projectLocation,
        scale: scale || 'Besar',
        period: period || 'Triwulan III',
        year,
        deadlineDate,
        investmentRealization,
        status,
        sanctionLevel: sanction,
        followUpStatus: 'Belum Ditindaklanjuti',
        picName,
        picEmail,
        officerNotes
      });
    });

    setLkpmValidatedData(validated);
    setLkpmErrorMessages(errors);
  };

  const handleLKPMFileUpload = (file: File) => {
    setIsProcessingLKPM(true);
    setLkpmFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        processRawLKPMRows(json);
      } catch (err: any) {
        setLkpmErrorMessages([`Gagal memproses file LKPM: ${err.message || 'Format tidak valid'}`]);
      } finally {
        setIsProcessingLKPM(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLKPMPasteProcess = () => {
    if (!lkpmPasteText.trim()) return;
    try {
      const workbook = XLSX.read(lkpmPasteText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      processRawLKPMRows(json);
      setLkpmFileName('Manual_CSV_Paste_LKPM.csv');
    } catch (err: any) {
      setLkpmErrorMessages([`Gagal mengurai teks CSV LKPM: ${err.message}`]);
    }
  };

  const handleCommitLKPMImport = () => {
    if (lkpmValidatedData.length === 0) return;
    onBulkImportLKPM(lkpmValidatedData);
    handleResetLKPM();
    setActiveUploadSection('history');
  };

  const handleResetLKPM = () => {
    setLkpmFileName(null);
    setLkpmValidatedData([]);
    setLkpmErrorMessages([]);
    setLkpmPasteText('');
    if (lkpmFileInputRef.current) lkpmFileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // FILTERED HISTORY FOR VERIFICATION
  // ----------------------------------------------------
  const filteredPermitHistory = permits.filter((p) => {
    const q = historySearchQuery.toLowerCase();
    return (
      p.permitName.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q) ||
      p.documentNumber.toLowerCase().includes(q) ||
      (p.nib && p.nib.includes(q))
    );
  });

  const filteredLKPMHistory = lkpmRecords.filter((l) => {
    const q = historySearchQuery.toLowerCase();
    return (
      l.companyName.toLowerCase().includes(q) ||
      l.kbliCode.includes(q) ||
      l.kbliTitle.toLowerCase().includes(q) ||
      (l.nib && l.nib.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Officer Header Card */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Akses Khusus: {currentUser.roleTitle} ({currentUser.name})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Upload Data Perizinan &amp; LKPM
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Sesuai wewenang peran, portal ini khusus digunakan oleh Petugas untuk mengunggah dan memperbarui berkas data perizinan usaha dan pelaporan LKPM BKPM secara massal (Excel .xlsx / CSV).
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur px-4 py-3 rounded-xl border border-slate-700 text-center">
              <span className="text-2xl font-black text-amber-400">{permits.length}</span>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Izin Terdaftar</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur px-4 py-3 rounded-xl border border-slate-700 text-center">
              <span className="text-2xl font-black text-sky-400">{lkpmRecords.length}</span>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Data LKPM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Selector: Upload Perizinan vs Upload LKPM vs History */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveUploadSection('permits')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
            activeUploadSection === 'permits'
              ? 'bg-amber-600 text-white shadow-amber-900/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Upload Data Perizinan &amp; Sertifikat</span>
          {permitValidatedData.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 text-[10px]">
              {permitValidatedData.length} siap
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveUploadSection('lkpm')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
            activeUploadSection === 'lkpm'
              ? 'bg-indigo-600 text-white shadow-indigo-900/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Upload Data Monitoring LKPM</span>
          {lkpmValidatedData.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white text-indigo-700 text-[10px]">
              {lkpmValidatedData.length} siap
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveUploadSection('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
            activeUploadSection === 'history'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Verifikasi Data yang Telah Terunggah</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px]">
            {permits.length + lkpmRecords.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: UPLOAD DATA PERIZINAN */}
      {/* ========================================================================= */}
      {activeUploadSection === 'permits' && (
        <div className="space-y-5 animate-slide-in">
          {/* Header Action Bar */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>Upload Massal Data Dokumen Perizinan &amp; Sertifikasi</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah berkas spreadsheet perizinan berizin OSS-RBA (AMDAL, SLF, Halal, K3, dsb) lengkap dengan NIB untuk sinkronisasi masa berlaku.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleDownloadPermitXlsxTemplate}
                className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh Template Perizinan (.xlsx)</span>
              </button>
              <button
                onClick={handleDownloadPermitCsvTemplate}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Sub Tab: File vs Paste */}
          <div className="flex space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setInputMethod('upload')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                inputMethod === 'upload'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unggah File (.xlsx, .xls, .csv)
            </button>
            <button
              onClick={() => setInputMethod('paste')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                inputMethod === 'paste'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Copy-Paste Teks CSV
            </button>
          </div>

          {/* Drag & Drop Upload Area */}
          {inputMethod === 'upload' ? (
            <div
              onDragEnter={(e) => { e.preventDefault(); setPermitDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setPermitDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); setPermitDragActive(true); }}
              onDrop={(e) => {
                e.preventDefault();
                setPermitDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handlePermitFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                permitDragActive
                  ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input
                ref={permitFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePermitFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Tarik &amp; Lepaskan File Spreadsheet Perizinan ke Sini
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Mendukung file Microsoft Excel (.xlsx, .xls) dan CSV dengan kolom Perusahaan, NIB, Nama Izin, Nomor Dokumen, dan Tanggal Kedaluwarsa.
              </p>

              <div className="mt-5 flex items-center justify-center space-x-3">
                <button
                  onClick={() => permitFileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Pilih Berkas Perizinan dari Komputer</span>
                </button>
              </div>

              <div className="mt-4 text-[11px] text-slate-400">
                {isProcessingPermit ? 'Sedang membaca file...' : 'Format baku OSS-RBA BKPM • Aman & Terverifikasi Langsung'}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Tempelkan Teks CSV / Baris Excel Perizinan:
              </label>
              <textarea
                rows={6}
                value={permitPasteText}
                onChange={(e) => setPermitPasteText(e.target.value)}
                placeholder={`Nama Perusahaan,NIB,Nama Perizinan,Kategori,Nomor Dokumen,Instansi Penerbit,Tanggal Terbit,Tanggal Kedaluwarsa,Nama PIC,Email PIC\nPT Nusantara Petrokimia Raya,1289000452109,Izin Lingkungan Hidup,Lingkungan Hidup,SK.520/2021,KLHK,2023-11-05,2026-11-05,Andri,andri.cimb@gmail.com`}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePermitPasteProcess}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Urai &amp; Validasi Perizinan
                </button>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {permitErrorMessages.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Peringatan Validasi ({permitErrorMessages.length}):</span>
              </div>
              {permitErrorMessages.slice(0, 3).map((err, i) => (
                <p key={i} className="pl-5 text-[11px]">• {err}</p>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {permitValidatedData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Pratinjau Hasil Pembacaan: {permitFileName || 'Data Terurai'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Terdeteksi <strong className="text-emerald-700">{permitValidatedData.length} dokumen perizinan valid</strong> siap disimpan ke sistem.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetPermit}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan</span>
                  </button>
                  <button
                    onClick={handleCommitPermitImport}
                    className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan &amp; Masukkan {permitValidatedData.length} Perizinan Sekarang</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Perusahaan</th>
                      <th className="py-2.5 px-3">NIB</th>
                      <th className="py-2.5 px-3">Nama Perizinan</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">No. Dokumen</th>
                      <th className="py-2.5 px-3">Kedaluwarsa</th>
                      <th className="py-2.5 px-3">PIC Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permitValidatedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.companyName}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.nib || '-'}</td>
                        <td className="py-2 px-3 text-slate-900 font-medium">{item.permitName}</td>
                        <td className="py-2 px-3 text-slate-600">{item.category}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.documentNumber}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{item.expiryDate}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{item.picEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: UPLOAD DATA LKPM */}
      {/* ========================================================================= */}
      {activeUploadSection === 'lkpm' && (
        <div className="space-y-5 animate-slide-in">
          {/* Header Action Bar */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Upload Massal Data Pelaporan LKPM BKPM</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah data pelaporan investasi berkala (Triwulanan/Semesteran) untuk memantau status 'Belum Lapor', 'Perlu Perbaikan', atau 'Disetujui'.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleDownloadLKPMXlsxTemplate}
                className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh Template LKPM (.xlsx)</span>
              </button>
              <button
                onClick={handleDownloadLKPMCsvTemplate}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Sub Tab: File vs Paste */}
          <div className="flex space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setInputMethod('upload')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                inputMethod === 'upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unggah File (.xlsx, .xls, .csv)
            </button>
            <button
              onClick={() => setInputMethod('paste')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                inputMethod === 'paste'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Copy-Paste Teks CSV
            </button>
          </div>

          {/* Drag & Drop Upload Area */}
          {inputMethod === 'upload' ? (
            <div
              onDragEnter={(e) => { e.preventDefault(); setLkpmDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setLkpmDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); setLkpmDragActive(true); }}
              onDrop={(e) => {
                e.preventDefault();
                setLkpmDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleLKPMFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                lkpmDragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input
                ref={lkpmFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleLKPMFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Tarik &amp; Lepaskan File Spreadsheet LKPM ke Sini
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Mendukung Microsoft Excel (.xlsx, .xls) dan CSV sesuai format resmi Kementerian Investasi / BKPM.
              </p>

              <div className="mt-5 flex items-center justify-center space-x-3">
                <button
                  onClick={() => lkpmFileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Pilih Berkas LKPM dari Komputer</span>
                </button>
              </div>

              <div className="mt-4 text-[11px] text-slate-400">
                {isProcessingLKPM ? 'Sedang membaca file...' : 'Format baku LKPM OSS-RBA BKPM • Aman & Terverifikasi Langsung'}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Tempelkan Teks CSV / Baris Excel LKPM:
              </label>
              <textarea
                rows={6}
                value={lkpmPasteText}
                onChange={(e) => setLkpmPasteText(e.target.value)}
                placeholder={`Nama Perusahaan,NIB,Kode KBLI,Judul KBLI,Lokasi Proyek,Skala Usaha,Periode LKPM,Tahun,Batas Waktu,Nilai Investasi,Status Pelaporan,Tingkat Sanksi,Nama PIC,Email PIC\nPT Nusantara Petrokimia Raya,1289000452109,20111,Industri Kimia,Cilegon,Besar,Triwulan III,2026,2026-10-15,24500000000,Belum Lapor,Peringatan Tertulis I,Andri Wicaksono,andri.cimb@gmail.com`}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleLKPMPasteProcess}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Urai &amp; Validasi LKPM
                </button>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {lkpmErrorMessages.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Peringatan Validasi ({lkpmErrorMessages.length}):</span>
              </div>
              {lkpmErrorMessages.slice(0, 3).map((err, i) => (
                <p key={i} className="pl-5 text-[11px]">• {err}</p>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {lkpmValidatedData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Pratinjau Hasil Pembacaan: {lkpmFileName || 'Data Terurai'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Terdeteksi <strong className="text-emerald-700">{lkpmValidatedData.length} data LKPM valid</strong> siap dimasukkan ke sistem.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetLKPM}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan</span>
                  </button>
                  <button
                    onClick={handleCommitLKPMImport}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan &amp; Masukkan {lkpmValidatedData.length} Data LKPM Sekarang</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Perusahaan</th>
                      <th className="py-2.5 px-3">NIB</th>
                      <th className="py-2.5 px-3">KBLI</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Nilai Investasi</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Sanksi</th>
                      <th className="py-2.5 px-3">PIC Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lkpmValidatedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.companyName}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.nib}</td>
                        <td className="py-2 px-3 text-slate-700">{item.kbliCode}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{item.period} {item.year}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{formatCurrencyIDR(item.investmentRealization)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Belum Lapor' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">{item.sanctionLevel}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{item.picEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: VERIFIKASI DATA TERUNGGAH */}
      {/* ========================================================================= */}
      {activeUploadSection === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 animate-slide-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Verifikasi Data yang Telah Tersimpan di Sistem</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan data dokumen perizinan dan kewajiban pelaporan LKPM yang Anda unggah telah tercatat dengan akurat.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setHistoryCategoryFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  historyCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Semua ({permits.length + lkpmRecords.length})
              </button>
              <button
                onClick={() => setHistoryCategoryFilter('permits')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  historyCategoryFilter === 'permits'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Perizinan ({permits.length})
              </button>
              <button
                onClick={() => setHistoryCategoryFilter('lkpm')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  historyCategoryFilter === 'lkpm'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                LKPM ({lkpmRecords.length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama perusahaan, NIB, nomor dokumen izin, atau kode KBLI..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Data Tables */}
          <div className="space-y-6">
            {(historyCategoryFilter === 'all' || historyCategoryFilter === 'permits') && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Data Dokumen Perizinan &amp; Sertifikat ({filteredPermitHistory.length})
                  </h4>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3">Perusahaan &amp; NIB</th>
                        <th className="py-2 px-3">Nama Izin / Dokumen</th>
                        <th className="py-2 px-3">Nomor Dokumen</th>
                        <th className="py-2 px-3">Instansi Penerbit</th>
                        <th className="py-2 px-3">Kedaluwarsa</th>
                        <th className="py-2 px-3">Status</th>
                        {onDeletePermit && <th className="py-2 px-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPermitHistory.length === 0 ? (
                        <tr>
                          <td colSpan={onDeletePermit ? 7 : 6} className="py-8 text-center text-slate-400">
                            Belum ada dokumen perizinan yang terunggah. Silakan gunakan tab "Upload Data Perizinan &amp; Sertifikat" di atas.
                          </td>
                        </tr>
                      ) : (
                        filteredPermitHistory.map((p) => {
                        const days = calculateDaysRemaining(p.expiryDate);
                        const badge = getPermitStatusBadge(
                          days < 0 ? 'expired' : days <= 7 ? 'warning_7' : days <= 30 ? 'warning_30' : days <= 90 ? 'warning_90' : 'active',
                          days
                        );
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition">
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800 block">{p.companyName}</span>
                              <span className="text-[11px] font-mono text-slate-500">NIB: {p.nib || '-'}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-900 font-medium">{p.permitName}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{p.documentNumber}</td>
                            <td className="py-2 px-3 text-slate-600">{p.issuingAuthority}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{formatIndonesianDate(p.expiryDate)}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </td>
                            {onDeletePermit && (
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => onDeletePermit(p.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                  title="Hapus Izin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(historyCategoryFilter === 'all' || historyCategoryFilter === 'lkpm') && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Data Kewajiban Pelaporan LKPM BKPM ({filteredLKPMHistory.length})
                  </h4>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3">Perusahaan &amp; NIB</th>
                        <th className="py-2 px-3">KBLI &amp; Proyek</th>
                        <th className="py-2 px-3">Periode</th>
                        <th className="py-2 px-3">Batas Waktu</th>
                        <th className="py-2 px-3">Realisasi Investasi</th>
                        <th className="py-2 px-3">Status</th>
                        {onDeleteLKPM && <th className="py-2 px-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLKPMHistory.length === 0 ? (
                        <tr>
                          <td colSpan={onDeleteLKPM ? 7 : 6} className="py-8 text-center text-slate-400">
                            Belum ada data pelaporan LKPM yang terunggah. Silakan gunakan tab "Upload Data Monitoring LKPM" di atas.
                          </td>
                        </tr>
                      ) : (
                        filteredLKPMHistory.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-800 block">{l.companyName}</span>
                            <span className="text-[11px] font-mono text-slate-500">NIB: {l.nib}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-800 block">{l.kbliCode}</span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">{l.kbliTitle}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">{l.period} {l.year}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{formatIndonesianDate(l.deadlineDate)}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{formatCurrencyIDR(l.investmentRealization)}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.status === 'Belum Lapor' 
                                ? 'bg-rose-100 text-rose-800' 
                                : l.status === 'Disetujui'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          {onDeleteLKPM && (
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => onDeleteLKPM(l.id)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                title="Hapus LKPM"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guidelines Card */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-amber-600" />
          <span>Pedoman Petugas Input Data Perizinan &amp; LKPM OSS-RBA</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Ketepatan NIB:</strong> Pastikan NIB 13-digit dimasukkan dengan tepat agar data perizinan dan LKPM otomatis terhubung saat dianalisis oleh Koordinator.</li>
            <li><strong>Format Tanggal:</strong> Gunakan standar internasional <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">YYYY-MM-DD</code> (contoh: 2026-10-15) agar perhitungan sisa hari akurat.</li>
          </ul>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Kolom Kontak PIC:</strong> Masukkan nama dan email PIC penanggung jawab perizinan/LKPM perusahaan agar notifikasi dapat terkirim secara otomatis.</li>
            <li><strong>Pemeriksaan Hasil:</strong> Setelah impor berhasil, gunakan tab "Verifikasi Data" untuk memeriksa kembali status data yang telah diinput.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

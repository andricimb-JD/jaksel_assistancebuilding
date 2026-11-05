import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  AlertOctagon, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  FileWarning, 
  Mail, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Company, Permit, LKPMRecord, UserRole, NIBComparisonEntity, ComparisonStatus } from '../types';
import { 
  buildNIBComparisonList, 
  formatIndonesianDate, 
  calculateDaysRemaining,
  formatCurrencyIDR 
} from '../utils/helpers';

interface NIBComparisonViewProps {
  companies: Company[];
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  currentUserRole?: UserRole;
  onOpenCombinedLetter: (company: Company, permits: Permit[], lkpm: LKPMRecord[]) => void;
  onSendCombinedEmail: (company: Company, permits: Permit[], lkpm: LKPMRecord[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const NIBComparisonView: React.FC<NIBComparisonViewProps> = ({
  companies,
  permits,
  lkpmRecords,
  currentUserRole = 'koordinator',
  onOpenCombinedLetter,
  onSendCombinedEmail,
  onNavigateTab
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ComparisonStatus>('all');
  const [scaleFilter, setScaleFilter] = useState<string>('all');
  const [expandedNIB, setExpandedNIB] = useState<string | null>(null);
  const [copiedNIB, setCopiedNIB] = useState<string | null>(null);

  // Build the unified comparison data
  const comparisonList = useMemo(() => {
    return buildNIBComparisonList(companies, permits, lkpmRecords);
  }, [companies, permits, lkpmRecords]);

  // Statistics
  const dualViolations = comparisonList.filter((c) => c.comparisonStatus === 'DUAL_VIOLATION');
  const permitOnlyIssues = comparisonList.filter((c) => c.comparisonStatus === 'PERMIT_ONLY_ISSUE');
  const lkpmOnlyIssues = comparisonList.filter((c) => c.comparisonStatus === 'LKPM_ONLY_ISSUE');
  const fullyCompliant = comparisonList.filter((c) => c.comparisonStatus === 'FULLY_COMPLIANT');

  // Filtered entities
  const filteredList = comparisonList.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.comparisonStatus === statusFilter;
    const matchesScale = scaleFilter === 'all' || item.scale === scaleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.companyName.toLowerCase().includes(q) ||
      item.nib.toLowerCase().includes(q) ||
      item.picName.toLowerCase().includes(q) ||
      item.sector.toLowerCase().includes(q);
    return matchesStatus && matchesScale && matchesSearch;
  });

  const handleCopyNIB = (nib: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nib);
    setCopiedNIB(nib);
    setTimeout(() => setCopiedNIB(null), 2000);
  };

  const toggleExpand = (nib: string) => {
    setExpandedNIB((prev) => (prev === nib ? null : nib));
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportRows = filteredList.map((item) => {
      const expiredPermitsStr = item.expiredPermits.map((p) => p.permitName).join('; ');
      const criticalPermitsStr = item.criticalPermits.map((p) => `${p.permitName} (${calculateDaysRemaining(p.expiryDate)}h)`).join('; ');
      const unfiledLKPMStr = item.unfiledLKPM.map((l) => `${l.period} ${l.year}`).join('; ');

      return {
        'NIB Perusahaan': item.nib,
        'Nama Perusahaan': item.companyName,
        'Skala Usaha': item.scale,
        'Sektor Industri': item.sector,
        'Alamat': item.address,
        'Nama PIC': item.picName,
        'Email PIC': item.picEmail,
        'Telepon PIC': item.picPhone,
        'Status Komparasi NIB': item.statusLabel,
        'Izin Kedaluwarsa': item.expiredPermits.length,
        'Daftar Izin Kedaluwarsa': expiredPermitsStr || '-',
        'Izin Kritis (<30 Hari)': item.criticalPermits.length,
        'Daftar Izin Kritis': criticalPermitsStr || '-',
        'LKPM Belum Lapor': item.unfiledLKPM.length,
        'Daftar Periode Belum Lapor': unfiledLKPMStr || '-',
        'LKPM Perlu Revisi': item.revisionLKPM.length,
        'Total Izin': item.totalPermits,
        'Total Laporan LKPM': item.totalLKPM,
        'Kategori Pelanggaran': item.comparisonStatus === 'DUAL_VIOLATION' ? 'PELANGGARAN GANDA (SP TERPADU)' : item.statusLabel
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Komparasi Kepatuhan NIB');
    XLSX.writeFile(workbook, `Matriks_Komparasi_Kepatuhan_NIB_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Komparasi */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30">
              <GitCompare className="w-4 h-4 text-rose-400" />
              <span>Matriks Audit Terpadu Berbasis NIB (Nomor Induk Berusaha)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Komparasi Kepatuhan Perizinan &amp; LKPM
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Menggabungkan data Masa Berlaku Perizinan dengan Monitoring LKPM dalam satu tampilan komparasi.
              Mendeteksi perusahaan yang <strong>Belum Melaporkan LKPM sekaligus masa izinnya habis</strong>,
              sehingga dapat diterbitkan <strong>Surat Teguran Terpadu dalam 1 kali kirim surat</strong>.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-4 flex items-center space-x-4 shadow-inner shrink-0">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-rose-300">Prioritas Surat Teguran Terpadu</p>
              <h3 className="text-xl font-extrabold text-white">
                {dualViolations.length} Perusahaan Terdeteksi
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Izin Habis &amp; LKPM Belum Dilaporkan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dual Violations (Main Focus) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'DUAL_VIOLATION' ? 'all' : 'DUAL_VIOLATION')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            statusFilter === 'DUAL_VIOLATION' 
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/40 shadow-md' 
              : 'bg-white border-rose-200 hover:border-rose-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              🚨 Pelanggaran Ganda NIB
            </span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600">{dualViolations.length}</span>
            <span className="text-xs font-semibold text-rose-800">Perusahaan</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-2 pt-2 border-t border-rose-100 font-medium">
            Masa Izin Habis/Kritis <strong>SEKALIGUS</strong> Belum Lapor LKPM. Target SP Terpadu!
          </p>
        </div>

        {/* Card 2: Permit Only Issue */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'PERMIT_ONLY_ISSUE' ? 'all' : 'PERMIT_ONLY_ISSUE')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            statusFilter === 'PERMIT_ONLY_ISSUE' 
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/40 shadow-md' 
              : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              ⚠️ Hanya Izin Habis / Kritis
            </span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600">{permitOnlyIssues.length}</span>
            <span className="text-xs font-semibold text-amber-800">Perusahaan</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-2 pt-2 border-t border-amber-100 font-medium">
            Perlu perpanjangan izin berusaha, pelaporan LKPM berstatus tertib.
          </p>
        </div>

        {/* Card 3: LKPM Only Issue */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'LKPM_ONLY_ISSUE' ? 'all' : 'LKPM_ONLY_ISSUE')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            statusFilter === 'LKPM_ONLY_ISSUE' 
              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md' 
              : 'bg-white border-indigo-200 hover:border-indigo-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              ⚠️ Hanya Belum Lapor LKPM
            </span>
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-indigo-600">{lkpmOnlyIssues.length}</span>
            <span className="text-xs font-semibold text-indigo-800">Perusahaan</span>
          </div>
          <p className="text-[11px] text-indigo-700 mt-2 pt-2 border-t border-indigo-100 font-medium">
            Terdapat tunggakan LKPM belum lapor, masa izin operasional masih aman.
          </p>
        </div>

        {/* Card 4: Fully Compliant */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'FULLY_COMPLIANT' ? 'all' : 'FULLY_COMPLIANT')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            statusFilter === 'FULLY_COMPLIANT' 
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/40 shadow-md' 
              : 'bg-white border-emerald-200 hover:border-emerald-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              ✅ Kepatuhan Penuh (NIB Bersih)
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600">{fullyCompliant.length}</span>
            <span className="text-xs font-semibold text-emerald-800">Perusahaan</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-emerald-100 font-medium">
            Seluruh izin aktif &amp; seluruh pelaporan LKPM telah disetujui OSS.
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari NIB (mis: 9120008471923), nama perusahaan PT/CV, PIC, atau sektor industri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={scaleFilter}
              onChange={(e) => setScaleFilter(e.target.value)}
              className="py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="all">Semua Skala Usaha</option>
              <option value="Besar">Usaha Besar</option>
              <option value="Menengah">Usaha Menengah</option>
              <option value="Kecil">Usaha Kecil</option>
            </select>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
              title="Download Hasil Komparasi NIB Format Microsoft Excel"
            >
              <Download className="w-4 h-4" />
              <span>Export Matriks (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 pr-1">Filter Kategori NIB:</span>
          {[
            { id: 'all', label: `Semua Entitas (${comparisonList.length})` },
            { id: 'DUAL_VIOLATION', label: `🚨 Pelanggaran Ganda (${dualViolations.length})`, isRed: true },
            { id: 'PERMIT_ONLY_ISSUE', label: `Izin Habis Saja (${permitOnlyIssues.length})` },
            { id: 'LKPM_ONLY_ISSUE', label: `Belum Lapor Saja (${lkpmOnlyIssues.length})` },
            { id: 'FULLY_COMPLIANT', label: `Patuh Penuh (${fullyCompliant.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? tab.isRed
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 text-white shadow-sm'
                  : tab.isRed
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Tabel Matriks Komparasi Perizinan vs LKPM Berdasarkan NIB</span>
            </h3>
            <p className="text-xs text-slate-500">
              Klik baris perusahaan untuk melihat rincian komparasi dokumen perizinan dan laporan LKPM berdampingan.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
            Menampilkan {filteredList.length} dari {comparisonList.length} NIB
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Perusahaan &amp; NIB</th>
                <th className="py-3 px-4">Status Perizinan Berusaha</th>
                <th className="py-3 px-4">Status Kewajiban LKPM</th>
                <th className="py-3 px-4">Hasil Komparasi NIB</th>
                <th className="py-3 px-4 text-center">Aksi Terpadu (1 Surat / 1 Email)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <GitCompare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">
                      {comparisonList.length === 0 
                        ? 'Belum ada data perizinan atau LKPM terdaftar di sistem.' 
                        : 'Tidak ditemukan data komparasi NIB yang sesuai filter.'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {comparisonList.length === 0
                        ? 'Gunakan akun Petugas untuk mengunggah berkas Excel perizinan OSS dan LKPM.'
                        : 'Coba ubah kata kunci pencarian atau reset filter status.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isExpanded = expandedNIB === item.nib;
                  const companyObj = companies.find((c) => c.id === item.companyId || c.nib === item.nib) || {
                    id: item.companyId,
                    name: item.companyName,
                    nib: item.nib,
                    npwp: '-',
                    address: item.address,
                    city: '-',
                    province: '-',
                    picName: item.picName,
                    picEmail: item.picEmail,
                    picPhone: item.picPhone,
                    scale: item.scale,
                    sector: item.sector
                  };

                  return (
                    <React.Fragment key={item.nib}>
                      <tr 
                        onClick={() => toggleExpand(item.nib)}
                        className={`cursor-pointer transition hover:bg-slate-50/90 ${
                          item.comparisonStatus === 'DUAL_VIOLATION' ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Kolom 1: Perusahaan & NIB */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900 text-sm">{item.companyName}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {item.scale}
                              </span>
                            </div>

                            {/* NIB Chip with Copy */}
                            <div className="flex items-center space-x-1 pt-0.5">
                              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center space-x-1">
                                <span>NIB: {item.nib}</span>
                                <button
                                  onClick={(e) => handleCopyNIB(item.nib, e)}
                                  className="hover:text-indigo-900 ml-1 p-0.5"
                                  title="Salin NIB"
                                >
                                  {copiedNIB === item.nib ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-indigo-400" />
                                  )}
                                </button>
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 pt-0.5 truncate max-w-xs">
                              {item.sector} • PIC: {item.picName} ({item.picEmail})
                            </p>
                          </div>
                        </td>

                        {/* Kolom 2: Status Masa Berlaku Perizinan */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800">{item.totalPermits} Dokumen Terdaftar</span>
                            </div>

                            {/* Badge breakdown */}
                            <div className="flex flex-wrap gap-1 text-[11px]">
                              {item.expiredPermits.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  {item.expiredPermits.length} Kedaluwarsa
                                </span>
                              )}
                              {item.criticalPermits.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  {item.criticalPermits.length} Kritis (&lt;30h)
                                </span>
                              )}
                              {item.warningPermits.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                  {item.warningPermits.length} Waspada (&lt;90h)
                                </span>
                              )}
                              {item.safePermits.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {item.safePermits.length} Aktif Aman
                                </span>
                              )}
                            </div>

                            {/* Item name preview */}
                            {item.expiredPermits.length > 0 && (
                              <p className="text-[11px] text-rose-700 font-semibold truncate">
                                🛑 {item.expiredPermits[0].permitName}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Kolom 3: Status Kewajiban LKPM */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-800">{item.totalLKPM} Laporan Proyek</span>
                            </div>

                            <div className="flex flex-wrap gap-1 text-[11px]">
                              {item.unfiledLKPM.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-bold bg-rose-600 text-white shadow-xs">
                                  {item.unfiledLKPM.length} Belum Lapor
                                </span>
                              )}
                              {item.revisionLKPM.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  {item.revisionLKPM.length} Perlu Perbaikan
                                </span>
                              )}
                              {item.approvedLKPM.length > 0 && (
                                <span className="px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {item.approvedLKPM.length} Disetujui
                                </span>
                              )}
                            </div>

                            {item.unfiledLKPM.length > 0 && (
                              <p className="text-[11px] text-rose-700 font-semibold truncate">
                                ⚠️ LKPM {item.unfiledLKPM[0].period} {item.unfiledLKPM[0].year}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Kolom 4: Hasil Komparasi NIB */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${item.badgeColor}`}>
                              {item.statusLabel}
                            </span>
                            <p className="text-[11px] text-slate-600 font-medium">
                              {item.statusDescription}
                            </p>
                          </div>
                        </td>

                        {/* Kolom 5: Aksi Terpadu */}
                        <td className="py-4 px-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                            {currentUserRole === 'koordinator' ? (
                              <>
                                {item.comparisonStatus === 'DUAL_VIOLATION' ? (
                                  <>
                                    <button
                                      onClick={() => onOpenCombinedLetter(companyObj, item.allPermits, item.allLKPM)}
                                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center space-x-1.5 transition"
                                      title="Terbitkan Surat Teguran Terpadu (Pelanggaran Izin & LKPM Sekaligus)"
                                    >
                                      <FileWarning className="w-3.5 h-3.5" />
                                      <span>SP Terpadu</span>
                                    </button>
                                    <button
                                      onClick={() => onSendCombinedEmail(companyObj, item.allPermits, item.allLKPM)}
                                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1"
                                      title="Kirim Email Peringatan Pelanggaran Ganda ke PIC Perusahaan"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>Email Terpadu</span>
                                    </button>
                                  </>
                                ) : item.comparisonStatus === 'PERMIT_ONLY_ISSUE' ? (
                                  <button
                                    onClick={() => onOpenCombinedLetter(companyObj, item.allPermits, item.allLKPM)}
                                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow transition flex items-center justify-center space-x-1"
                                    title="Buat Surat Teguran Perizinan"
                                  >
                                    <FileWarning className="w-3.5 h-3.5" />
                                    <span>Teguran Izin</span>
                                  </button>
                                ) : item.comparisonStatus === 'LKPM_ONLY_ISSUE' ? (
                                  <button
                                    onClick={() => onOpenCombinedLetter(companyObj, item.allPermits, item.allLKPM)}
                                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition flex items-center justify-center space-x-1"
                                    title="Buat Surat Teguran LKPM"
                                  >
                                    <FileWarning className="w-3.5 h-3.5" />
                                    <span>Teguran LKPM</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                    NIB Tertib
                                  </span>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => toggleExpand(item.nib)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1"
                              >
                                <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}

                            <button
                              onClick={() => toggleExpand(item.nib)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition hidden sm:block"
                              title="Tampilkan / Sembunyikan Detail"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drawer: Side-by-side Permits vs LKPM */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-slate-200">
                          <td colSpan={5} className="p-4 sm:p-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-inner">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                                <div>
                                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                                    <GitCompare className="w-4 h-4 text-rose-600" />
                                    <span>Rincian Komparasi Terpadu: {item.companyName} (NIB: {item.nib})</span>
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    Alamat: {item.address} | PIC: {item.picName} ({item.picEmail} / {item.picPhone})
                                  </p>
                                </div>
                                {item.comparisonStatus === 'DUAL_VIOLATION' && currentUserRole === 'koordinator' && (
                                  <button
                                    onClick={() => onOpenCombinedLetter(companyObj, item.allPermits, item.allLKPM)}
                                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow flex items-center space-x-1.5"
                                  >
                                    <FileWarning className="w-4 h-4" />
                                    <span>Buat Surat Teguran Terpadu (Izin &amp; LKPM)</span>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left Side: Dokumen Perizinan */}
                                <div className="border border-sky-200 rounded-xl p-3.5 bg-sky-50/20">
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-100">
                                    <span className="font-bold text-xs text-sky-900 flex items-center space-x-1.5">
                                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                                      <span>1. Daftar Perizinan &amp; Sertifikat Usaha ({item.allPermits.length})</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-rose-600">
                                      {item.expiredPermits.length} Kedaluwarsa • {item.criticalPermits.length} Kritis
                                    </span>
                                  </div>

                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {item.allPermits.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic">Belum ada dokumen perizinan terdaftar.</p>
                                    ) : (
                                      item.allPermits.map((p) => {
                                        const days = calculateDaysRemaining(p.expiryDate);
                                        return (
                                          <div key={p.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <div>
                                              <p className="font-bold text-slate-900">{p.permitName}</p>
                                              <p className="text-[11px] text-slate-500">No: {p.documentNumber} • {p.category}</p>
                                              <p className="text-[10px] text-slate-400">Kedaluwarsa: {formatIndonesianDate(p.expiryDate)}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                days < 0 
                                                  ? 'bg-rose-100 text-rose-800' 
                                                  : days <= 30 
                                                  ? 'bg-amber-100 text-amber-800' 
                                                  : 'bg-emerald-100 text-emerald-800'
                                              }`}>
                                                {days < 0 ? `Kedaluwarsa ${Math.abs(days)}h` : `${days} hari lagi`}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Laporan LKPM */}
                                <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/20">
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-100">
                                    <span className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5">
                                      <Building2 className="w-4 h-4 text-indigo-600" />
                                      <span>2. Daftar Kewajiban Pelaporan LKPM BKPM ({item.allLKPM.length})</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-rose-600">
                                      {item.unfiledLKPM.length} Belum Lapor
                                    </span>
                                  </div>

                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {item.allLKPM.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic">Belum ada data kewajiban LKPM terdaftar.</p>
                                    ) : (
                                      item.allLKPM.map((l) => (
                                        <div key={l.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                          <div>
                                            <p className="font-bold text-slate-900">LKPM {l.period} {l.year}</p>
                                            <p className="text-[11px] text-slate-500">KBLI {l.kbliCode} • {l.projectLocation}</p>
                                            <p className="text-[10px] text-slate-400">Batas Lapor: {formatIndonesianDate(l.deadlineDate)}</p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              l.status === 'Belum Lapor' 
                                                ? 'bg-rose-600 text-white' 
                                                : l.status === 'Perlu Perbaikan' 
                                                ? 'bg-amber-100 text-amber-800' 
                                                : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                              {l.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

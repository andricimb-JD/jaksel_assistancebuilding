import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Mail, 
  FileWarning, 
  Plus, 
  Download, 
  UploadCloud,
  ExternalLink,
  Trash2,
  Edit,
  DollarSign,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LKPMRecord, LKPMStatus, LKPMPeriod, LKPMSanction, Company, UserRole, FollowUpStatus } from '../types';
import { 
  formatCurrencyIDR, 
  formatIndonesianDate, 
  calculateDaysRemaining 
} from '../utils/helpers';

interface LKPMManagerProps {
  lkpmRecords: LKPMRecord[];
  companies: Company[];
  currentUserRole?: UserRole;
  onAddLKPM: (record: Omit<LKPMRecord, 'id'>) => void;
  onUpdateLKPM: (record: LKPMRecord) => void;
  onDeleteLKPM: (id: string) => void;
  onSendEmailPrompt: (lkpm: LKPMRecord) => void;
  onOpenLetterGenerator: (lkpm: LKPMRecord) => void;
  onNavigateBulkUpload: () => void;
  onUpdateFollowUp?: (lkpmId: string, status: FollowUpStatus) => void;
}

export const LKPMManager: React.FC<LKPMManagerProps> = ({
  lkpmRecords,
  companies,
  currentUserRole = 'koordinator',
  onAddLKPM,
  onUpdateLKPM,
  onDeleteLKPM,
  onSendEmailPrompt,
  onOpenLetterGenerator,
  onNavigateBulkUpload,
  onUpdateFollowUp
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [followUpFilter, setFollowUpFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyId: companies[0]?.id || '',
    kbliCode: '20111',
    kbliTitle: 'Industri Kimia Dasar Anorganik Khlor dan Alkali',
    projectLocation: 'Kawasan Industri Cilegon Kav. B-12, Banten',
    scale: 'Besar' as const,
    period: 'Triwulan III' as LKPMPeriod,
    year: 2026,
    deadlineDate: '2026-10-15',
    investmentRealization: 24500000000,
    status: 'Belum Lapor' as LKPMStatus,
    sanctionLevel: 'Peringatan Tertulis I' as LKPMSanction,
    picName: 'Andri Wicaksono',
    picEmail: 'andri.cimb@gmail.com',
    officerNotes: ''
  });

  // Filtered List
  // Filtered List
  const filteredRecords = lkpmRecords.filter((record) => {
    const matchesSearch = 
      record.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.nib.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.kbliCode.includes(searchQuery) ||
      record.kbliTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.projectLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.picEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || record.period === periodFilter;
    const matchesCompany = companyFilter === 'all' || record.companyId === companyFilter;
    const currentFollowUp = record.followUpStatus || 'Belum Ditindaklanjuti';
    const matchesFollowUp = followUpFilter === 'all' || currentFollowUp === followUpFilter;

    return matchesSearch && matchesStatus && matchesPeriod && matchesCompany && matchesFollowUp;
  });

  const pendingRecords = lkpmRecords.filter((r) => r.status === 'Belum Lapor');
  const overduePending = pendingRecords.filter((r) => calculateDaysRemaining(r.deadlineDate) < 0);
  const totalInvestmentRealization = lkpmRecords.reduce((acc, r) => acc + (r.investmentRealization || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find((c) => c.id === formData.companyId) || companies[0];

    onAddLKPM({
      companyId: comp.id,
      companyName: comp.name,
      nib: comp.nib,
      kbliCode: formData.kbliCode,
      kbliTitle: formData.kbliTitle,
      projectLocation: formData.projectLocation,
      scale: comp.scale,
      period: formData.period,
      year: Number(formData.year) || 2026,
      deadlineDate: formData.deadlineDate,
      investmentRealization: Number(formData.investmentRealization) || 0,
      status: formData.status,
      sanctionLevel: formData.sanctionLevel,
      picName: formData.picName,
      picEmail: formData.picEmail,
      followUpStatus: 'Belum Ditindaklanjuti',
      officerNotes: formData.officerNotes
    });

    setIsAddModalOpen(false);
  };

  const handleStatusQuickChange = (record: LKPMRecord, newStatus: LKPMStatus) => {
    onUpdateLKPM({
      ...record,
      status: newStatus,
      sanctionLevel: newStatus === 'Disetujui' || newStatus === 'Terkirim' ? 'Aman' : record.sanctionLevel,
      submissionDate: newStatus === 'Terkirim' || newStatus === 'Disetujui' ? new Date().toISOString().split('T')[0] : record.submissionDate
    });
  };

  // Export filtered to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'Nama Perusahaan', 'NIB', 'Kode KBLI', 'Judul KBLI', 'Lokasi Proyek', 
      'Skala Usaha', 'Periode', 'Tahun', 'Batas Waktu', 'Realisasi Investasi (IDR)', 
      'Status Pelaporan', 'Tingkat Sanksi', 'Status Tindak Lanjut', 'PIC', 'Email PIC', 'Catatan Petugas'
    ];
    const dataRows = filteredRecords.map((r) => [
      r.companyName,
      r.nib,
      r.kbliCode,
      r.kbliTitle,
      r.projectLocation,
      r.scale,
      r.period,
      r.year,
      r.deadlineDate,
      r.investmentRealization,
      r.status,
      r.sanctionLevel,
      r.followUpStatus || 'Belum Ditindaklanjuti',
      r.picName,
      r.picEmail,
      r.officerNotes || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = [
      { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 35 }, { wch: 30 },
      { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 14 }, { wch: 22 },
      { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 35 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kepatuhan LKPM');
    XLSX.writeFile(wb, `Data_Kepatuhan_LKPM_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <span>Monitoring Kepatuhan LKPM (OSS-BKPM)</span>
            </h2>
            {currentUserRole === 'petugas' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Mode Petugas: Upload Berkas LKPM
              </span>
            )}
            {currentUserRole === 'koordinator' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                Mode Koordinator: Eksekusi Surat &amp; Email
              </span>
            )}
            {currentUserRole === 'monitor' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mode Monitor: Evaluasi % Tindak Lanjut
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengawasan real-time kewajiban penyampaian Laporan Kegiatan Penanaman Modal untuk mencegah sanksi administratif dan pencabutan NIB.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUserRole !== 'monitor' && (
            <button
              onClick={onNavigateBulkUpload}
              className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center space-x-1.5 shadow-sm"
              title="Bulk upload laporan LKPM secara massal dengan file Excel atau CSV"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Bulk Upload Excel / CSV</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
            title="Unduh seluruh data LKPM dalam format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          {currentUserRole === 'koordinator' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah LKPM</span>
            </button>
          )}
        </div>
      </div>

      {/* Sanksi & Danger Alert Banner */}
      {overduePending.length > 0 && (
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 rounded-xl p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-rose-700">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-rose-100">
                DAFTAR MERAH: {overduePending.length} Proyek Menghadapi Sanksi Administratif BKPM!
              </h4>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Batas waktu penyampaian LKPM telah terlampaui. Sistem BKPM secara otomatis menerbitkan Surat Peringatan Tertulis (SP1 / SP2) yang dapat memicu pembekuan hak akses fasilitas impor/kepabeanan dan perizinan berusaha.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setStatusFilter('Belum Lapor');
              }}
              className="px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-lg text-xs font-bold transition shadow"
            >
              Tampilkan Hanya Belum Lapor
            </button>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari perusahaan, NIB, kode KBLI, lokasi proyek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Semua Periode Pelaporan</option>
              <option value="Triwulan I">Triwulan I (Jan - Mar)</option>
              <option value="Triwulan II">Triwulan II (Apr - Jun)</option>
              <option value="Triwulan III">Triwulan III (Jul - Sep)</option>
              <option value="Triwulan IV">Triwulan IV (Okt - Des)</option>
              <option value="Semester I">Semester I (Usaha Kecil)</option>
              <option value="Semester II">Semester II (Usaha Kecil)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Semua Entitas Usaha</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status and Follow-up Filter Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 pr-1">Status LKPM:</span>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'Belum Lapor', label: `Belum Lapor (${pendingRecords.length})`, isRed: true },
              { id: 'Perlu Perbaikan', label: 'Perlu Perbaikan' },
              { id: 'Draf', label: 'Draf' },
              { id: 'Terkirim', label: 'Terkirim' },
              { id: 'Disetujui', label: 'Disetujui' }
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === pill.id
                    ? pill.isRed ? 'bg-rose-600 text-white' : 'bg-indigo-900 text-white'
                    : pill.isRed ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 pr-1">Tindak Lanjut:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'Sudah Ditindaklanjuti', label: 'Sudah' },
              { id: 'Dalam Proses', label: 'Proses' },
              { id: 'Belum Ditindaklanjuti', label: 'Belum' }
            ].map((fu) => (
              <button
                key={fu.id}
                onClick={() => setFollowUpFilter(fu.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  followUpFilter === fu.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {fu.label}
              </button>
            ))}
            <span className="text-xs text-slate-400 pl-2">
              ({filteredRecords.length} data)
            </span>
          </div>
        </div>
      </div>

      {/* LKPM Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Perusahaan &amp; NIB</th>
                <th className="py-3 px-4">KBLI &amp; Lokasi Proyek</th>
                <th className="py-3 px-4">Periode &amp; Batas Waktu</th>
                <th className="py-3 px-4">Nilai Realisasi</th>
                <th className="py-3 px-4 text-center">Status Pelaporan</th>
                <th className="py-3 px-4 text-center">Sanksi BKPM</th>
                <th className="py-3 px-4 text-center">Tindak Lanjut</th>
                <th className="py-3 px-4">PIC Kepatuhan</th>
                {currentUserRole === 'koordinator' && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={currentUserRole === 'koordinator' ? 9 : 8} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">Tidak ditemukan data LKPM yang sesuai dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const daysToDeadline = calculateDaysRemaining(item.deadlineDate);
                  const isOverdue = daysToDeadline < 0 && item.status === 'Belum Lapor';

                  let statusBadgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (item.status === 'Disetujui') statusBadgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  else if (item.status === 'Terkirim') statusBadgeStyle = 'bg-sky-100 text-sky-800 border-sky-300';
                  else if (item.status === 'Perlu Perbaikan') statusBadgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
                  else if (item.status === 'Belum Lapor') statusBadgeStyle = 'bg-rose-100 text-rose-900 border-rose-300 font-bold';

                  let sanctionBadgeStyle = 'bg-slate-100 text-slate-600';
                  if (item.sanctionLevel === 'Peringatan Tertulis I') sanctionBadgeStyle = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
                  else if (item.sanctionLevel === 'Peringatan Tertulis II') sanctionBadgeStyle = 'bg-rose-100 text-rose-900 border border-rose-300 font-bold animate-pulse';
                  else if (item.sanctionLevel === 'Pembekuan Izin Sementara') sanctionBadgeStyle = 'bg-red-700 text-white font-extrabold';

                  const followUp = item.followUpStatus || 'Belum Ditindaklanjuti';
                  const followUpColor = 
                    followUp === 'Sudah Ditindaklanjuti' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : followUp === 'Dalam Proses'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/70 transition ${isOverdue ? 'bg-rose-50/20' : ''}`}
                    >
                      {/* Company & NIB */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.companyName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          NIB: {item.nib}
                        </div>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mt-1">
                          Skala: {item.scale}
                        </span>
                      </td>

                      {/* KBLI & Location */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          KBLI {item.kbliCode} - {item.kbliTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5 truncate" title={item.projectLocation}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.projectLocation}</span>
                        </div>
                      </td>

                      {/* Period & Deadline */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {item.period} {item.year}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Batas: {formatIndonesianDate(item.deadlineDate)}
                        </div>
                        {isOverdue && (
                          <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                            Lewat {Math.abs(daysToDeadline)} hari
                          </div>
                        )}
                      </td>

                      {/* Investment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatCurrencyIDR(item.investmentRealization)}
                        </div>
                        <div className="text-[10px] text-slate-400">Modal Tetap &amp; Kerja</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs border ${statusBadgeStyle}`}>
                          {item.status}
                        </span>

                        {/* Quick status dropdown (Koordinator only) */}
                        {currentUserRole === 'koordinator' && (
                          <div className="mt-1">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusQuickChange(item, e.target.value as LKPMStatus)}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 py-0.5 px-1 rounded border border-slate-300 cursor-pointer"
                            >
                              <option value="Belum Lapor">Ubah: Belum Lapor</option>
                              <option value="Draf">Ubah: Draf</option>
                              <option value="Perlu Perbaikan">Ubah: Perlu Perbaikan</option>
                              <option value="Terkirim">Ubah: Terkirim</option>
                              <option value="Disetujui">Ubah: Disetujui</option>
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Sanction */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${sanctionBadgeStyle}`}>
                          {item.sanctionLevel}
                        </span>
                        {item.officerNotes && (
                          <div className="text-[10px] text-slate-500 italic max-w-[140px] truncate mt-1" title={item.officerNotes}>
                            {item.officerNotes}
                          </div>
                        )}
                      </td>

                      {/* Follow-up Status Column */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${followUpColor}`}>
                          {followUp}
                        </span>
                        {currentUserRole !== 'monitor' && (
                          <div className="mt-1">
                            <select
                              value={followUp}
                              onChange={(e) => {
                                const newStatus = e.target.value as FollowUpStatus;
                                if (onUpdateFollowUp) {
                                  onUpdateFollowUp(item.id, newStatus);
                                } else {
                                  onUpdateLKPM({
                                    ...item,
                                    followUpStatus: newStatus,
                                    followUpDate: newStatus === 'Sudah Ditindaklanjuti' ? new Date().toISOString().split('T')[0] : item.followUpDate
                                  });
                                }
                              }}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 py-0.5 px-1.5 rounded border border-slate-300 cursor-pointer"
                            >
                              <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                              <option value="Dalam Proses">Dalam Proses</option>
                              <option value="Sudah Ditindaklanjuti">Sudah Ditindaklanjuti</option>
                            </select>
                          </div>
                        )}
                      </td>

                      {/* PIC */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {item.picName}
                        </div>
                        <div className="text-[11px] text-indigo-700 font-mono">
                          {item.picEmail}
                        </div>
                      </td>

                      {/* Actions according to Role (Koordinator only) */}
                      {currentUserRole === 'koordinator' && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onSendEmailPrompt(item)}
                              title="Kirim Peringatan Email LKPM"
                              className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenLetterGenerator(item)}
                              title="Terbitkan Surat Teguran Resmi LKPM"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                            >
                              <FileWarning className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteLKPM(item.id)}
                              title="Hapus"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add LKPM Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Tambah Rekam Kewajiban LKPM</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Daftarkan proyek investasi untuk memonitor periode pelaporan ke BKPM / OSS-RBA.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perusahaan / Badan Usaha</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (NIB: {c.nib})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode KBLI (5 Digit) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 20111"
                    value={formData.kbliCode}
                    onChange={(e) => setFormData({ ...formData, kbliCode: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Sektor KBLI *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Industri Kimia Dasar..."
                    value={formData.kbliTitle}
                    onChange={(e) => setFormData({ ...formData, kbliTitle: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Proyek Investasi</label>
                <input
                  type="text"
                  placeholder="Kawasan Industri, Kabupaten/Kota, Provinsi"
                  value={formData.projectLocation}
                  onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Laporan</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as LKPMPeriod })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Triwulan I">Triwulan I</option>
                    <option value="Triwulan II">Triwulan II</option>
                    <option value="Triwulan III">Triwulan III</option>
                    <option value="Triwulan IV">Triwulan IV</option>
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Akhir Pelaporan</label>
                  <input
                    type="date"
                    required
                    value={formData.deadlineDate}
                    onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Realisasi Investasi (IDR)</label>
                  <input
                    type="number"
                    value={formData.investmentRealization}
                    onChange={(e) => setFormData({ ...formData, investmentRealization: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pelaporan Saat Ini</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LKPMStatus })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Belum Lapor">Belum Lapor (Warning)</option>
                    <option value="Draf">Draf</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Terkirim">Terkirim</option>
                    <option value="Disetujui">Disetujui</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama PIC</label>
                  <input
                    type="text"
                    value={formData.picName}
                    onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email PIC Notifikasi</label>
                  <input
                    type="email"
                    required
                    value={formData.picEmail}
                    onChange={(e) => setFormData({ ...formData, picEmail: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Khusus / Status Sanksi</label>
                <input
                  type="text"
                  placeholder="Catatan dari verifikator BKPM atau internal..."
                  value={formData.officerNotes}
                  onChange={(e) => setFormData({ ...formData, officerNotes: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
                >
                  Simpan LKPM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

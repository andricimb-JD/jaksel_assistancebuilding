import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  FileWarning, 
  Download, 
  Trash2, 
  Edit3, 
  Calendar, 
  AlertTriangle,
  Building,
  CheckCircle,
  ExternalLink,
  DollarSign,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { Permit, PermitCategory, PermitStatus, Company, UserRole, FollowUpStatus } from '../types';
import { 
  calculateDaysRemaining, 
  getPermitStatusBadge, 
  formatIndonesianDate 
} from '../utils/helpers';
import * as XLSX from 'xlsx';
import { BulkUploadPermitsModal } from './BulkUploadPermitsModal';

interface PermitsManagerProps {
  permits: Permit[];
  companies: Company[];
  currentUserRole?: UserRole;
  onAddPermit?: (newPermit: Omit<Permit, 'id'>) => void;
  onBulkImportPermits: (importedPermits: Permit[]) => void;
  onUpdatePermit: (updated: Permit) => void;
  onDeletePermit: (id: string) => void;
  onSendEmailPrompt: (permit: Permit) => void;
  onOpenLetterGenerator: (permit: Permit) => void;
  onUpdateFollowUp?: (permitId: string, status: FollowUpStatus) => void;
}

export const PermitsManager: React.FC<PermitsManagerProps> = ({
  permits,
  companies,
  currentUserRole = 'koordinator',
  onAddPermit,
  onBulkImportPermits,
  onUpdatePermit,
  onDeletePermit,
  onSendEmailPrompt,
  onOpenLetterGenerator,
  onUpdateFollowUp
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  
  const [selectedFollowUpFilter, setSelectedFollowUpFilter] = useState<string>('all');
  
  // Upload & Edit Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);

  // Form Fields (without Estimasi Biaya)
  const [formData, setFormData] = useState({
    companyId: companies[0]?.id || '',
    permitName: '',
    category: 'Legalitas Dasar' as PermitCategory,
    documentNumber: '',
    issuingAuthority: 'Kementerian Investasi / BKPM (OSS-RBA)',
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    picName: 'Andri Wicaksono',
    picEmail: 'andri.cimb@gmail.com',
    followUpStatus: 'Belum Ditindaklanjuti' as FollowUpStatus,
    notes: ''
  });

  const categories: PermitCategory[] = [
    'Legalitas Dasar',
    'Lingkungan Hidup',
    'Bangunan & Konstruksi',
    'Kesehatan & Pangan',
    'K3 & Ketenagakerjaan',
    'Operasional & Teknis',
    'Mutu & Standar Industri'
  ];

  // Filtered Permits
  const filteredPermits = permits.filter((permit) => {
    const days = calculateDaysRemaining(permit.expiryDate);
    const matchesSearch = 
      permit.permitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.picEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || permit.category === selectedCategory;
    const matchesCompany = selectedCompany === 'all' || permit.companyId === selectedCompany;

    let matchesStatus = true;
    if (selectedStatusFilter === 'expired') matchesStatus = days < 0;
    else if (selectedStatusFilter === 'warning_7') matchesStatus = days >= 0 && days <= 7;
    else if (selectedStatusFilter === 'warning_30') matchesStatus = days >= 0 && days <= 30;
    else if (selectedStatusFilter === 'warning_90') matchesStatus = days > 30 && days <= 90;
    else if (selectedStatusFilter === 'active') matchesStatus = days > 90;

    const currentFollowUp = permit.followUpStatus || 'Belum Ditindaklanjuti';
    const matchesFollowUp = selectedFollowUpFilter === 'all' || currentFollowUp === selectedFollowUpFilter;

    return matchesSearch && matchesCategory && matchesCompany && matchesStatus && matchesFollowUp;
  });

  const handleOpenAddModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleOpenEditModal = (p: Permit) => {
    setEditingPermit(p);
    setFormData({
      companyId: p.companyId,
      permitName: p.permitName,
      category: p.category,
      documentNumber: p.documentNumber,
      issuingAuthority: p.issuingAuthority,
      issuedDate: p.issuedDate,
      expiryDate: p.expiryDate,
      picName: p.picName,
      picEmail: p.picEmail,
      followUpStatus: p.followUpStatus || 'Belum Ditindaklanjuti',
      notes: p.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEditForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.permitName || !formData.expiryDate || !editingPermit) {
      alert('Nama perizinan dan tanggal kedaluwarsa wajib diisi!');
      return;
    }

    const matchedComp = companies.find((c) => c.id === formData.companyId) || companies[0];

    onUpdatePermit({
      ...editingPermit,
      companyId: matchedComp.id,
      companyName: matchedComp.name,
      permitName: formData.permitName,
      category: formData.category,
      documentNumber: formData.documentNumber || `REG-${Date.now().toString().slice(-6)}`,
      issuingAuthority: formData.issuingAuthority,
      issuedDate: formData.issuedDate,
      expiryDate: formData.expiryDate,
      picName: formData.picName,
      picEmail: formData.picEmail,
      followUpStatus: formData.followUpStatus,
      notes: formData.notes
    });

    setIsEditModalOpen(false);
    setEditingPermit(null);
  };

  // Export to Excel (.xlsx) - Tanpa Estimasi Biaya
  const handleExportExcel = () => {
    const headers = [
      'Nama Perizinan',
      'Perusahaan',
      'Kategori',
      'Nomor Dokumen',
      'Instansi Penerbit',
      'Tanggal Terbit',
      'Tanggal Kedaluwarsa',
      'Sisa Hari',
      'Status Masa Berlaku',
      'Status Tindak Lanjut',
      'PIC',
      'Email PIC',
      'Catatan Teknis'
    ];
    const dataRows = filteredPermits.map((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      return [
        p.permitName,
        p.companyName,
        p.category,
        p.documentNumber,
        p.issuingAuthority,
        p.issuedDate,
        p.expiryDate,
        days,
        days < 0 ? 'Kedaluwarsa' : days <= 7 ? 'Kritis (≤7 Hari)' : days <= 30 ? 'Mendesak (≤30 Hari)' : days <= 90 ? 'Waspada (≤90 Hari)' : 'Aman',
        p.followUpStatus || 'Belum Ditindaklanjuti',
        p.picName,
        p.picEmail,
        p.notes || ''
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = [
      { wch: 35 }, { wch: 28 }, { wch: 20 }, { wch: 25 },
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 35 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Perizinan & Sertifikat');
    XLSX.writeFile(wb, `Data_Perizinan_Sertifikat_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-sky-600" />
              <span>Masa Berlaku Perizinan &amp; Sertifikat Usaha</span>
            </h2>
            {currentUserRole === 'petugas' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Mode Petugas: Upload Dokumen
              </span>
            )}
            {currentUserRole === 'koordinator' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                Mode Koordinator: Kelola Surat &amp; Email
              </span>
            )}
            {currentUserRole === 'monitor' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mode Monitor: Pemantauan Saja
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking masa berlaku NIB, Izin Lingkungan, PBG/SLF, Sertifikat Halal, BPOM, K3, dan ISO dengan status tindak lanjut real-time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
            title="Unduh seluruh data perizinan dalam format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          {currentUserRole !== 'monitor' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5"
              title="Tambah data perizinan usaha melalui upload file Excel atau CSV"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Excel / CSV Perizinan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama izin, dokumen, PIC, perusahaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">Semua Kategori Regulasi</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">Semua Entitas Perusahaan</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters & Follow-Up Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 pr-1">Masa Berlaku:</span>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'expired', label: 'Kedaluwarsa' },
              { id: 'warning_7', label: 'Kritis (≤7 Hari)' },
              { id: 'warning_30', label: 'Mendesak (≤30 Hari)' },
              { id: 'warning_90', label: 'Waspada (≤90 Hari)' },
              { id: 'active', label: 'Aman (>90 Hari)' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedStatusFilter(item.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedStatusFilter === item.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {item.label}
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
                onClick={() => setSelectedFollowUpFilter(fu.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedFollowUpFilter === fu.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {fu.label}
              </button>
            ))}
            <span className="text-xs text-slate-400 pl-2">
              ({filteredPermits.length} data)
            </span>
          </div>
        </div>
      </div>

      {/* Permits Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Perizinan &amp; Instansi</th>
                <th className="py-3 px-4">Entitas Perusahaan</th>
                <th className="py-3 px-4">Kategori &amp; Dokumen</th>
                <th className="py-3 px-4">Tanggal Masa Berlaku</th>
                <th className="py-3 px-4 text-center">Status Masa Berlaku</th>
                <th className="py-3 px-4 text-center">Tindak Lanjut</th>
                <th className="py-3 px-4">PIC / Notifikasi Email</th>
                {currentUserRole !== 'monitor' && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={currentUserRole !== 'monitor' ? 8 : 7} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">Tidak ada dokumen perizinan yang cocok dengan kriteria filter.</p>
                  </td>
                </tr>
              ) : (
                filteredPermits.map((permit) => {
                  const days = calculateDaysRemaining(permit.expiryDate);
                  const statusBadge = getPermitStatusBadge(
                    days < 0 ? 'expired' : days <= 7 ? 'warning_7' : days <= 30 ? 'warning_30' : days <= 90 ? 'warning_90' : 'active',
                    days
                  );

                  const followUp = permit.followUpStatus || 'Belum Ditindaklanjuti';
                  const followUpColor = 
                    followUp === 'Sudah Ditindaklanjuti' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : followUp === 'Dalam Proses'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300';

                  return (
                    <tr key={permit.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Authority */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 text-[13px] leading-snug">
                          {permit.permitName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {permit.issuingAuthority}
                        </div>
                        {permit.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                            "{permit.notes}"
                          </div>
                        )}
                      </td>

                      {/* Company */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {permit.companyName}
                        </div>
                      </td>

                      {/* Category & Doc No */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] mb-1">
                          {permit.category}
                        </span>
                        <div className="text-[11px] font-mono text-slate-500">
                          {permit.documentNumber}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-600">
                          Mulai: {formatIndonesianDate(permit.issuedDate)}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          S/d: {formatIndonesianDate(permit.expiryDate)}
                        </div>
                      </td>

                      {/* Status & Countdown (Tanpa Estimasi Biaya) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusBadge.color}`}>
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
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
                                  onUpdateFollowUp(permit.id, newStatus);
                                } else {
                                  onUpdatePermit({
                                    ...permit,
                                    followUpStatus: newStatus,
                                    followUpDate: newStatus === 'Sudah Ditindaklanjuti' ? new Date().toISOString().split('T')[0] : permit.followUpDate
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
                          {permit.picName}
                        </div>
                        <div className="text-[11px] text-sky-700 font-mono">
                          {permit.picEmail}
                        </div>
                        {permit.lastEmailSentDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Notif Terakhir: {formatIndonesianDate(permit.lastEmailSentDate)}
                          </div>
                        )}
                      </td>

                      {/* Actions according to Role */}
                      {currentUserRole !== 'monitor' && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {currentUserRole === 'koordinator' && (
                              <>
                                <button
                                  onClick={() => onSendEmailPrompt(permit)}
                                  title="Kirim Notifikasi Email Pengingat"
                                  className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenLetterGenerator(permit)}
                                  title="Generate Surat Teguran Resmi"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                                >
                                  <FileWarning className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(permit)}
                              title="Edit Perizinan"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {currentUserRole === 'koordinator' && (
                              <button
                                onClick={() => onDeletePermit(permit.id)}
                                title="Hapus Dokumen"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* Edit Permit Modal */}
      {isEditModalOpen && editingPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span>Edit Dokumen Perizinan</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui masa berlaku atau informasi PIC perizinan yang telah terdaftar.
            </p>

            <form onSubmit={handleSubmitEditForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Perusahaan / Entitas</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Perizinan</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PermitCategory })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perizinan / Sertifikat *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Izin Lingkungan (AMDAL), Sertifikat Halal BPJPH, SLF Pabrik..."
                  value={formData.permitName}
                  onChange={(e) => setFormData({ ...formData, permitName: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Registrasi / SK Dokumen</label>
                  <input
                    type="text"
                    placeholder="Contoh: SK.520/MENLHK/2021"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instansi / Kementerian Penerbit</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kementerian LHK, BPJPH, DPMPTSP..."
                    value={formData.issuingAuthority}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Diterbitkan</label>
                  <input
                    type="date"
                    value={formData.issuedDate}
                    onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">Tanggal Kedaluwarsa (Masa Berlaku) *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-rose-300 bg-rose-50/30 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama PIC Penanggung Jawab</label>
                  <input
                    type="text"
                    value={formData.picName}
                    onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email PIC (Tujuan Notifikasi Otomatis)</label>
                  <input
                    type="email"
                    required
                    value={formData.picEmail}
                    onChange={(e) => setFormData({ ...formData, picEmail: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Tindak Lanjut</label>
                  <select
                    value={formData.followUpStatus}
                    onChange={(e) => setFormData({ ...formData, followUpStatus: e.target.value as FollowUpStatus })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Sudah Ditindaklanjuti">Sudah Ditindaklanjuti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Tindak Lanjut Teknis</label>
                  <input
                    type="text"
                    placeholder="Contoh: Menunggu audit lapangan LPH..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Permits Modal (Excel / CSV Only) */}
      <BulkUploadPermitsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        companies={companies}
        onImportSuccess={onBulkImportPermits}
      />
    </div>
  );
};

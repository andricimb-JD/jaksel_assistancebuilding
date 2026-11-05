import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Building2, 
  FileWarning, 
  Mail, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  UploadCloud,
  Search,
  CheckCircle,
  Activity,
  XCircle,
  FileText,
  UserCheck,
  GitCompare,
  Headphones,
  Calendar,
  Phone,
  ClipboardCheck,
  X,
  Check,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Permit, LKPMRecord, WarningLetter, UserAccount, Company, ConsultationApplication, ConsultationStatus } from '../types';
import { 
  calculateDaysRemaining, 
  getPermitStatusBadge, 
  formatCurrencyIDR, 
  formatIndonesianDate, 
  calculateComplianceScore,
  calculateFollowUpMetrics,
  buildNIBComparisonList
} from '../utils/helpers';

interface DashboardViewProps {
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  warningLetters: WarningLetter[];
  companies?: Company[];
  currentUser?: UserAccount;
  consultations?: ConsultationApplication[];
  onUpdateConsultationStatus?: (id: string, status: ConsultationStatus, officerNotes?: string) => void;
  onRescheduleConsultation?: (id: string, newDate: string, newMethod?: string, rescheduleReason?: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenLetterWithItem: (item: { type: 'PERMIT' | 'LKPM'; record: any }) => void;
  onSendDirectEmail: (type: 'PERMIT' | 'LKPM', record: any) => void;
  onAddNewPermit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  permits,
  lkpmRecords,
  warningLetters,
  companies = [],
  currentUser,
  consultations = [],
  onUpdateConsultationStatus,
  onRescheduleConsultation,
  onNavigateTab,
  onOpenLetterWithItem,
  onSendDirectEmail,
  onAddNewPermit
}) => {
  // NIB Comparison Data
  const nibComparisonList = buildNIBComparisonList(companies, permits, lkpmRecords);
  const dualViolationsCount = nibComparisonList.filter((n) => n.comparisonStatus === 'DUAL_VIOLATION').length;

  // Permohonan Pendampingan Pelaku Usaha State & Filtering
  const [selectedConsultationForVerify, setSelectedConsultationForVerify] = useState<ConsultationApplication | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<ConsultationStatus>('Diverifikasi & Dijadwalkan');
  const [verifyNotesInput, setVerifyNotesInput] = useState<string>('');
  const [consultationStatusFilter, setConsultationStatusFilter] = useState<string>('all');
  const [consultationSearchQuery, setConsultationSearchQuery] = useState<string>('');

  // Reschedule Consultation State (Kewenangan Koordinator)
  const [selectedConsultationForReschedule, setSelectedConsultationForReschedule] = useState<ConsultationApplication | null>(null);
  const [rescheduleDateInput, setRescheduleDateInput] = useState<string>('');
  const [rescheduleMethodInput, setRescheduleMethodInput] = useState<string>('');
  const [rescheduleReasonInput, setRescheduleReasonInput] = useState<string>('');

  const isKoordinator = currentUser?.role === 'koordinator' || currentUser?.role === 'superadmin';

  const allConsultations = consultations || [];
  const pendingConsultationsCount = allConsultations.filter(c => c.status === 'Menunggu Verifikasi').length;
  const verifiedConsultationsCount = allConsultations.filter(c => c.status === 'Diverifikasi & Dijadwalkan').length;
  const inProgressConsultationsCount = allConsultations.filter(c => c.status === 'Sedang Didampingi').length;
  const completedConsultationsCount = allConsultations.filter(c => c.status === 'Selesai').length;

  const filteredConsultations = allConsultations.filter((c) => {
    const matchesStatus = consultationStatusFilter === 'all' || c.status === consultationStatusFilter;
    const matchesSearch = 
      c.buildingName.toLowerCase().includes(consultationSearchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(consultationSearchQuery.toLowerCase()) ||
      c.refNumber.toLowerCase().includes(consultationSearchQuery.toLowerCase()) ||
      c.picName.toLowerCase().includes(consultationSearchQuery.toLowerCase()) ||
      c.nib.includes(consultationSearchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleOpenVerifyModal = (app: ConsultationApplication) => {
    setSelectedConsultationForVerify(app);
    setVerifyStatusChoice(app.status === 'Menunggu Verifikasi' ? 'Diverifikasi & Dijadwalkan' : app.status);
    setVerifyNotesInput(
      app.officerNotes || 
      `Dokumen kelaikan teknis & izin eksisting gedung ${app.buildingName} telah diperiksa. Permohonan disetujui untuk asistensi teknis PTSP Jakarta Selatan.`
    );
  };

  const handleSaveVerification = () => {
    if (!selectedConsultationForVerify || !onUpdateConsultationStatus) return;
    onUpdateConsultationStatus(selectedConsultationForVerify.id, verifyStatusChoice, verifyNotesInput);
    setSelectedConsultationForVerify(null);
  };

  const handleOpenRescheduleModal = (app: ConsultationApplication) => {
    setSelectedConsultationForReschedule(app);
    setRescheduleDateInput(app.consultationDate);
    setRescheduleMethodInput(app.method);
    setRescheduleReasonInput(
      app.rescheduleReason || 'Penyesuaian jadwal koordinasi teknis PTSP Kota Administrasi Jakarta Selatan'
    );
  };

  const handleSaveReschedule = () => {
    if (!selectedConsultationForReschedule || !onRescheduleConsultation) return;
    onRescheduleConsultation(
      selectedConsultationForReschedule.id,
      rescheduleDateInput,
      rescheduleMethodInput,
      rescheduleReasonInput
    );
    setSelectedConsultationForReschedule(null);
  };

  // State for User Monitor filtering
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<string>('all');
  const [monitorCategoryFilter, setMonitorCategoryFilter] = useState<'all' | 'PERMIT' | 'LKPM'>('all');
  const [monitorSearchQuery, setMonitorSearchQuery] = useState<string>('');

  // Calculations
  const expiredPermits = permits.filter((p) => calculateDaysRemaining(p.expiryDate) < 0);
  const criticalPermits = permits.filter((p) => {
    const days = calculateDaysRemaining(p.expiryDate);
    return days >= 0 && days <= 30;
  });
  const warningPermits = permits.filter((p) => {
    const days = calculateDaysRemaining(p.expiryDate);
    return days > 30 && days <= 90;
  });
  const safePermits = permits.filter((p) => calculateDaysRemaining(p.expiryDate) > 90);

  const pendingLKPM = lkpmRecords.filter((l) => l.status === 'Belum Lapor');
  const revisionLKPM = lkpmRecords.filter((l) => l.status === 'Perlu Perbaikan');
  const approvedLKPM = lkpmRecords.filter((l) => l.status === 'Disetujui');
  const draftLKPM = lkpmRecords.filter((l) => l.status === 'Draf');

  const totalInvestment = lkpmRecords.reduce((acc, curr) => acc + (curr.investmentRealization || 0), 0);
  const complianceScore = calculateComplianceScore(permits, lkpmRecords);
  const overdueLKPM = pendingLKPM.filter((l) => calculateDaysRemaining(l.deadlineDate) < 0);

  // Real-time Follow-up calculation with full percentage breakdown (Sudah, Proses, Belum)
  const followUpMetrics = calculateFollowUpMetrics(permits, lkpmRecords);

  // Expiring soon sorted for Admin view
  const sortedUpcomingPermits = [...permits].sort(
    (a, b) => calculateDaysRemaining(a.expiryDate) - calculateDaysRemaining(b.expiryDate)
  ).slice(0, 5);

  // Combined urgent items list for User Monitor Inspection
  const urgentPermitsList = permits
    .filter((p) => calculateDaysRemaining(p.expiryDate) <= 90)
    .map((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      return {
        id: p.id,
        type: 'PERMIT' as const,
        categoryLabel: 'Perizinan Usaha',
        companyName: p.companyName,
        title: p.permitName,
        referenceNo: p.documentNumber,
        category: p.category,
        dueDate: p.expiryDate,
        daysRemaining: days,
        followUpStatus: p.followUpStatus || 'Belum Ditindaklanjuti',
        followUpDate: p.followUpDate,
        picName: p.picName,
        picEmail: p.picEmail,
        riskLabel: days < 0 ? 'Kedaluwarsa' : days <= 30 ? 'Kritis (<30h)' : 'Perhatian (<90h)',
        riskColor: days < 0 ? 'bg-rose-100 text-rose-800 border-rose-300' : days <= 30 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-sky-100 text-sky-800 border-sky-300'
      };
    });

  const urgentLKPMList = lkpmRecords
    .filter((l) => l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan')
    .map((l) => {
      const days = calculateDaysRemaining(l.deadlineDate);
      return {
        id: l.id,
        type: 'LKPM' as const,
        categoryLabel: 'Pelaporan LKPM',
        companyName: l.companyName,
        title: `LKPM ${l.period} ${l.year}`,
        referenceNo: `KBLI ${l.kbliCode} • Proyek: ${l.projectLocation}`,
        category: `KBLI ${l.kbliCode}`,
        dueDate: l.deadlineDate,
        daysRemaining: days,
        followUpStatus: l.followUpStatus || 'Belum Ditindaklanjuti',
        followUpDate: l.followUpDate,
        picName: l.picName,
        picEmail: l.picEmail,
        riskLabel: l.status === 'Belum Lapor' ? (days < 0 ? 'Lewat Batas (SP II)' : 'Belum Lapor (SP I)') : 'Perlu Perbaikan',
        riskColor: l.status === 'Belum Lapor' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
      };
    });

  const combinedActionItems = [...urgentPermitsList, ...urgentLKPMList];

  const filteredMonitorItems = combinedActionItems.filter((item) => {
    const matchesStatus = monitorStatusFilter === 'all' || item.followUpStatus === monitorStatusFilter;
    const matchesCategory = monitorCategoryFilter === 'all' || item.type === monitorCategoryFilter;
    const matchesSearch = 
      item.companyName.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
      item.referenceNo.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
      item.picName.toLowerCase().includes(monitorSearchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Section: Data Permohonan Pendampingan Pelaku Usaha (Untuk Dilakukan Verifikasi)
  const renderConsultationSection = (accentColor: 'sky' | 'emerald' = 'sky') => (
    <div className={`bg-white rounded-2xl p-6 border-2 ${accentColor === 'emerald' ? 'border-emerald-500/40' : 'border-sky-500/40'} shadow-xl space-y-6`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#0c406d] to-sky-600 text-white shadow-md">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Data Permohonan Pendampingan Pelaku Usaha
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-[#0c406d] border border-sky-200">
                Verifikasi PTSP
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Daftar permohonan asistensi teknis kelaikan gedung (SLF, PBG, Damkar, K3, Lingkungan) yang diajukan oleh Pelaku Usaha untuk diverifikasi kelengkapan dokumennya dan dijadwalkan oleh User Monitoring PTSP.
            </p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
            Total Masuk: <strong className="text-slate-900">{allConsultations.length}</strong>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${
            pendingConsultationsCount > 0 
              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {pendingConsultationsCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            <span>Menunggu Verifikasi: <strong>{pendingConsultationsCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            Diverifikasi: <strong>{verifiedConsultationsCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
            Sedang Asistensi: <strong>{inProgressConsultationsCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
            Selesai: <strong>{completedConsultationsCount}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama gedung, PT pemohon, NIB, kontak PIC, atau nomor registrasi..."
            value={consultationSearchQuery}
            onChange={(e) => setConsultationSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 pr-1">Filter:</span>
          {[
            { id: 'all', label: `Semua (${allConsultations.length})` },
            { id: 'Menunggu Verifikasi', label: `Menunggu (${pendingConsultationsCount})` },
            { id: 'Diverifikasi & Dijadwalkan', label: `Diverifikasi (${verifiedConsultationsCount})` },
            { id: 'Sedang Didampingi', label: `Didampingi (${inProgressConsultationsCount})` },
            { id: 'Selesai', label: `Selesai (${completedConsultationsCount})` }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setConsultationStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                consultationStatusFilter === pill.id
                  ? 'bg-[#0c406d] text-white border-[#0c406d] shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Banner Khusus Koordinator */}
      {isKoordinator && (
        <div className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 border border-sky-200 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-sky-600 text-white shadow-xs shrink-0">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <span className="font-extrabold text-sky-950 block">Kewenangan Akses Koordinator: Pengaturan Jadwal Asistensi</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Sebagai User Koordinator, Anda berwenang <strong>merubah dan mengatur ulang jadwal pendampingan</strong> bagi seluruh pelaku usaha pemohon.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-200 text-sky-900 px-2.5 py-1 rounded-full border border-sky-300 shrink-0 self-start sm:self-auto">
            Akses Ubah Jadwal Aktif
          </span>
        </div>
      )}

      {/* Table / List of Consultation Applications */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-700 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">No. Registrasi &amp; Tanggal</th>
              <th className="py-3 px-4">Gedung &amp; Pelaku Usaha</th>
              <th className="py-3 px-4">Jadwal &amp; Metode Asistensi</th>
              <th className="py-3 px-4">Kontak PIC Pemohon</th>
              <th className="py-3 px-4">Izin &amp; Dokumen Eksisting</th>
              <th className="py-3 px-4">Status Verifikasi</th>
              <th className="py-3 px-4 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredConsultations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Headphones className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-slate-600">Belum Ada Permohonan Pendampingan</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permohonan yang diajukan oleh Pelaku Usaha melalui portal Jaksel Building Assistance akan otomatis masuk ke sini untuk diverifikasi.
                  </p>
                </td>
              </tr>
            ) : (
              filteredConsultations.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-extrabold text-[#0c406d] block">{app.refNumber}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{app.submittedAt}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-bold text-slate-900 block truncate">{app.buildingName}</span>
                    <span className="text-[11px] text-slate-600 block truncate">{app.companyName}</span>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>NIB: {app.nib}</span>
                      <span>•</span>
                      <span className="text-sky-700 font-sans font-semibold">{app.buildingType}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-[210px]">
                    <span className="font-bold text-slate-800 block flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>{app.consultationDate}</span>
                    </span>
                    <span className="text-[11px] text-slate-600 block truncate mt-0.5">{app.method}</span>
                    {app.previousDate && (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Jadwal Diubah (Semula: {app.previousDate})
                        </span>
                        {app.rescheduledBy && (
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            Oleh: {app.rescheduledBy}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 italic truncate mt-0.5 max-w-[190px]">
                      "{app.notes}"
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{app.picName}</span>
                    <span className="text-[11px] text-slate-600 block font-mono">{app.picPhone}</span>
                    {app.picEmail && <span className="text-[10px] text-slate-400 block truncate">{app.picEmail}</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {app.ownedPermits.map((p) => (
                        <span key={p} className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {p}
                        </span>
                      ))}
                      {Object.keys(app.uploadedFiles || {}).length > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {Object.keys(app.uploadedFiles).length} berkas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                      app.status === 'Menunggu Verifikasi'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : app.status === 'Diverifikasi & Dijadwalkan'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : app.status === 'Sedang Didampingi'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : app.status === 'Selesai'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {app.status === 'Menunggu Verifikasi' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                      {app.status === 'Diverifikasi & Dijadwalkan' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      {app.status === 'Sedang Didampingi' && <Clock className="w-3 h-3 text-sky-600" />}
                      {app.status === 'Selesai' && <CheckCircle2 className="w-3 h-3 text-slate-600" />}
                      <span>{app.status}</span>
                    </span>
                    {app.verifiedBy && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Verifikator: <strong>{app.verifiedBy}</strong>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1.5 min-w-[125px]">
                      {isKoordinator && (
                        <button
                          type="button"
                          onClick={() => handleOpenRescheduleModal(app)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                          title="Ubah Jadwal Pendampingan (Kewenangan Koordinator)"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Ubah Jadwal</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal(app)}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 ${
                          app.status === 'Menunggu Verifikasi' && !isKoordinator
                            ? 'bg-[#0c406d] hover:bg-[#083053] text-white ring-2 ring-[#0c406d]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>{app.status === 'Menunggu Verifikasi' ? 'Verifikasi' : 'Detail / Status'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>Menampilkan {filteredConsultations.length} dari {allConsultations.length} data permohonan pendampingan</span>
        <span className="text-[#0c406d] font-semibold">Unit Pelaksana PTSP Kota Administrasi Jakarta Selatan</span>
      </div>
    </div>
  );

  // Modal Khusus Koordinator: Ubah Jadwal Pendampingan
  const renderRescheduleModal = () => {
    if (!selectedConsultationForReschedule) return null;
    const app = selectedConsultationForReschedule;

    const quickReasons = [
      'Penyesuaian agenda tim teknis penilai SLF/PBG PTSP',
      'Permintaan konfirmasi perubahan jadwal dari penanggung jawab gedung',
      'Penjadwalan sidang pleno asistensi kelaikan fungsi gedung',
      'Asistensi lapangan bersama Dinas Gulkarmat / Disnakertrans'
    ];

    const generateWhatsAppLink = () => {
      const cleanPhone = app.picPhone.replace(/[^0-9]/g, '');
      const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
      const message = `Halo Bpk/Ibu ${app.picName} (${app.buildingName}), kami dari Tim Koordinator PTSP Kota Jakarta Selatan menginformasikan bahwa jadwal asistensi/pendampingan permohonan No. Reg ${app.refNumber} dijadwalkan ulang menjadi tanggal *${rescheduleDateInput}* melalui metode *${rescheduleMethodInput}*. Catatan: ${rescheduleReasonInput}. Terima kasih.`;
      return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 text-white shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Ubah Jadwal Pendampingan (Koordinator)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  No. Registrasi: <strong className="text-[#0c406d]">{app.refNumber}</strong> • {app.buildingName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedConsultationForReschedule(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Info Pelaku Usaha & Jadwal Saat Ini */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gedung &amp; Perusahaan:</span>
                <strong className="text-slate-900">{app.buildingName} ({app.companyName})</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kontak PIC Pemohon:</span>
                <span className="font-semibold text-slate-800">{app.picName} ({app.picPhone})</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-amber-800">
                <span>Jadwal Terdaftar Saat Ini:</span>
                <strong className="font-mono">{app.consultationDate} ({app.method})</strong>
              </div>
            </div>

            {/* Form Ubah Jadwal */}
            <div className="space-y-3 bg-sky-50/50 p-4 border border-sky-200 rounded-2xl">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pilih Tanggal Jadwal Baru <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDateInput}
                  onChange={(e) => setRescheduleDateInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Metode Pendampingan <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={rescheduleMethodInput}
                  onChange={(e) => setRescheduleMethodInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Tatap Muka di PTSP Jaksel (Kantor Walikota)">Tatap Muka di PTSP Jaksel (Kantor Walikota)</option>
                  <option value="Konsultasi Daring (Online Zoom Meeting)">Konsultasi Daring (Online Zoom Meeting)</option>
                  <option value="Permohonan Asistensi Kunjungan Lapangan">Permohonan Asistensi Kunjungan Lapangan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Alasan / Catatan Penjadwalan Ulang dari Koordinator:
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReasonInput}
                  onChange={(e) => setRescheduleReasonInput(e.target.value)}
                  placeholder="Contoh: Penyesuaian jadwal tim pengkaji teknis kelaikan gedung..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                />

                {/* Quick Reason Suggestions */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {quickReasons.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setRescheduleReasonInput(qr)}
                      className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition text-left"
                    >
                      + {qr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pemberitahuan Koordinator & Tombol WA */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start justify-between gap-2">
              <div>
                <strong>Otoritas Penjadwalan:</strong>
                <p className="mt-0.5">
                  Dilakukan oleh Koordinator <strong>{currentUser?.name || 'Andri Wicaksono'}</strong>. Jadwal baru akan otomatis diperbarui dan langsung tampil di portal Pelaku Usaha &amp; User Monitoring.
                </p>
              </div>
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition shrink-0 flex items-center space-x-1 shadow-xs"
                title="Beri tahu PIC via WhatsApp"
              >
                <Phone className="w-3 h-3" />
                <span>Kirim WA</span>
              </a>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2.5 mt-4">
            <button
              type="button"
              onClick={() => setSelectedConsultationForReschedule(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveReschedule}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Jadwal Baru</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Verifikasi Permohonan Pendampingan
  const renderVerifyModal = () => {
    if (!selectedConsultationForVerify) return null;
    const app = selectedConsultationForVerify;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#0c406d] to-sky-600 text-white shadow-sm">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Verifikasi Permohonan Pendampingan Gedung
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  No. Registrasi: <strong className="text-[#0c406d]">{app.refNumber}</strong> • Diajukan: {app.submittedAt}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedConsultationForVerify(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* 1. Detail Gedung & Pemohon */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Identitas Bangunan &amp; Pelaku Usaha</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Nama Bangunan Gedung:</span>
                  <strong className="text-slate-900 text-sm">{app.buildingName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fungsi / Jenis Gedung:</span>
                  <strong className="text-[#0c406d]">{app.buildingType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Badan Usaha / Perusahaan:</span>
                  <strong className="text-slate-800">{app.companyName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Induk Berusaha (NIB):</span>
                  <strong className="font-mono text-slate-800">{app.nib}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Alamat Bangunan:</span>
                  <span className="text-slate-700">{app.address}, {app.district}</span>
                </div>
              </div>
            </div>

            {/* 2. Kontak Penanggung Jawab (PIC) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Kontak Penanggung Jawab (PIC)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Nama PIC:</span>
                  <strong className="text-slate-900">{app.picName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor WhatsApp / HP:</span>
                  <strong className="font-mono text-emerald-700">{app.picPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Email Asistensi:</span>
                  <strong className="text-slate-700">{app.picEmail || '-'}</strong>
                </div>
              </div>
            </div>

            {/* 3. Permintaan Konsultasi & Kendala */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Rencana Jadwal &amp; Kendala Pemohon</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2">
                <div>
                  <span className="text-slate-500 block">Tanggal Rencana:</span>
                  <strong className="text-slate-900">{app.consultationDate}</strong>
                  {app.previousDate && (
                    <span className="text-[10px] text-amber-700 block font-normal">(Semula: {app.previousDate})</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">Pilihan Metode:</span>
                  <strong className="text-sky-700">{app.method}</strong>
                </div>
              </div>
              {isKoordinator && (
                <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-[11px] font-medium">Otoritas Koordinator: Ingin menyesuaikan tanggal atau metode pendampingan?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConsultationForVerify(null);
                      handleOpenRescheduleModal(app);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ubah Jadwal</span>
                  </button>
                </div>
              )}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                <span className="text-slate-500 block text-[11px] mb-1">Kendala / Dokumen yang Perlu Diasistensi:</span>
                <p className="text-slate-800 italic leading-relaxed">"{app.notes}"</p>
              </div>

              {/* Dokumen lampiran */}
              <div className="pt-2">
                <span className="text-slate-500 block text-[11px] mb-1 font-semibold">Izin Terdaftar &amp; Lampiran Berkas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {app.ownedPermits.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase bg-blue-100 text-[#0c406d]">
                      {p}
                    </span>
                  ))}
                  {Object.entries(app.uploadedFiles || {}).map(([key, fName]) => (
                    <span key={key} className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                      <span>📄</span>
                      <span>{fName}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. FORMULIR VERIFIKASI MONITORING */}
            <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <h4 className="text-sm font-extrabold text-[#0c406d]">
                  Keputusan Verifikasi Tim Monitoring PTSP
                </h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ubah Status Verifikasi:
                </label>
                <select
                  value={verifyStatusChoice}
                  onChange={(e) => setVerifyStatusChoice(e.target.value as ConsultationStatus)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Diverifikasi & Dijadwalkan">✅ Diverifikasi &amp; Dijadwalkan (Setujui Permohonan)</option>
                  <option value="Sedang Didampingi">🔄 Sedang Didampingi (Asistensi Berjalan)</option>
                  <option value="Selesai">🎉 Selesai (Pendampingan Tuntas)</option>
                  <option value="Perlu Perbaikan">⚠️ Perlu Perbaikan (Berkas Belum Lengkap)</option>
                  <option value="Menunggu Verifikasi">⏳ Menunggu Verifikasi (Antrean)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan, Instruksi, atau Jadwal Definitif Verifikator:
                </label>
                <textarea
                  rows={3}
                  value={verifyNotesInput}
                  onChange={(e) => setVerifyNotesInput(e.target.value)}
                  placeholder="Tuliskan catatan verifikasi teknis atau instruksi kehadiran untuk pemohon..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Petugas Verifikator: <strong className="text-slate-800">{currentUser?.name || 'User Monitor'}</strong> ({currentUser?.roleTitle || 'Monitoring PTSP'})</span>
                <span className="text-[11px] text-slate-400">Tersinkronisasi Real-Time</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2.5 mt-4">
            <button
              type="button"
              onClick={() => setSelectedConsultationForVerify(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveVerification}
              className="px-5 py-2 bg-[#0c406d] hover:bg-[#083053] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Hasil Verifikasi</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW KHUSUS: USER MONITOR (READ-ONLY DASHBOARD PEMANTAUAN)
  // "Untuk User Monitoring Tampilan Hanya Dashbord Pemantauan Dilengkapi panel khusus
  // 'Pemantauan Persentase Tindak Lanjut' yang menghitung rasio persentase item
  // yang Sudah Ditindaklanjuti, Dalam Proses, dan Belum Ditindaklanjuti untuk
  // Perizinan maupun LKPM secara real-time. Selain Itu Jangan ditampilkan"
  // =========================================================================
  if (currentUser?.role === 'monitor') {
    return (
      <div className="space-y-6">
        {/* Header Dashboard Pemantauan */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 border border-emerald-500/30 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dashboard Pemantauan Resmi • Akses Khusus User Monitor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Dashboard Pemantauan &amp; Evaluasi Kepatuhan
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Pemantauan real-time rasio dan persentase tindak lanjut seluruh legalitas izin usaha
                serta kepatuhan pelaporan LKPM BKPM di seluruh entitas perusahaan.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                <span className="flex items-center space-x-1.5 font-semibold text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                  <span>{currentUser.name} ({currentUser.roleTitle})</span>
                </span>
                <span>•</span>
                <span className="text-slate-400">Mode Pengawasan: Read-Only Audit</span>
                {pendingConsultationsCount > 0 && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{pendingConsultationsCount} Permohonan Pendampingan Baru Perlu Diverifikasi</span>
                  </span>
                )}
              </div>
            </div>

            {/* Indeks Kepatuhan Kumulatif */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-4 flex items-center space-x-5 shadow-inner shrink-0">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-700"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="8"
                    className={
                      complianceScore >= 80
                        ? 'text-emerald-400'
                        : complianceScore >= 60
                        ? 'text-amber-400'
                        : 'text-rose-500'
                    }
                    strokeDasharray={`${(complianceScore / 100) * 213.6} 213.6`}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{complianceScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Indeks Kepatuhan</p>
                <h3 className="text-base font-bold text-white">
                  {complianceScore >= 80
                    ? 'Status Sangat Baik'
                    : complianceScore >= 60
                    ? 'Perhatian Diperlukan'
                    : 'Risiko Tinggi'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {followUpMetrics.totalActionItems} item dalam pengawasan aktif
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DATA PERMOHONAN PENDAMPINGAN PELAKU USAHA (UNTUK DILAKUKAN VERIFIKASI OLEH USER MONITORING) */}
        {renderConsultationSection('emerald')}

        {/* PANEL KHUSUS: PEMANTAUAN PERSENTASE TINDAK LANJUT */}
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Pemantauan Persentase Tindak Lanjut
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menghitung rasio persentase item yang <strong>Sudah Ditindaklanjuti</strong>, <strong>Dalam Proses</strong>, dan <strong>Belum Ditindaklanjuti</strong> untuk Perizinan maupun LKPM secara real-time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 shrink-0">
              <span className="text-3xl font-black text-emerald-700">
                {followUpMetrics.overallFollowedUpPct}%
              </span>
              <div className="text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                  Tingkat Tindak Lanjut Selesai
                </p>
                <p className="text-xs text-emerald-700 font-semibold">
                  {followUpMetrics.totalFollowedUp} dari {followUpMetrics.totalActionItems} Item Telah Selesai
                </p>
              </div>
            </div>
          </div>

          {/* 1. RINGKASAN KESELURUHAN (TOTAL GABUNGAN KEPATUHAN) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  1. Rasio Tindak Lanjut Keseluruhan (Total Gabungan Kepatuhan)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Total Kewajiban Terpantau: <strong>{followUpMetrics.totalActionItems} Item</strong>
              </span>
            </div>

            {/* 3 Metric Stat Cards: Sudah, Dalam Proses, Belum */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Sudah Ditindaklanjuti */}
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sudah Ditindaklanjuti</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {followUpMetrics.overallFollowedUpPct}%
                  </div>
                  <p className="text-[11px] text-emerald-300 mt-0.5">
                    {followUpMetrics.totalFollowedUp} dari {followUpMetrics.totalActionItems} item
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    Selesai
                  </span>
                </div>
              </div>

              {/* Dalam Proses */}
              <div className="bg-amber-950/60 border border-amber-500/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Dalam Proses</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {followUpMetrics.overallInProgressPct}%
                  </div>
                  <p className="text-[11px] text-amber-300 mt-0.5">
                    {followUpMetrics.totalInProgress} dari {followUpMetrics.totalActionItems} item
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    Proses
                  </span>
                </div>
              </div>

              {/* Belum Ditindaklanjuti */}
              <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold mb-1">
                    <XCircle className="w-4 h-4" />
                    <span>Belum Ditindaklanjuti</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {followUpMetrics.overallPendingPct}%
                  </div>
                  <p className="text-[11px] text-rose-300 mt-0.5">
                    {followUpMetrics.totalPending} dari {followUpMetrics.totalActionItems} item
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                    Perhatian
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Multi-Color Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Distribusi Rasio Tindak Lanjut Kumulatif:</span>
                <span>
                  <strong className="text-emerald-400">{followUpMetrics.overallFollowedUpPct}% Selesai</strong> • 
                  <strong className="text-amber-400 pl-1">{followUpMetrics.overallInProgressPct}% Proses</strong> • 
                  <strong className="text-rose-400 pl-1">{followUpMetrics.overallPendingPct}% Belum</strong>
                </span>
              </div>
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700">
                <div 
                  style={{ width: `${followUpMetrics.overallFollowedUpPct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  title={`Sudah Ditindaklanjuti: ${followUpMetrics.overallFollowedUpPct}% (${followUpMetrics.totalFollowedUp})`}
                />
                <div 
                  style={{ width: `${followUpMetrics.overallInProgressPct}%` }}
                  className="bg-amber-400 h-full transition-all duration-500" 
                  title={`Dalam Proses: ${followUpMetrics.overallInProgressPct}% (${followUpMetrics.totalInProgress})`}
                />
                <div 
                  style={{ width: `${followUpMetrics.overallPendingPct}%` }}
                  className="bg-rose-500 h-full transition-all duration-500" 
                  title={`Belum Ditindaklanjuti: ${followUpMetrics.overallPendingPct}% (${followUpMetrics.totalPending})`}
                />
              </div>
            </div>
          </div>

          {/* 2 & 3. DUA PANEL SEKTORAL: PERIZINAN & LKPM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* SEKTOR PERIZINAN */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      2. Rasio Tindak Lanjut Perizinan Usaha
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Masa berlaku &le;90 hari &amp; dokumen kedaluwarsa
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  {followUpMetrics.urgentPermitsCount} Dokumen
                </span>
              </div>

              {/* 3 Rasio Perizinan */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Sudah</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                    {followUpMetrics.permitFollowedUpPct}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {followUpMetrics.followedUpPermitsCount} Dokumen
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-xs">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Proses</p>
                  <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                    {followUpMetrics.permitInProgressPct}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {followUpMetrics.inProgressPermitsCount} Dokumen
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-rose-200 shadow-xs">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Belum</p>
                  <p className="text-xl font-extrabold text-rose-600 mt-0.5">
                    {followUpMetrics.permitPendingPct}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {followUpMetrics.pendingPermitsCount} Dokumen
                  </p>
                </div>
              </div>

              {/* Segmented bar */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${followUpMetrics.permitFollowedUpPct}%` }}
                    className="bg-emerald-500 h-full" 
                  />
                  <div 
                    style={{ width: `${followUpMetrics.permitInProgressPct}%` }}
                    className="bg-amber-400 h-full" 
                  />
                  <div 
                    style={{ width: `${followUpMetrics.permitPendingPct}%` }}
                    className="bg-rose-500 h-full" 
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Progres Legalitas:</span>
                  <span className="font-semibold text-emerald-700">
                    {followUpMetrics.followedUpPermitsCount} Selesai dari {followUpMetrics.urgentPermitsCount} Kewajiban
                  </span>
                </div>
              </div>
            </div>

            {/* SEKTOR LKPM */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      3. Rasio Tindak Lanjut Pelaporan LKPM BKPM
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Kewajiban pelaporan belum lapor &amp; perlu perbaikan
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {followUpMetrics.urgentLKPMCount} Proyek
                </span>
              </div>

              {/* 3 Rasio LKPM */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Sudah</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                    {followUpMetrics.lkpmFollowedUpPct}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {followUpMetrics.followedUpLKPMCount} Proyek
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-xs">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Proses</p>
                  <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                    {followUpMetrics.lkpmInProgressPct}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {followUpMetrics.inProgressLKPMCount} Proyek
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-rose-200 shadow-xs">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Belum</p>
                  <p className="text-xl font-extrabold text-rose-600 mt-0.5">
                    {followUpMetrics.lkpmPendingPct}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {followUpMetrics.pendingLKPMCount} Proyek
                  </p>
                </div>
              </div>

              {/* Segmented bar */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${followUpMetrics.lkpmFollowedUpPct}%` }}
                    className="bg-emerald-500 h-full" 
                  />
                  <div 
                    style={{ width: `${followUpMetrics.lkpmInProgressPct}%` }}
                    className="bg-amber-400 h-full" 
                  />
                  <div 
                    style={{ width: `${followUpMetrics.lkpmPendingPct}%` }}
                    className="bg-rose-500 h-full" 
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Progres Laporan BKPM:</span>
                  <span className="font-semibold text-indigo-700">
                    {followUpMetrics.followedUpLKPMCount} Selesai dari {followUpMetrics.urgentLKPMCount} Kewajiban
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Komparasi NIB: Pelanggaran Ganda Perizinan & LKPM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Audit Komparasi NIB: Deteksi Pelanggaran Ganda (Perizinan &amp; LKPM)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Perusahaan dengan izin operasional habis/kritis SEKALIGUS belum menyampaikan laporan LKPM.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300">
              {dualViolationsCount} Perusahaan Pelanggaran Ganda
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {nibComparisonList.map((item) => (
              <div 
                key={item.nib}
                className={`p-3.5 rounded-xl border transition ${
                  item.comparisonStatus === 'DUAL_VIOLATION'
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-100 ring-1 ring-rose-500/30'
                    : item.comparisonStatus === 'PERMIT_ONLY_ISSUE'
                    ? 'bg-amber-950/20 border-amber-600/30 text-amber-100'
                    : item.comparisonStatus === 'LKPM_ONLY_ISSUE'
                    ? 'bg-indigo-950/20 border-indigo-600/30 text-indigo-100'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white truncate max-w-[150px]">{item.companyName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                    item.comparisonStatus === 'DUAL_VIOLATION' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {item.comparisonStatus === 'DUAL_VIOLATION' ? 'Ganda' : item.scale}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">NIB: {item.nib}</p>
                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                  <span>Izin Kritis: <strong className="text-white">{item.expiredPermits.length + item.criticalPermits.length}</strong></span>
                  <span>LKPM Tertunda: <strong className="text-white">{item.unfiledLKPM.length}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TABEL RINCIAN HASIL PEMANTAUAN REAL-TIME (AUDIT READ-ONLY) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Rincian Item Kepatuhan dalam Pengawasan Tindak Lanjut</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar lengkap perizinan dan laporan LKPM yang sedang dipantau status tindak lanjutnya secara real-time.
              </p>
            </div>

            {/* Filter Pills Status */}
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-slate-500 pr-1">Filter Status:</span>
              {[
                { id: 'all', label: `Semua (${combinedActionItems.length})` },
                { id: 'Sudah Ditindaklanjuti', label: `Sudah (${followUpMetrics.totalFollowedUp})`, color: 'emerald' },
                { id: 'Dalam Proses', label: `Proses (${followUpMetrics.totalInProgress})`, color: 'amber' },
                { id: 'Belum Ditindaklanjuti', label: `Belum (${followUpMetrics.totalPending})`, color: 'rose' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setMonitorStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    monitorStatusFilter === pill.id
                      ? pill.color === 'emerald'
                        ? 'bg-emerald-600 text-white'
                        : pill.color === 'amber'
                        ? 'bg-amber-600 text-white'
                        : pill.color === 'rose'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari perusahaan, nomor dokumen izin, kode KBLI, PIC..."
                value={monitorSearchQuery}
                onChange={(e) => setMonitorSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div className="md:col-span-4 flex space-x-2">
              <button
                onClick={() => setMonitorCategoryFilter('all')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                  monitorCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Semua Sektor
              </button>
              <button
                onClick={() => setMonitorCategoryFilter('PERMIT')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                  monitorCategoryFilter === 'PERMIT'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Perizinan
              </button>
              <button
                onClick={() => setMonitorCategoryFilter('LKPM')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                  monitorCategoryFilter === 'LKPM'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                LKPM
              </button>
            </div>
          </div>

          {/* Audit Monitoring Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Entitas Perusahaan</th>
                  <th className="py-3 px-4">Item Kepatuhan &amp; Detail</th>
                  <th className="py-3 px-4">Sektor</th>
                  <th className="py-3 px-4">Tenggat Waktu</th>
                  <th className="py-3 px-4">Tingkat Risiko</th>
                  <th className="py-3 px-4">Status Tindak Lanjut</th>
                  <th className="py-3 px-4">PIC Bertanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMonitorItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data item kepatuhan yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredMonitorItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{item.companyName}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-slate-800 block truncate">{item.title}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{item.referenceNo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.type === 'PERMIT' 
                            ? 'bg-sky-50 text-sky-700 border-sky-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {item.categoryLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">{formatIndonesianDate(item.dueDate)}</span>
                        <span className={`text-[11px] font-bold ${
                          item.daysRemaining < 0 ? 'text-rose-600' : item.daysRemaining <= 30 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {item.daysRemaining < 0 ? `Lewat ${Math.abs(item.daysRemaining)} hari` : `${item.daysRemaining} hari lagi`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${item.riskColor}`}>
                          {item.riskLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          item.followUpStatus === 'Sudah Ditindaklanjuti'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : item.followUpStatus === 'Dalam Proses'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}>
                          {item.followUpStatus === 'Sudah Ditindaklanjuti' && <CheckCircle className="w-3.5 h-3.5" />}
                          {item.followUpStatus === 'Dalam Proses' && <Clock className="w-3.5 h-3.5" />}
                          {item.followUpStatus === 'Belum Ditindaklanjuti' && <XCircle className="w-3.5 h-3.5" />}
                          <span>{item.followUpStatus}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{item.picName}</span>
                        <span className="text-[11px] text-slate-400 block">{item.picEmail}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>Menampilkan {filteredMonitorItems.length} dari {combinedActionItems.length} item pengawasan</span>
            <span>Data tersinkronisasi otomatis dengan OSS-RBA</span>
          </div>
        </div>

        {/* Modal Verifikasi Permohonan Pendampingan */}
        {renderVerifyModal()}

        {/* Modal Ubah Jadwal Pendampingan (Khusus Koordinator) */}
        {renderRescheduleModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW REGULER: KOORDINATOR & PETUGAS (DASHBOARD EKSEKUTIF OPERASIONAL)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Hero / Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Pusat Komando Kepatuhan Regulasi Terintegrasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Monitoring Kepatuhan Perizinan &amp; LKPM
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pantau seluruh legalitas operasional, masa berlaku sertifikat, kewajiban pelaporan LKPM BKPM,
              dan eksekusi tindak lanjut kepatuhan secara real-time.
            </p>
          </div>

          {/* Compliance Score Gauge Card */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-xl p-4 flex items-center space-x-5 shadow-inner shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={
                    complianceScore >= 80
                      ? 'text-emerald-400'
                      : complianceScore >= 60
                      ? 'text-amber-400'
                      : 'text-rose-500'
                  }
                  strokeDasharray={`${(complianceScore / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{complianceScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Indeks Kepatuhan</p>
              <h3 className="text-base font-bold text-white">
                {complianceScore >= 80
                  ? 'Status Sangat Baik'
                  : complianceScore >= 60
                  ? 'Perhatian Diperlukan'
                  : 'Risiko Tinggi (Kritis)'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {expiredPermits.length + overdueLKPM.length} pelanggaran aktif terdeteksi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DATA PERMOHONAN PENDAMPINGAN PELAKU USAHA (UNTUK DILAKUKAN VERIFIKASI) */}
      {renderConsultationSection('sky')}

      {/* PERSENTASE TINDAK LANJUT */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-md text-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/60 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-extrabold tracking-tight">
                Pemantauan Persentase Tindak Lanjut
              </h3>
            </div>
            <p className="text-xs mt-1 text-slate-500">
              Menghitung rasio persentase item yang Sudah Ditindaklanjuti, Dalam Proses, dan Belum Ditindaklanjuti untuk Perizinan maupun LKPM secara real-time.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <span className="text-3xl font-black text-emerald-600">
              {followUpMetrics.overallFollowedUpPct}%
            </span>
            <div className="text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Selesai Ditindaklanjuti
              </p>
              <p className="text-xs text-emerald-700 font-semibold">
                {followUpMetrics.totalFollowedUp} dari {followUpMetrics.totalActionItems} Selesai
              </p>
            </div>
          </div>
        </div>

        {/* 3 Breakdown Cards: Total, Perizinan, LKPM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Rasio Tindak Lanjut */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700">Total Kepatuhan Gabungan</span>
              <span className="text-emerald-600 font-extrabold text-sm">{followUpMetrics.overallFollowedUpPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.overallFollowedUpPct}%` }}
              />
              <div 
                className="bg-amber-400 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.overallInProgressPct}%` }}
              />
              <div 
                className="bg-rose-500 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.overallPendingPct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status:</span>
              <span className="font-semibold text-emerald-600">
                {followUpMetrics.overallFollowedUpPct}% Sudah • {followUpMetrics.overallInProgressPct}% Proses • {followUpMetrics.overallPendingPct}% Belum
              </span>
            </div>
          </div>

          {/* Card 2: Perizinan Follow-Up */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700">Perizinan Usaha (&le;90 Hari)</span>
              <span className="text-sky-600 font-extrabold text-sm">{followUpMetrics.permitFollowedUpPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.permitFollowedUpPct}%` }}
              />
              <div 
                className="bg-amber-400 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.permitInProgressPct}%` }}
              />
              <div 
                className="bg-rose-500 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.permitPendingPct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Rincian:</span>
              <span className="font-semibold text-sky-600">
                {followUpMetrics.followedUpPermitsCount} Sudah • {followUpMetrics.inProgressPermitsCount} Proses • {followUpMetrics.pendingPermitsCount} Belum
              </span>
            </div>
          </div>

          {/* Card 3: LKPM Follow-Up */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700">Pelaporan LKPM BKPM</span>
              <span className="text-indigo-600 font-extrabold text-sm">{followUpMetrics.lkpmFollowedUpPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.lkpmFollowedUpPct}%` }}
              />
              <div 
                className="bg-amber-400 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.lkpmInProgressPct}%` }}
              />
              <div 
                className="bg-rose-500 h-2.5 transition-all duration-500" 
                style={{ width: `${followUpMetrics.lkpmPendingPct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Rincian:</span>
              <span className="font-semibold text-indigo-600">
                {followUpMetrics.followedUpLKPMCount} Sudah • {followUpMetrics.inProgressLKPMCount} Proses • {followUpMetrics.pendingLKPMCount} Belum
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Perizinan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Perizinan & Sertifikat</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{permits.length}</span>
            <span className="text-xs font-medium text-emerald-600">({safePermits.length} Aman)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Sisa waktu rata-rata:</span>
            <span className="font-semibold text-slate-700">114 Hari</span>
          </div>
        </div>

        {/* Metric 2: Perizinan Butuh Tindakan */}
        <div className="bg-white rounded-xl p-5 border border-rose-200/80 shadow-sm hover:shadow-md transition bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Perizinan Kritis / Expired</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600">
              {expiredPermits.length + criticalPermits.length}
            </span>
            <span className="text-xs font-semibold text-rose-800">
              ({expiredPermits.length} Expired, {criticalPermits.length} &lt;30h)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-rose-700 pt-3 border-t border-rose-100">
            <span>Perhatian &lt;90 hari:</span>
            <span className="font-bold">{warningPermits.length} Dokumen</span>
          </div>
        </div>

        {/* Metric 3: LKPM Belum Lapor */}
        <div className="bg-white rounded-xl p-5 border border-amber-200/80 shadow-sm hover:shadow-md transition bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">LKPM Belum Melaporkan</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600">{pendingLKPM.length}</span>
            <span className="text-xs font-medium text-rose-600">({overdueLKPM.length} Lewat Deadline)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-amber-800 pt-3 border-t border-amber-100">
            <span>Perlu Perbaikan / Revisi:</span>
            <span className="font-bold">{revisionLKPM.length} Proyek</span>
          </div>
        </div>

        {/* Metric 4: Surat Teguran Diterbitkan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Surat Teguran Resmi</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-indigo-600">{warningLetters.length}</span>
            <span className="text-xs font-medium text-slate-600">Surat Diterbitkan</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Investasi Terpantau:</span>
            <span className="font-semibold text-slate-700 truncate max-w-[130px]" title={formatCurrencyIDR(totalInvestment)}>
              {formatCurrencyIDR(totalInvestment)}
            </span>
          </div>
        </div>
      </div>

      {/* NIB Dual-Violation Cross-Audit Alert */}
      {dualViolationsCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white border border-rose-500/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-rose-600/30 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
              <GitCompare className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  🚨 Audit Komparasi NIB
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  Terdeteksi {dualViolationsCount} Perusahaan Mengalami Pelanggaran Ganda (Dual Violation)!
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Perusahaan terbukti <strong>belum menyampaikan LKPM sekaligus masa berlaku izin operasionalnya telah habis</strong>.
                Buka Matriks Komparasi NIB untuk menerbitkan <strong>Surat Teguran Terpadu dalam 1 kali kirim surat ke satu perusahaan</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('compare')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 flex items-center justify-center space-x-2 transition shrink-0"
          >
            <span>Buka Komparasi NIB &amp; Buat SP Terpadu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Urgent Action Banner */}
      {(expiredPermits.length > 0 || overdueLKPM.length > 0) && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Peringatan Darurat: Terdapat {expiredPermits.length} Dokumen Kedaluwarsa &amp; {overdueLKPM.length} Proyek LKPM Melewati Batas Waktu!
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Berdasarkan ketentuan BKPM dan Kementerian Lingkungan Hidup, keterlambatan ini mengakibatkan sanksi administratif SP I/SP II dan pembekuan hak akses sistem OSS.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {currentUser?.role === 'koordinator' && (
              <>
                <button
                  onClick={() => onNavigateTab('letters')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-1.5"
                >
                  <FileWarning className="w-4 h-4" />
                  <span>Cetak Surat Teguran Sekarang</span>
                </button>
                <button
                  onClick={() => onNavigateTab('notifications')}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Kirim Email Massal</span>
                </button>
              </>
            )}
            {currentUser?.role === 'petugas' && (
              <button
                onClick={() => onNavigateTab('upload')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Pembaharuan Berkas</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout: Expiring Permits vs LKPM Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top 5 Urgent Permits */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  <span>Masa Berlaku Perizinan &amp; Sertifikat Terdekat</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dokumen legalitas yang memerlukan tindak lanjut perpanjangan segera
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('compare')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
              >
                <span>Komparasi NIB ({permits.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {sortedUpcomingPermits.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold">Belum ada dokumen perizinan terdaftar di sistem.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Unggah berkas perizinan melalui akun Petugas.</p>
                </div>
              ) : (
                sortedUpcomingPermits.map((permit) => {
                const days = calculateDaysRemaining(permit.expiryDate);
                const badge = getPermitStatusBadge(
                  days < 0 ? 'expired' : days <= 7 ? 'warning_7' : days <= 30 ? 'warning_30' : days <= 90 ? 'warning_90' : 'active',
                  days
                );
                return (
                  <div key={permit.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded">
                          {permit.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {permit.permitName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>{permit.companyName}</span>
                        <span>•</span>
                        <span>No: {permit.documentNumber}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Kedaluwarsa: <strong className="text-slate-600">{formatIndonesianDate(permit.expiryDate)}</strong> | PIC: {permit.picName} ({permit.picEmail})
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                      {currentUser?.role === 'koordinator' ? (
                        <>
                          <button
                            onClick={() => onSendDirectEmail('PERMIT', permit)}
                            title="Kirim email pengingat instan ke PIC"
                            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition flex items-center space-x-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Kirim Email</span>
                          </button>
                          <button
                            onClick={() => onOpenLetterWithItem({ type: 'PERMIT', record: permit })}
                            title="Buat Surat Teguran Resmi untuk dokumen ini"
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition flex items-center space-x-1"
                          >
                            <FileWarning className="w-3.5 h-3.5" />
                            <span>Teguran</span>
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                          permit.followUpStatus === 'Sudah Ditindaklanjuti'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : permit.followUpStatus === 'Dalam Proses'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {permit.followUpStatus || 'Belum Ditindaklanjuti'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {currentUser?.role === 'petugas' ? (
              <button
                onClick={onAddNewPermit}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center space-x-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Excel / CSV Perizinan Baru</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-600">
                Pembaruan dokumen diinput oleh Petugas Legal
              </span>
            )}
            <span className="text-xs text-slate-400">
              Sistem audit masa berlaku aktif
            </span>
          </div>
        </div>

        {/* Right Column: LKPM Compliance Status Radar */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>Kepatuhan Pelaporan LKPM BKPM</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status pelaporan realisasi investasi triwulan berjalan
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('compare')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>Komparasi NIB ({lkpmRecords.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Breakdown Bar */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Distribusi Pelaporan Triwulan Ini</span>
                <span>{lkpmRecords.length} Total Laporan</span>
              </div>
              
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${(approvedLKPM.length / (lkpmRecords.length || 1)) * 100}%` }}
                  className="bg-emerald-500 h-full" 
                  title={`Disetujui: ${approvedLKPM.length}`}
                />
                <div 
                  style={{ width: `${(revisionLKPM.length / (lkpmRecords.length || 1)) * 100}%` }}
                  className="bg-amber-400 h-full" 
                  title={`Perlu Perbaikan: ${revisionLKPM.length}`}
                />
                <div 
                  style={{ width: `${(draftLKPM.length / (lkpmRecords.length || 1)) * 100}%` }}
                  className="bg-sky-400 h-full" 
                  title={`Draf: ${draftLKPM.length}`}
                />
                <div 
                  style={{ width: `${(pendingLKPM.length / (lkpmRecords.length || 1)) * 100}%` }}
                  className="bg-rose-500 h-full" 
                  title={`Belum Lapor: ${pendingLKPM.length}`}
                />
              </div>

              {/* Legend grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-rose-900">Belum Lapor</span>
                  </div>
                  <span className="font-bold text-rose-800">{pendingLKPM.length}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-semibold text-amber-900">Perlu Perbaikan</span>
                  </div>
                  <span className="font-bold text-amber-800">{revisionLKPM.length}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span className="font-semibold text-sky-900">Draf / Proses</span>
                  </div>
                  <span className="font-bold text-sky-800">{draftLKPM.length}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-emerald-900">Disetujui</span>
                  </div>
                  <span className="font-bold text-emerald-800">{approvedLKPM.length}</span>
                </div>
              </div>
            </div>

            {/* High-risk LKPM list */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Daftar Proyek Belum Lapor (Terancam SP)</span>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  {pendingLKPM.length} Proyek
                </span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pendingLKPM.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Building2 className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold">Tidak ada antrean kewajiban LKPM yang tertunda.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semua laporan telah tertib atau belum diunggah.</p>
                  </div>
                ) : (
                  pendingLKPM.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition flex items-center justify-between"
                  >
                    <div className="space-y-0.5 max-w-[240px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.companyName}
                        </span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                          {item.sanctionLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        KBLI {item.kbliCode} • {item.period} {item.year}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Batas Lapor: {formatIndonesianDate(item.deadlineDate)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      {currentUser?.role === 'koordinator' ? (
                        <>
                          <button
                            onClick={() => onSendDirectEmail('LKPM', item)}
                            className="p-1.5 text-sky-700 hover:bg-sky-100 rounded-lg transition"
                            title="Kirim Email Peringatan LKPM"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenLetterWithItem({ type: 'LKPM', record: item })}
                            className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                            title="Buat Surat Teguran Resmi LKPM"
                          >
                            <FileWarning className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.followUpStatus === 'Sudah Ditindaklanjuti'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.followUpStatus === 'Dalam Proses'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.followUpStatus || 'Belum Ditindaklanjuti'}
                        </span>
                      )}
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>

          {/* Quick Bulk Upload Shortcut */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {currentUser?.role === 'petugas' ? (
              <button
                onClick={() => onNavigateTab('upload')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center space-x-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Upload Data LKPM (Excel / CSV)</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                Data LKPM diunggah berkala oleh Petugas OSS
              </span>
            )}
            <span className="text-xs text-slate-400">Format BKPM OSS-RBA</span>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix for Koordinator */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
          <span>Aksi Cepat User Koordinator</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('compare')}
            className="p-3.5 rounded-xl border border-rose-200 hover:border-rose-500 hover:bg-rose-50/40 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <GitCompare className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Komparasi Kepatuhan NIB</h4>
            <p className="text-[11px] text-slate-500 mt-1">Cross-check perizinan &amp; LKPM deteksi pelanggaran ganda</p>
          </button>

          <button
            onClick={() => onNavigateTab('letters')}
            className="p-3.5 rounded-xl border border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <FileWarning className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Generator Surat Teguran</h4>
            <p className="text-[11px] text-slate-500 mt-1">Terbitkan SP Terpadu, SP I, &amp; SP II siap cetak / PDF</p>
          </button>

          <button
            onClick={() => onNavigateTab('notifications')}
            className="p-3.5 rounded-xl border border-sky-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Mail className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Notifikasi Email</h4>
            <p className="text-[11px] text-slate-500 mt-1">Kirim email pengingat resmi ke PIC penanggung jawab</p>
          </button>

          <button
            onClick={() => onNavigateTab('tracking')}
            className="p-3.5 rounded-xl border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Pelacakan Real-Time</h4>
            <p className="text-[11px] text-slate-500 mt-1">Pantau log audit aktivitas dan riwayat sistem</p>
          </button>
        </div>
      </div>

      {/* Modal Verifikasi Permohonan Pendampingan */}
      {renderVerifyModal()}

      {/* Modal Ubah Jadwal Pendampingan (Koordinator) */}
      {renderRescheduleModal()}
    </div>
  );
};

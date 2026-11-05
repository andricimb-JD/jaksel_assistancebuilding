import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Eye, 
  RefreshCw, 
  Inbox, 
  Settings2,
  Building,
  ShieldCheck,
  UserCheck,
  Check
} from 'lucide-react';
import { EmailLog, Permit, LKPMRecord, Company, UserRole } from '../types';
import { 
  formatIndonesianDate, 
  generateEmailNotificationTemplate, 
  calculateDaysRemaining 
} from '../utils/helpers';

interface EmailNotificationCenterProps {
  emailLogs: EmailLog[];
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  companies: Company[];
  currentUserRole?: UserRole;
  onSendEmail: (log: Omit<EmailLog, 'id'>) => void;
  onRunBatchScheduler: () => { sentCount: number; messages: string[] };
}

export const EmailNotificationCenter: React.FC<EmailNotificationCenterProps> = ({
  emailLogs,
  permits,
  lkpmRecords,
  companies,
  currentUserRole = 'koordinator',
  onSendEmail,
  onRunBatchScheduler
}) => {
  // Scheduler Triggers Toggles
  const [triggers, setTriggers] = useState({
    h90: true,
    h60: true,
    h30: true,
    h14: true,
    h7: true,
    h0: true,
    overdue: true,
    autoCcAdmin: true
  });

  const [adminEmail, setAdminEmail] = useState('andri.cimb@gmail.com');
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{ sentCount: number; messages: string[] } | null>(null);

  // Manual Quick Send Form
  const [quickForm, setQuickForm] = useState({
    recipientEmail: companies[0]?.picEmail || 'pic@perusahaan.co.id',
    recipientName: companies[0]?.picName || 'PIC Kepatuhan',
    companyName: companies[0]?.name || '',
    category: 'Pengingat Perizinan' as EmailLog['category'],
    itemTitle: 'Izin Operasional / Kepatuhan Dokumen',
    daysCount: 14,
    notes: 'Segera perpanjang dokumen perizinan / sampaikan laporan LKPM tepat waktu.'
  });

  const handleToggle = (key: keyof typeof triggers) => {
    setTriggers({ ...triggers, [key]: !triggers[key] });
  };

  const handleRunBatchNow = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = onRunBatchScheduler();
      setSimulationResult(res);
      setIsSimulating(false);
      setTimeout(() => setSimulationResult(null), 8000);
    }, 600);
  };

  const handleSendManualTest = (e: React.FormEvent) => {
    e.preventDefault();
    const htmlContent = generateEmailNotificationTemplate(
      quickForm.category === 'Teguran LKPM' ? 'LKPM' : 'PERMIT',
      quickForm.recipientName,
      quickForm.companyName,
      quickForm.itemTitle,
      quickForm.daysCount,
      quickForm.notes
    );

    const newLog: Omit<EmailLog, 'id'> = {
      recipientEmail: quickForm.recipientEmail,
      recipientName: quickForm.recipientName,
      companyName: quickForm.companyName,
      category: quickForm.category,
      subject: `[PERINGATAN RESMI] Pengingat Kepatuhan: ${quickForm.itemTitle}`,
      bodyPreview: `Yth. ${quickForm.recipientName}, sistem mendeteksi kewajiban ${quickForm.itemTitle} untuk ${quickForm.companyName}.`,
      fullHtml: htmlContent,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'Berhasil Terkirim',
      triggerType: 'Manual Admin'
    };

    onSendEmail(newLog);
    alert(`Notifikasi email berhasil dikirimkan ke ${quickForm.recipientEmail}!`);
  };

  return (
    <div className="space-y-6">
      {/* Role Restriction Banner */}
      {currentUserRole === 'petugas' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs">Akses Terbatas: Akun Petugas</p>
            <p className="text-xs text-amber-700 mt-0.5">
              User Petugas bertugas untuk mengunggah berkas Perizinan &amp; LKPM. Kewenangan pengiriman email notifikasi otomatis &amp; manual hanya dimiliki oleh <strong>User Koordinator</strong>.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-200 text-amber-900 text-xs font-bold shrink-0">
            Hanya Lihat Log
          </span>
        </div>
      )}

      {currentUserRole === 'monitor' && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl text-emerald-900 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs">Mode Pemantauan: Akun Monitor</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Anda sedang memantau rekam jejak log notifikasi email yang terkirim ke pengguna/PIC perusahaan.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-200 text-emerald-900 text-xs font-bold shrink-0">
            Read-Only Audit
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Mail className="w-6 h-6 text-sky-600" />
              <span>Pusat Notifikasi Email Otomatis &amp; Log Pengiriman</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Auto Dispatch Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi jadwal pengiriman pengingat berkala ke email pengguna/PIC, log pengiriman real-time, dan pengujian template email resmi.
          </p>
        </div>

        {currentUserRole === 'koordinator' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunBatchNow}
              disabled={isSimulating}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Menjalankan Audit...' : 'Jalankan Scan & Kirim Email Hari Ini'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Simulation Result Banner */}
      {simulationResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-900 shadow-sm animate-slide-in">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                Pengecekan Otomatis Selesai: {simulationResult.sentCount} Email Peringatan Terkirim!
              </h4>
              <div className="mt-1 space-y-0.5 text-[11px] text-emerald-800">
                {simulationResult.messages.map((m, i) => (
                  <p key={i}>✓ {m}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration & Manual Form in 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Auto Scheduler Trigger Rules */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jadwal Pemicu Notifikasi Otomatis (Triggers)</h3>
              <p className="text-xs text-slate-500">Kapan email pengingat dikirim ke PIC &amp; Admin</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'h90', label: 'H-90 (3 Bulan Sebelum Berakhir)', desc: 'Pengingat awal untuk persiapan audit perpanjangan izin' },
              { key: 'h60', label: 'H-60 (2 Bulan Sebelum Berakhir)', desc: 'Peringatan kedua untuk pengumpulan berkas administrasi' },
              { key: 'h30', label: 'H-30 (1 Bulan Sebelum Berakhir)', desc: 'Peringatan mendesak untuk submission ke dinas/OSS' },
              { key: 'h14', label: 'H-14 (2 Minggu Sebelum Berakhir)', desc: 'Peringatan kritis eskalasi ke manajemen' },
              { key: 'h7', label: 'H-7 (1 Minggu Sebelum Berakhir)', desc: 'Peringatan darurat harian' },
              { key: 'h0', label: 'Hari-H (Batas Waktu Jatuh Tempo)', desc: 'Pemberitahuan dokumen memasuki tanggal akhir berlaku' },
              { key: 'overdue', label: 'Dokumen Kedaluwarsa / LKPM Melewati Batas', desc: 'Notifikasi Surat Teguran dan sanksi berkala setiap minggu' }
            ].map((rule) => {
              const isChecked = triggers[rule.key as keyof typeof triggers];
              return (
                <div 
                  key={rule.key}
                  onClick={() => handleToggle(rule.key as keyof typeof triggers)}
                  className="flex items-start justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-900">{rule.label}</p>
                    <p className="text-[11px] text-slate-500">{rule.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Email Utama Admin Kepatuhan</p>
              <p className="text-[11px] text-slate-500">Menerima tembusan seluruh peringatan sistem</p>
            </div>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="text-xs font-mono p-2 border border-slate-300 rounded-lg w-52 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Right: Manual Test Dispatcher */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Send className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kirim Peringatan Email Langsung (Tes PIC)</h3>
              <p className="text-xs text-slate-500">Uji coba pengiriman email resmi instan ke pengguna</p>
            </div>
          </div>

          <form onSubmit={handleSendManualTest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Tujuan</label>
                <input
                  type="email"
                  required
                  value={quickForm.recipientEmail}
                  onChange={(e) => setQuickForm({ ...quickForm, recipientEmail: e.target.value })}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={quickForm.recipientName}
                  onChange={(e) => setQuickForm({ ...quickForm, recipientName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan</label>
                {companies.length === 0 ? (
                  <input
                    type="text"
                    placeholder="Ketik nama perusahaan (atau unggah data)"
                    value={quickForm.companyName}
                    onChange={(e) => setQuickForm({ ...quickForm, companyName: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                ) : (
                  <select
                    value={quickForm.companyName}
                    onChange={(e) => {
                      const comp = companies.find(c => c.name === e.target.value);
                      setQuickForm({
                        ...quickForm,
                        companyName: e.target.value,
                        recipientEmail: comp?.picEmail || quickForm.recipientEmail,
                        recipientName: comp?.picName || quickForm.recipientName
                      });
                    }}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">-- Pilih Perusahaan --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Notifikasi</label>
                <select
                  value={quickForm.category}
                  onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value as any })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="Pengingat Perizinan">Pengingat Masa Berlaku Perizinan</option>
                  <option value="Teguran LKPM">Teguran Keterlambatan LKPM</option>
                  <option value="Surat Resmi Terbit">Pemberitahuan Surat Teguran</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Izin / Dokumen / Periode LKPM</label>
              <input
                type="text"
                required
                value={quickForm.itemTitle}
                onChange={(e) => setQuickForm({ ...quickForm, itemTitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sisa Hari (- jika lewat)</label>
                <input
                  type="number"
                  value={quickForm.daysCount}
                  onChange={(e) => setQuickForm({ ...quickForm, daysCount: Number(e.target.value) })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan / Arahan</label>
                <input
                  type="text"
                  value={quickForm.notes}
                  onChange={(e) => setQuickForm({ ...quickForm, notes: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {currentUserRole === 'koordinator' ? (
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirimkan Notifikasi Email Sekarang</span>
                </button>
              ) : (
                <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200">
                  Pengiriman dinonaktifkan (Khusus User Koordinator)
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Email History Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-sky-600" />
              <span>Log Riwayat Pengiriman Notifikasi Email ({emailLogs.length})</span>
            </h3>
            <p className="text-xs text-slate-500">Rekam jejak setiap email peringatan yang dikirimkan oleh sistem</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu Kirim</th>
                <th className="py-3 px-4">Penerima &amp; Email</th>
                <th className="py-3 px-4">Perusahaan</th>
                <th className="py-3 px-4">Kategori &amp; Subjek</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Pemicu</th>
                <th className="py-3 px-4 text-right">Pratinjau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada riwayat email notifikasi yang dikirimkan</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                      Log akan tercatat secara otomatis ketika scheduler berkala berjalan atau ketika pengguna koordinator mengirim notifikasi/surat resmi.
                    </p>
                  </td>
                </tr>
              ) : (
                emailLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.sentAt}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{log.recipientName}</div>
                    <div className="text-[11px] font-mono text-sky-700">{log.recipientEmail}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                    {log.companyName}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-0.5">
                      {log.category}
                    </span>
                    <div className="font-semibold text-slate-900 line-clamp-1">{log.subject}</div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                    {log.triggerType}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setPreviewEmail(log)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Email</span>
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pratinjau Email Notifikasi</h3>
                <p className="text-xs text-slate-500 font-mono">Kepada: {previewEmail.recipientEmail}</p>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 max-h-[500px] overflow-y-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: previewEmail.fullHtml }} 
                className="bg-white rounded-lg"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

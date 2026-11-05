import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Mail, 
  User, 
  RotateCcw,
  Sparkles,
  Check,
  X,
  UploadCloud,
  Activity,
  FileText,
  ArrowRight,
  LogIn,
  Building2,
  Download,
  HelpCircle,
  Server,
  FolderArchive,
  ExternalLink
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface UserManagementViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (newUser: Omit<UserAccount, 'id'>) => { success: boolean; message: string };
  onUpdateUser: (updatedUser: UserAccount) => { success: boolean; message: string };
  onDeleteUser: (userId: string) => { success: boolean; message: string };
  onResetUsersToDefault: () => void;
  onSwitchUser?: (user: UserAccount) => void;
  onClearAllData?: () => void;
  onClearCompaniesOnly?: () => void;
  onClearPermitsOnly?: () => void;
  onClearLKPMOnly?: () => void;
  permitsCount?: number;
  lkpmCount?: number;
  companiesCount?: number;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetUsersToDefault,
  onSwitchUser,
  onClearAllData,
  onClearCompaniesOnly,
  onClearPermitsOnly,
  onClearLKPMOnly,
  permitsCount = 0,
  lkpmCount = 0,
  companiesCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetDataModal, setShowResetDataModal] = useState<false | 'all' | 'companies' | 'permits' | 'lkpm'>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New User Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'petugas' as UserRole,
  });
  const [showFormPassword, setShowFormPassword] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getRoleDetails = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return {
          title: 'Super Admin',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
          avatarColor: 'bg-purple-600',
          desc: 'Kewenangan Penuh: Menambah & Menghapus User Petugas, Koordinator, dan Monitoring.'
        };
      case 'koordinator':
        return {
          title: 'User Koordinator',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
          avatarColor: 'bg-sky-600',
          desc: 'Kewenangan: Dashboard Eksekutif, Komparasi Kepatuhan NIB, Surat Teguran Resmi, & Notifikasi Email.'
        };
      case 'petugas':
        return {
          title: 'User Petugas',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          avatarColor: 'bg-amber-600',
          desc: 'Kewenangan: Khusus Upload Data Dokumen Perizinan dan Pelaporan LKPM Saja.'
        };
      case 'monitor':
        return {
          title: 'User Monitor',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          avatarColor: 'bg-emerald-600',
          desc: 'Kewenangan: Khusus Memantau Hasil & Persentase Tindak Lanjut Real-Time (Read-Only).'
        };
      case 'pelaku_usaha':
        return {
          title: 'Pelaku Usaha',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
          avatarColor: 'bg-blue-600',
          desc: 'Pengelola Bangunan Gedung: Kendali Kondisi Gedung, Self-Check Kelaikan, & Pendampingan PTSP.'
        };
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim() || !formData.email.trim()) {
      showToast('Semua field wajib diisi.', 'error');
      return;
    }

    const roleInfo = getRoleDetails(formData.role);
    const result = onAddUser({
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim(),
      password: formData.password.trim(),
      role: formData.role,
      roleTitle: roleInfo.title,
      description: roleInfo.desc,
      avatarColor: roleInfo.avatarColor
    });

    if (result.success) {
      showToast(result.message, 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'petugas'
      });
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.username.trim() || !editingUser.password.trim() || !editingUser.email.trim()) {
      showToast('Semua field wajib diisi.', 'error');
      return;
    }

    const roleInfo = getRoleDetails(editingUser.role);
    const result = onUpdateUser({
      ...editingUser,
      name: editingUser.name.trim(),
      username: editingUser.username.trim().toLowerCase(),
      email: editingUser.email.trim(),
      password: editingUser.password.trim(),
      roleTitle: roleInfo.title,
      description: roleInfo.desc,
      avatarColor: roleInfo.avatarColor
    });

    if (result.success) {
      showToast(result.message, 'success');
      setEditingUser(null);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const result = onDeleteUser(deletingUser.id);
    if (result.success) {
      showToast(result.message, 'success');
      setDeletingUser(null);
    } else {
      showToast(result.message, 'error');
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const superAdminCount = users.filter(u => u.role === 'superadmin').length;
  const koordinatorCount = users.filter(u => u.role === 'koordinator').length;
  const petugasCount = users.filter(u => u.role === 'petugas').length;
  const monitorCount = users.filter(u => u.role === 'monitor').length;
  const pelakuUsahaCount = users.filter(u => u.role === 'pelaku_usaha').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border flex items-center space-x-3 no-print animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-slate-900 text-white border-emerald-500/50' 
            : 'bg-rose-900 text-white border-rose-500/50'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Super Admin Top Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold tracking-tight">Manajemen Pengguna &amp; Otoritas Hak Akses</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[11px] font-extrabold uppercase">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Kelola akun pengguna sistem: Tambahkan atau hapus user Petugas, Koordinator, dan Monitoring serta atur kredensial login.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Kembalikan daftar akun ke bawaan sistem (Super Admin, Koordinator, Petugas, Monitor)?')) {
                  onResetUsersToDefault();
                  showToast('Daftar pengguna berhasil dikembalikan ke akun resmi bawaan.', 'success');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center space-x-1.5"
              title="Reset ke akun default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default User</span>
            </button>

            <button
              onClick={() => setShowResetDataModal('companies')}
              className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold border border-rose-400/40 shadow-md shadow-rose-950/30 transition flex items-center space-x-1.5"
              title="Reset seluruh data entitas perusahaan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Perusahaan</span>
            </button>

            <a
              href="/dist_hostinger.zip"
              download="dist_hostinger.zip"
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-950/30 transition flex items-center space-x-1.5 cursor-pointer"
              title="Unduh paket file build (dist.zip) untuk upload ke File Manager Hostinger"
            >
              <Download className="w-4 h-4 text-sky-200" />
              <span>Ekspor dist.zip (Hostinger)</span>
            </a>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-lg shadow-purple-500/30 transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pengguna Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Akun Terdaftar</span>
            <div className="text-2xl font-extrabold text-slate-900">{users.length}</div>
            <p className="text-[10px] text-slate-500">Aktif dalam sistem database</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Koordinator */}
        <div className="bg-white rounded-xl p-4 border border-sky-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">User Koordinator</span>
            <div className="text-2xl font-extrabold text-sky-900">{koordinatorCount}</div>
            <p className="text-[10px] text-slate-500">Dashboard, SP Terpadu, Email</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Petugas */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">User Petugas</span>
            <div className="text-2xl font-extrabold text-amber-900">{petugasCount}</div>
            <p className="text-[10px] text-slate-500">Khusus Upload Berkas &amp; LKPM</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <UploadCloud className="w-5 h-5" />
          </div>
        </div>

        {/* Monitoring */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">User Monitoring</span>
            <div className="text-2xl font-extrabold text-emerald-900">{monitorCount}</div>
            <p className="text-[10px] text-slate-500">Pemantauan % Tindak Lanjut</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Super Admin Data Management & Reset Panel (Perusahaan, Perizinan, & LKPM) */}
      <div className="bg-white rounded-2xl p-5 border border-rose-200/90 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Pusat Manajemen &amp; Reset Data Sistem (Perusahaan, Perizinan, &amp; LKPM)
                </h3>
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Fitur khusus Super Admin untuk mengosongkan data profil perusahaan, arsip perizinan OSS, atau catatan pelaporan LKPM saat pengujian atau pembersihan data.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              Total Entitas: <strong className="text-slate-900 font-bold">{companiesCount}</strong> Perusahaan
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Option 1: Reset Data Perusahaan */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-rose-50/70 to-white border border-rose-200 flex flex-col justify-between space-y-3 hover:border-rose-400 transition shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  Data Perusahaan
                </span>
                <span className="text-xs font-mono font-bold text-rose-700">
                  {companiesCount} entitas
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">Reset Data Perusahaan</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Mengosongkan seluruh data profil perusahaan terdaftar (NIB, nama perusahaan, NPWP, kontak PIC) tanpa mengubah data dokumen izin atau LKPM.
                </p>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-rose-100 text-[10px] text-slate-600 space-y-0.5 font-mono">
                <div className="flex justify-between"><span>Entitas Perusahaan:</span> <strong>{companiesCount} entitas</strong></div>
                <div className="flex justify-between"><span>Status Izin &amp; LKPM:</span> <span className="text-emerald-600 font-semibold">Tetap Tersimpan</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetDataModal('companies')}
              disabled={companiesCount === 0}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/30 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Perusahaan ({companiesCount})</span>
            </button>
          </div>

          {/* Option 2: Reset Perizinan Saja */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-amber-50/70 to-white border border-amber-200 flex flex-col justify-between space-y-3 hover:border-amber-400 transition shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Khusus Dokumen Izin
                </span>
                <span className="text-xs font-mono font-bold text-amber-700">
                  {permitsCount} arsip
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">Reset Khusus Data Perizinan</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Mengosongkan seluruh arsip dokumen izin operasional OSS, masa berlaku, dan tindak lanjut perizinan tanpa menghapus data LKPM.
                </p>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-amber-100 text-[10px] text-slate-600 space-y-0.5 font-mono">
                <div className="flex justify-between"><span>Arsip Izin OSS:</span> <strong>{permitsCount} arsip</strong></div>
                <div className="flex justify-between"><span>Status LKPM:</span> <span className="text-emerald-600 font-semibold">Tetap Tersimpan</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetDataModal('permits')}
              disabled={permitsCount === 0}
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/30 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Data Perizinan ({permitsCount})</span>
            </button>
          </div>

          {/* Option 3: Reset LKPM Saja */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-sky-50/70 to-white border border-sky-200 flex flex-col justify-between space-y-3 hover:border-sky-400 transition shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                  Khusus Pelaporan LKPM
                </span>
                <span className="text-xs font-mono font-bold text-sky-700">
                  {lkpmCount} arsip
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">Reset Khusus Data LKPM</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Mengosongkan seluruh catatan pelaporan LKPM triwulan/semester, batas waktu pelaporan, dan tindak lanjut LKPM tanpa mengubah data perizinan OSS.
                </p>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-sky-100 text-[10px] text-slate-600 space-y-0.5 font-mono">
                <div className="flex justify-between"><span>Arsip LKPM:</span> <strong>{lkpmCount} arsip</strong></div>
                <div className="flex justify-between"><span>Status Perizinan:</span> <span className="text-emerald-600 font-semibold">Tetap Tersimpan</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetDataModal('lkpm')}
              disabled={lkpmCount === 0}
              className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm shadow-sky-600/30 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Data LKPM ({lkpmCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pusat Ekspor Build & Panduan Upload Hostinger (Anti-Gagal) - Super Admin Only */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-5 border border-sky-500/40 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-800/40 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">
                  Pusat Ekspor Build &amp; Panduan Deploy Web Hostinger (Anti-Gagal)
                </h3>
                <span className="text-[10px] bg-sky-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Unduh paket produksi statis <code className="text-sky-300 font-mono">dist_hostinger.zip</code> dan ikuti instruksi File Manager agar website live tanpa VPS.
              </p>
            </div>
          </div>

          <a
            href="/dist_hostinger.zip"
            download="dist_hostinger.zip"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/30 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Unduh dist_hostinger.zip</span>
          </a>
        </div>

        {/* Warning & Solution on Red Error */}
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Penyebab Error Hostinger: "Kami menemukan file yang dibuat dengan framework seperti Node.js, React, atau Vue..."</span>
          </div>
          <p className="text-rose-100/90 leading-relaxed pl-6">
            Pesan error tersebut muncul jika Anda mencoba mengupload file melalui menu <strong>"Upload file backup website" / "Migrate Website"</strong> di Hostinger. Menu tersebut hanya ditujukan untuk backup database WordPress/PHP lama.
          </p>
          <div className="bg-rose-900/30 border border-rose-500/20 rounded-lg p-2.5 ml-6 text-rose-200 text-[11px] font-semibold">
            Solusi Pasti: <strong>JANGAN</strong> gunakan menu Backup. Gunakan menu <strong>File Manager (Kelola File)</strong> dan taruh file di folder <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">public_html</code>.
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[11px]">1</span>
              <span>Unduh File Build</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Klik tombol <strong>"Unduh dist_hostinger.zip"</strong> di atas. File ini telah dikompilasi menjadi HTML, CSS, JavaScript murni + konfigurasi <code className="text-sky-300 font-mono">.htaccess</code>.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[11px]">2</span>
              <span>Buka File Manager Hostinger</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Masuk ke <strong>Hostinger hPanel</strong> &rarr; pilih domain Anda &rarr; klik menu <strong>File Manager</strong> (Kelola File) &rarr; klik dua kali untuk membuka folder <strong>public_html</strong>.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[11px]">3</span>
              <span>Upload &amp; Extract di public_html</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Upload <code className="text-sky-300 font-mono">dist_hostinger.zip</code> ke dalam folder <strong>public_html</strong>, klik kanan lalu pilih <strong>Extract</strong>. Buka domain Anda, website langsung online 100%!
            </p>
          </div>
        </div>
      </div>

      {/* Moved Feature: Daftar Akun Resmi, Kredensial Pengguna & Login Cepat / Akses Cepat */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Daftar Akun Resmi &amp; Kredensial Pengguna (Login Cepat / Beralih Akun)</span>
                <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin Panel
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Fitur pengujian dan pemantauan kredensial: Klik <strong>"Beralih / Masuk Sebagai Akun Ini"</strong> untuk langsung menguji sistem sesuai batas wewenang tiap peran.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 shrink-0 self-start sm:self-center">
            {users.length} Akun Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {users.map((user) => {
            const isSuperAdmin = user.role === 'superadmin';
            const isKoordinator = user.role === 'koordinator';
            const isPetugas = user.role === 'petugas';
            const isMonitor = user.role === 'monitor';
            const isPelakuUsaha = user.role === 'pelaku_usaha';
            const isCurrentActive = user.id === currentUser.id;
            const isPasswordVisible = revealedPasswords[`card-${user.id}`] || false;

            return (
              <div
                key={`quick-card-${user.id}`}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  isCurrentActive
                    ? 'ring-2 ring-purple-500 bg-purple-50/50 border-purple-300 shadow-sm'
                    : isSuperAdmin
                    ? 'bg-purple-50/40 border-purple-200 hover:border-purple-400'
                    : isKoordinator
                    ? 'bg-sky-50/40 border-sky-200 hover:border-sky-400'
                    : isPetugas
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                    : isPelakuUsaha
                    ? 'bg-blue-50/40 border-blue-200 hover:border-blue-400'
                    : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : isKoordinator
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : isPetugas
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : isPelakuUsaha
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {user.roleTitle}
                    </span>

                    {isCurrentActive && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <Check className="w-3 h-3 text-purple-600" />
                        <span>Akun Aktif</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    {user.buildingName && (
                      <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 truncate max-w-full">
                        🏢 {user.buildingName}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Username:</span>
                      <strong className="text-slate-800 font-bold">{user.username}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Password:</span>
                      <div className="flex items-center space-x-1.5">
                        <strong className="text-slate-800 font-bold">
                          {isPasswordVisible ? user.password : '••••••••'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => setRevealedPasswords(prev => ({ ...prev, [`card-${user.id}`]: !prev[`card-${user.id}`] }))}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                          title={isPasswordVisible ? 'Sembunyikan' : 'Tampilkan sandi'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-snug line-clamp-2">
                    {user.description}
                  </p>
                </div>

                <div className="pt-3">
                  {isCurrentActive ? (
                    <div className="w-full py-1.5 px-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold text-center border border-slate-200 flex items-center justify-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                      <span>Sesi Aktif Saat Ini</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSwitchUser) {
                          onSwitchUser(user);
                          showToast(`Berhasil beralih dan masuk sebagai ${user.name} (${user.roleTitle}).`, 'success');
                        }
                      }}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm ${
                        isSuperAdmin
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : isKoordinator
                          ? 'bg-sky-600 hover:bg-sky-700 text-white'
                          : isPetugas
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : isPelakuUsaha
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Beralih / Masuk Sebagai Akun Ini</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, email, atau peran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Semua (${users.length})` },
            { id: 'pelaku_usaha', label: `Pelaku Usaha (${pelakuUsahaCount})` },
            { id: 'superadmin', label: `Super Admin (${superAdminCount})` },
            { id: 'koordinator', label: `Koordinator (${koordinatorCount})` },
            { id: 'petugas', label: `Petugas (${petugasCount})` },
            { id: 'monitor', label: `Monitoring (${monitorCount})` }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRoleFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                roleFilter === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Daftar Pengguna Sistem &amp; Kredensial</h3>
          </div>
          <span className="text-xs text-slate-500">
            Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> pengguna
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Username &amp; Email</th>
                <th className="py-3 px-4">Peran / Hak Akses</th>
                <th className="py-3 px-4">Deskripsi Batasan Wewenang</th>
                <th className="py-3 px-4">Kata Sandi</th>
                <th className="py-3 px-4 text-center">Aksi / Beralih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Tidak ada pengguna yang cocok dengan pencarian.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ubah kata kunci atau reset filter peran.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleInfo = getRoleDetails(user.role);
                  const isCurrentActiveUser = user.id === currentUser.id;
                  const isPasswordRevealed = revealedPasswords[user.id] || false;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl ${user.avatarColor || 'bg-slate-700'} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{user.name}</span>
                              {isCurrentActiveUser && (
                                <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.2 rounded font-extrabold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {user.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-900 font-semibold">{user.username}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleInfo.badgeClass}`}>
                          {user.role === 'superadmin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                          {user.role === 'koordinator' && <Activity className="w-3 h-3 mr-1" />}
                          {user.role === 'petugas' && <UploadCloud className="w-3 h-3 mr-1" />}
                          {user.role === 'monitor' && <ShieldCheck className="w-3 h-3 mr-1" />}
                          {user.role === 'pelaku_usaha' && <Building2 className="w-3 h-3 mr-1" />}
                          <span>{roleInfo.title}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {user.description}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-800 border border-slate-200">
                            {isPasswordRevealed ? user.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                            title={isPasswordRevealed ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Quick Switch Action */}
                          {onSwitchUser && !isCurrentActiveUser && (
                            <button
                              onClick={() => {
                                onSwitchUser(user);
                                showToast(`Berhasil beralih akun ke ${user.name} (${user.roleTitle}).`, 'success');
                              }}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title={`Beralih / Login Cepat Sebagai ${user.name}`}
                            >
                              <LogIn className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Edit data & kata sandi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (isCurrentActiveUser) {
                                showToast('Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif masuk.', 'error');
                                return;
                              }
                              if (user.role === 'superadmin' && superAdminCount <= 1) {
                                showToast('Tidak dapat menghapus Super Admin terakhir pada sistem.', 'error');
                                return;
                              }
                              setDeletingUser(user);
                            }}
                            disabled={isCurrentActiveUser}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrentActiveUser 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isCurrentActiveUser ? 'Akun Anda yang sedang aktif' : 'Hapus pengguna ini'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Guide Notice */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs space-y-3">
        <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
          <KeyRound className="w-4 h-4 text-purple-600" />
          <span>Aturan Hak Akses Berdasarkan Peran (Role-Based Access Control):</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-600">
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <span className="font-bold text-purple-900 block mb-1">1. Super Admin</span>
            <p className="text-[11px] text-slate-500">
              Kewenangan mutlak untuk mengelola, menambah, menghapus user petugas, koordinator, dan monitor serta mengelola kredensial dan switch akun.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-sky-200">
            <span className="font-bold text-sky-900 block mb-1">2. User Koordinator</span>
            <p className="text-[11px] text-slate-500">
              Akses ke Dashboard Eksekutif, Komparasi Kepatuhan NIB, Surat Teguran Resmi Terpadu, Notifikasi Email &amp; Pelacakan Real-Time.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">3. User Petugas</span>
            <p className="text-[11px] text-slate-500">
              Khusus untuk unggah file data Perizinan OSS &amp; pelaporan LKPM (Excel/CSV). Tidak dapat mengakses menu penegakan hukum lainnya.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-emerald-200">
            <span className="font-bold text-emerald-900 block mb-1">4. User Monitoring</span>
            <p className="text-[11px] text-slate-500">
              Khusus melihat Dashboard Pemantauan Real-Time dan panel persentase tindak lanjut (%) secara read-only tanpa hak manipulasi data.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Tambah User Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">Daftarkan akun Petugas, Koordinator, atau Monitoring</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Reza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: petugas2"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="reza@instansi.go.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Login <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-xs font-mono p-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Peran &amp; Hak Akses Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      role: 'pelaku_usaha' as UserRole,
                      title: 'Pelaku Usaha',
                      desc: 'Kendali Kondisi Gedung & Self-Check PTSP',
                      border: 'hover:border-blue-400',
                      active: 'bg-blue-50 border-blue-500 text-blue-900'
                    },
                    {
                      role: 'petugas' as UserRole,
                      title: 'Petugas',
                      desc: 'Hanya Upload Perizinan & LKPM',
                      border: 'hover:border-amber-400',
                      active: 'bg-amber-50 border-amber-500 text-amber-900'
                    },
                    {
                      role: 'koordinator' as UserRole,
                      title: 'Koordinator',
                      desc: 'Dashboard, NIB Komparasi, Surat, Email',
                      border: 'hover:border-sky-400',
                      active: 'bg-sky-50 border-sky-500 text-sky-900'
                    },
                    {
                      role: 'monitor' as UserRole,
                      title: 'Monitoring',
                      desc: 'Hanya Pemantauan % Tindak Lanjut',
                      border: 'hover:border-emerald-400',
                      active: 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    },
                    {
                      role: 'superadmin' as UserRole,
                      title: 'Super Admin',
                      desc: 'Kelola Seluruh Pengguna Sistem',
                      border: 'hover:border-purple-400',
                      active: 'bg-purple-50 border-purple-500 text-purple-900'
                    }
                  ].map((item) => (
                    <label
                      key={item.role}
                      onClick={() => setFormData({ ...formData, role: item.role })}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                        formData.role === item.role
                          ? item.active + ' ring-2 ring-purple-400/40 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 ' + item.border
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{item.title}</span>
                        {formData.role === item.role && (
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Simpan Pengguna Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Edit3 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ubah Data Pengguna</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {editingUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru / Konfirmasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran / Wewenang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingUser.role}
                  disabled={editingUser.id === currentUser.id && editingUser.role === 'superadmin'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="pelaku_usaha">User Pelaku Usaha (Kendali Kondisi Gedung &amp; Self-Check PTSP)</option>
                  <option value="petugas">User Petugas (Khusus Upload Data Perizinan &amp; LKPM)</option>
                  <option value="koordinator">User Koordinator (Dashboard, Komparasi NIB, Surat Teguran, Email)</option>
                  <option value="monitor">User Monitoring (Khusus Pemantauan Real-Time)</option>
                  <option value="superadmin">Super Admin (Otoritas Penuh Pengguna)</option>
                </select>
                {editingUser.id === currentUser.id && (
                  <p className="text-[10px] text-amber-600 mt-1">Peran akun aktif Anda tidak dapat diubah untuk mencegah kehilangan akses.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus User */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <span className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Pengguna</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2 mb-4">
              <p>Apakah Anda yakin ingin menghapus akun pengguna berikut?</p>
              <div className="font-semibold bg-white/70 p-2.5 rounded-lg border border-rose-200 space-y-1">
                <div>Nama: <strong>{deletingUser.name}</strong></div>
                <div>Username: <code className="font-mono text-purple-700">@{deletingUser.username}</code></div>
                <div>Peran: <span className="font-bold">{deletingUser.roleTitle}</span></div>
              </div>
              <p className="text-[11px] text-rose-700">
                Setelah dihapus, pengguna ini tidak akan dapat login kembali ke sistem Jaksel Building Asistance.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Reset Data Sistem (All LKPM & Perizinan) */}
      {showResetDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <span className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {showResetDataModal === 'companies' && 'Konfirmasi Reset Data Perusahaan'}
                  {showResetDataModal === 'all' && 'Konfirmasi Reset Seluruh Data Sistem'}
                  {showResetDataModal === 'permits' && 'Konfirmasi Reset Data Perizinan'}
                  {showResetDataModal === 'lkpm' && 'Konfirmasi Reset Data LKPM'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Otoritas Khusus Super Administrator</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2.5 mb-4">
              <p className="font-semibold text-rose-950">
                {showResetDataModal === 'companies' && 'Anda akan mengosongkan seluruh entitas profil perusahaan dari sistem Jaksel Building Asistance:'}
                {showResetDataModal === 'all' && 'Anda akan mengosongkan seluruh data operasional sistem Jaksel Building Asistance:'}
                {showResetDataModal === 'permits' && 'Anda akan mengosongkan seluruh data Perizinan OSS dari sistem:'}
                {showResetDataModal === 'lkpm' && 'Anda akan mengosongkan seluruh data pelaporan LKPM dari sistem:'}
              </p>

              <div className="bg-white/80 p-3 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px]">
                {showResetDataModal === 'companies' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Total Entitas Perusahaan:</span>
                      <strong className="text-rose-700">{companiesCount} perusahaan</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Data Perizinan OSS:</span>
                      <span className="text-emerald-600 font-semibold">Tetap aman (tidak dihapus)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Data Pelaporan LKPM:</span>
                      <span className="text-emerald-600 font-semibold">Tetap aman (tidak dihapus)</span>
                    </div>
                  </>
                )}
                {showResetDataModal === 'all' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Data Perizinan OSS:</span>
                      <strong className="text-rose-700">{permitsCount} dokumen</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Data Pelaporan LKPM:</span>
                      <strong className="text-rose-700">{lkpmCount} laporan</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Entitas Perusahaan:</span>
                      <strong className="text-rose-700">{companiesCount} perusahaan</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Log Surat &amp; Notifikasi:</span>
                      <strong className="text-rose-700">Ikut dibersihkan</strong>
                    </div>
                  </>
                )}
                {showResetDataModal === 'permits' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Total Dokumen Izin OSS:</span>
                      <strong className="text-amber-700">{permitsCount} dokumen</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Data LKPM:</span>
                      <span className="text-emerald-600 font-semibold">Tetap aman (tidak dihapus)</span>
                    </div>
                  </>
                )}
                {showResetDataModal === 'lkpm' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Total Catatan LKPM:</span>
                      <strong className="text-sky-700">{lkpmCount} laporan</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• Data Perizinan OSS:</span>
                      <span className="text-emerald-600 font-semibold">Tetap aman (tidak dihapus)</span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-[11px] text-rose-700 leading-snug">
                Peringatan: Penghapusan data bersifat permanen dari local database sistem. Data baru dapat diunggah kembali oleh Petugas melalui menu Upload Data.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetDataModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showResetDataModal === 'companies' && onClearCompaniesOnly) {
                    onClearCompaniesOnly();
                  } else if (showResetDataModal === 'all' && onClearAllData) {
                    onClearAllData();
                  } else if (showResetDataModal === 'permits' && onClearPermitsOnly) {
                    onClearPermitsOnly();
                  } else if (showResetDataModal === 'lkpm' && onClearLKPMOnly) {
                    onClearLKPMOnly();
                  }
                  setShowResetDataModal(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

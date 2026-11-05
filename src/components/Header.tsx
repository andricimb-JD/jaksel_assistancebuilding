import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  FileWarning, 
  UploadCloud, 
  FileText, 
  Building2, 
  Mail, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  GitCompare,
  ChevronDown, 
  User, 
  Check, 
  Users,
  LogOut,
  Trash2,
  Download
} from 'lucide-react';
import { Permit, LKPMRecord, UserAccount, Company } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  companies?: Company[];
  currentUser: UserAccount;
  users: UserAccount[];
  onSwitchUser: (user: UserAccount) => void;
  onLogout: () => void;
  onClearAllData?: () => void;
  onQuickAddPermit: () => void;
  onQuickUploadLKPM: () => void;
  onOpenLetterGenerator: () => void;
  onRunAutoCheck: () => void;
  isChecking: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  permits,
  lkpmRecords,
  companies = [],
  currentUser,
  users,
  onSwitchUser,
  onLogout,
  onClearAllData,
  onQuickAddPermit,
  onQuickUploadLKPM,
  onOpenLetterGenerator,
  onRunAutoCheck,
  isChecking
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate urgent items
  const criticalPermits = permits.filter((p) => {
    const days = (p.daysRemaining !== undefined) ? p.daysRemaining : 999;
    return days <= 30;
  });

  const pendingLKPM = lkpmRecords.filter(
    (l) => l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan'
  );

  // Count dual violations by NIB
  const dualViolationsCount = companies.filter((c) => {
    const hasExp = permits.some((p) => {
      const isComp = p.companyId === c.id || (p.nib && p.nib === c.nib);
      const days = p.daysRemaining !== undefined ? p.daysRemaining : 999;
      return isComp && days <= 30;
    });
    const hasLkpm = lkpmRecords.some((l) => {
      const isComp = l.companyId === c.id || l.nib === c.nib;
      return isComp && (l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan');
    });
    return hasExp && hasLkpm;
  }).length;

  // Filter tabs according to role
  // Koordinator: dashboard, compare, letters, notifications, tracking (no permits, no lkpm, no bulk upload)
  // Petugas: ONLY upload data perizinan dan LKPM
  // Monitor: ONLY dashboard pemantauan
  const allTabs = [
    { 
      id: 'users', 
      label: 'Manajemen Pengguna', 
      icon: Users, 
      roles: ['superadmin'] 
    },
    { 
      id: 'building_control', 
      label: 'Kendali Kondisi Gedung', 
      icon: Building2, 
      roles: ['pelaku_usaha', 'superadmin'] 
    },
    { 
      id: 'dashboard', 
      label: currentUser.role === 'monitor' ? 'Dashboard Pemantauan' : 'Dashboard Eksekutif', 
      icon: Activity, 
      roles: ['koordinator', 'monitor', 'superadmin'] 
    },
    { 
      id: 'compare', 
      label: 'Komparasi Kepatuhan NIB', 
      icon: GitCompare,
      badge: dualViolationsCount > 0 ? dualViolationsCount : undefined,
      badgeColor: 'bg-rose-600',
      roles: ['koordinator', 'superadmin']
    },
    { 
      id: 'upload', 
      label: 'Upload Data Perizinan & LKPM', 
      icon: UploadCloud, 
      roles: ['petugas', 'superadmin'] 
    },
    { 
      id: 'letters', 
      label: 'Surat Teguran Resmi', 
      icon: FileText, 
      roles: ['koordinator', 'superadmin'] 
    },
    { 
      id: 'notifications', 
      label: 'Notifikasi Email', 
      icon: Mail, 
      roles: ['koordinator', 'superadmin'] 
    },
    { 
      id: 'tracking', 
      label: 'Pelacakan Real-Time', 
      icon: Bell, 
      roles: ['koordinator', 'superadmin'] 
    }
  ];

  const visibleTabs = allTabs.filter(tab => tab.roles.includes(currentUser.role));

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl no-print">
      {/* Top Bar */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-sky-200 to-white bg-clip-text text-transparent">
                  <span className="text-emerald-400">Jaksel</span> Building Asistance
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sistem Pengingat Masa Berlaku Perizinan & Kepatuhan Pelaporan LKPM
              </p>
            </div>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col text-right pr-2">
              <span className="text-xs font-medium text-slate-300">{currentDateTime}</span>
              <div className="flex items-center justify-end space-x-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Pelacak Aktif 24/7</span>
              </div>
            </div>

            <button
              onClick={onRunAutoCheck}
              disabled={isChecking}
              title="Jalankan audit sinkronisasi masa berlaku dan kewajiban lapor sekarang"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Sinkronisasi...' : 'Audit Real-Time'}</span>
            </button>

            {currentUser.role === 'koordinator' && (
              <button
                onClick={onOpenLetterGenerator}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/40 transition"
              >
                <FileWarning className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buat Surat Teguran</span>
              </button>
            )}

            {currentUser.role === 'petugas' && (
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-900/40 transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Data Perizinan &amp; LKPM</span>
              </button>
            )}

            {currentUser.role === 'monitor' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 text-xs font-semibold shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Pengawasan Persentase Tindak Lanjut</span>
              </div>
            )}

            {currentUser.role === 'pelaku_usaha' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-950/70 text-sky-300 border border-sky-500/40 text-xs font-semibold shadow-inner">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Kendali Kondisi Gedung Mandiri</span>
              </div>
            )}

            {/* Hostinger Build Export Button (Super Admin Only) */}
            {currentUser.role === 'superadmin' && (
              <a
                href="/dist_hostinger.zip"
                download="dist_hostinger.zip"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/70 text-sky-300 border border-sky-500/30 hover:bg-sky-900/60 hover:text-white text-xs font-semibold shadow-inner transition cursor-pointer"
                title="Unduh paket file build dist.zip siap upload ke File Manager Hostinger"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Ekspor dist.zip</span>
              </a>
            )}

            {/* Interactive User Account Dropdown (Quick Switch for Super Admin ONLY) */}
            <div className="relative pl-2 border-l border-slate-800">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800 transition focus:outline-none ring-1 ring-slate-700/60"
                  title={currentUser.role === 'superadmin' ? 'Beralih Akun (Khusus Super Admin)' : 'Profil Pengguna Aktif'}
                >
                  <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/20 shadow`}>
                    {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="hidden sm:block text-left pr-1">
                    <div className="flex items-center space-x-1">
                      <p className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                      currentUser.role === 'superadmin'
                        ? 'bg-purple-500/20 text-purple-300'
                        : currentUser.role === 'petugas' 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : currentUser.role === 'koordinator'
                        ? 'bg-sky-500/20 text-sky-300'
                        : currentUser.role === 'pelaku_usaha'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {currentUser.roleTitle}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-slide-in">
                    {currentUser.role === 'superadmin' ? (
                      /* Quick User Switcher: Strictly restricted to Super Admin */
                      <>
                        <div className="px-3 py-2 border-b border-slate-800">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span>Beralih Peran Pengguna (Super Admin):</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Hak khusus Super Admin untuk menguji peran &amp; wewenang akun lain.
                          </p>
                        </div>

                        <div className="divide-y divide-slate-800/60 py-1 max-h-64 overflow-y-auto">
                          {users.map((user) => {
                            const isSelected = user.id === currentUser.id;
                            return (
                              <button
                                key={user.id}
                                onClick={() => {
                                  onSwitchUser(user);
                                  setIsUserMenuOpen(false);
                                }}
                                className={`w-full text-left p-2.5 rounded-xl flex items-start space-x-3 transition ${
                                  isSelected ? 'bg-slate-800/90 ring-1 ring-sky-500/50' : 'hover:bg-slate-800/50'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5`}>
                                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-100">{user.name}</span>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                  </div>
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    user.role === 'superadmin'
                                      ? 'text-purple-400 bg-purple-950/60'
                                      : user.role === 'petugas'
                                      ? 'text-amber-400 bg-amber-950/60'
                                      : user.role === 'koordinator'
                                      ? 'text-sky-400 bg-sky-950/60'
                                      : user.role === 'pelaku_usaha'
                                      ? 'text-blue-400 bg-blue-950/60'
                                      : 'text-emerald-400 bg-emerald-950/60'
                                  }`}>
                                    {user.roleTitle}
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                    {user.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      /* Non-Superadmin: NO quick user switching! Only profile information & logout */
                      <div className="p-3 space-y-3">
                        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                          <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow`}>
                            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              currentUser.role === 'petugas'
                                ? 'bg-amber-500/20 text-amber-300'
                                : currentUser.role === 'koordinator'
                                ? 'bg-sky-500/20 text-sky-300'
                                : currentUser.role === 'pelaku_usaha'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {currentUser.roleTitle}
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-slate-300 text-[11px]">
                          <div className="font-semibold text-slate-200">Batasan Wewenang Peran:</div>
                          <p className="text-slate-400 leading-snug">{currentUser.description}</p>
                          <p className="text-[10px] text-emerald-400 pt-1 flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Sesi Terautentikasi Sandi Resmi</span>
                          </p>
                        </div>

                        <div className="text-[10px] text-slate-500 italic bg-slate-950/30 p-2 rounded-lg border border-slate-800/60">
                          Untuk berganti akun, silakan keluar (logout) dan lakukan autentikasi dengan akun yang dituju.
                        </div>
                      </div>
                    )}

                    {/* Clear All Data Option (Super Admin only) */}
                    {currentUser.role === 'superadmin' && onClearAllData && (
                      <div className="pt-2 mt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onClearAllData();
                          }}
                          className="w-full p-2 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-center space-x-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Kosongkan Seluruh Data (Reset)</span>
                        </button>
                      </div>
                    )}

                    {/* Logout Option in Dropdown */}
                    <div className="pt-2 mt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full p-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-900/40 flex items-center justify-center space-x-2 transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Keluar dari Sistem (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            {/* Quick Logout Icon Button */}
            <button
              onClick={onLogout}
              title="Keluar dari Akun (Logout)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition border border-slate-700/80 hover:border-rose-800/60"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Alert Ticker if critical items exist */}
        {(criticalPermits.length > 0 || pendingLKPM.length > 0) && (
          <div className="py-1.5 px-3 my-1.5 bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-slate-900 border border-rose-800/40 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-rose-200 overflow-hidden truncate">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
              <span className="font-semibold text-rose-300">Peringatan Kepatuhan:</span>
              <span className="text-slate-200 truncate">
                {criticalPermits.length} perizinan kritis/kedaluwarsa &amp; {pendingLKPM.length} data LKPM belum melapor!
              </span>
            </div>
            {currentUser.role === 'koordinator' && (
              <div className="flex items-center space-x-2 shrink-0">
                <button 
                  onClick={() => setActiveTab('compare')}
                  className="text-[11px] underline text-sky-400 hover:text-sky-300 font-medium"
                >
                  Tinjau Komparasi Kepatuhan NIB
                </button>
              </div>
            )}
            {currentUser.role === 'petugas' && (
              <div className="flex items-center space-x-2 shrink-0">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="text-[11px] underline text-amber-400 hover:text-amber-300 font-medium"
                >
                  Upload Pembaharuan Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] text-white px-1.5 py-0.2 rounded-full font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

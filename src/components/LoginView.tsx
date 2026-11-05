import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  KeyRound,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  UserPlus,
  Download
} from 'lucide-react';
import { UserAccount } from '../types';
import { DEFAULT_USERS } from '../data/mockData';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  users?: UserAccount[];
  onRegisterUser?: (newUser: Omit<UserAccount, 'id'>) => { success: boolean; message: string; user?: UserAccount };
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  users = DEFAULT_USERS,
  onRegisterUser
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (Pelaku Usaha)
  const [regForm, setRegForm] = useState({
    picName: '',
    companyName: '',
    buildingName: '',
    nib: '',
    buildingType: 'Perkantoran',
    address: 'Kebayoran Baru, Jakarta Selatan',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  const activeUsers = users && users.length > 0 ? users : DEFAULT_USERS;

  // Authenticate user against active users list with required username & password
  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setErrorMessage('Harap masukkan Username/Email dan Kata Sandi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedUser = activeUsers.find(
        (u) =>
          (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) &&
          u.password === cleanPassword
      );

      if (matchedUser) {
        setIsLoading(false);
        onLoginSuccess(matchedUser);
      } else {
        setIsLoading(false);
        setErrorMessage('Username atau kata sandi tidak cocok. Periksa kembali username dan kata sandi Anda atau hubungi Super Administrator.');
      }
    }, 400);
  };

  // Register Pelaku Usaha
  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !regForm.picName.trim() ||
      !regForm.companyName.trim() ||
      !regForm.buildingName.trim() ||
      !regForm.nib.trim() ||
      !regForm.email.trim() ||
      !regForm.username.trim() ||
      !regForm.password.trim()
    ) {
      setErrorMessage('Semua data bertanda bintang (*) wajib dilengkapi.');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    if (regForm.password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    const cleanUsername = regForm.username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = regForm.email.trim().toLowerCase();

    // Check duplicate username or email
    const duplicateUser = activeUsers.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (duplicateUser) {
      setErrorMessage(`Username "${cleanUsername}" atau email "${cleanEmail}" sudah terdaftar.`);
      return;
    }

    setIsLoading(true);

    const newUserData: Omit<UserAccount, 'id'> = {
      name: regForm.companyName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: regForm.password.trim(),
      role: 'pelaku_usaha',
      roleTitle: 'Pelaku Usaha',
      description: `Pengelola ${regForm.buildingName.trim()} (${regForm.buildingType}). Kendali kondisi kelaikan & pendampingan PTSP.`,
      avatarColor: 'bg-blue-600',
      companyName: regForm.companyName.trim(),
      buildingName: regForm.buildingName.trim(),
      nib: regForm.nib.trim(),
      buildingType: regForm.buildingType,
      address: regForm.address.trim(),
      phone: regForm.phone.trim()
    };

    if (onRegisterUser) {
      const result = onRegisterUser(newUserData);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Pendaftaran gagal. Silakan coba kembali.');
      }
    } else {
      // Fallback direct register
      const createdUser: UserAccount = {
        ...newUserData,
        id: `user-usaha-${Date.now()}`
      };
      setIsLoading(false);
      onLoginSuccess(createdUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* App Logo */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-sky-500/20 items-center justify-center mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-sky-400" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-sky-200 to-white bg-clip-text text-transparent">
          <span className="text-emerald-400">Jaksel</span> Building Asistance
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Sistem Pengingat Masa Berlaku Perizinan &amp; Kepatuhan LKPM Terpadu OSS-RBA
        </p>

        <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
          <Lock className="w-3 h-3" />
          <span>Portal Layanan Kepatuhan &amp; Kendali Gedung Jaksel</span>
        </div>
      </div>

      <div className={`mt-7 sm:mx-auto sm:w-full ${mode === 'register' ? 'sm:max-w-lg' : 'sm:max-w-md'} relative z-10 space-y-6 transition-all duration-300`}>
        {/* Card Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk Sistem</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Pelaku Usaha</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 mb-4 animate-slide-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start space-x-2.5 mb-4 animate-slide-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: FORM LOGIN KREDENSIAL                             */}
          {/* ======================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4 animate-fade-in">
              {/* Username / Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username atau Alamat Email:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan username atau email terdaftar"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Kata Sandi (Password):
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Wajib Diisi
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun Anda"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  <span>Ingat Sesi di Perangkat Ini</span>
                </label>

                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-semibold"
                >
                  Daftar Akun Baru
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Helper Link to Register as Pelaku Usaha */}
              <div className="pt-3 text-center border-t border-slate-800/80">
                <p className="text-xs text-slate-400">
                  Pemilik / Pengelola Gedung di Jakarta Selatan?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline ml-1 cursor-pointer"
                  >
                    Daftar Kendali Gedung Anda
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FORM PENDAFTARAN AKUN PELAKU USAHA                */}
          {/* ======================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleSubmitRegister} className="space-y-3.5 animate-fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Pendaftaran Akun Pelaku Usaha Gedung</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daftarkan bangunan gedung Anda untuk akses Dashboard Kendali Kondisi Gedung &amp; Fasilitas Pendampingan PTSP Jaksel.
                </p>
              </div>

              {/* Company & Building Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nama Perusahaan / Pengelola <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.companyName}
                    onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                    placeholder="Contoh: PT Graha Surya Mandiri"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nama Bangunan / Gedung <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.buildingName}
                    onChange={(e) => setRegForm({ ...regForm, buildingName: e.target.value })}
                    placeholder="Contoh: Gedung Surya Tower"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* NIB & Fungsi Gedung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nomor Induk Berusaha (NIB) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={regForm.nib}
                    onChange={(e) => setRegForm({ ...regForm, nib: e.target.value.replace(/\D/g, '') })}
                    placeholder="13 digit NIB (OSS)"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Fungsi Utama Gedung <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={regForm.buildingType}
                    onChange={(e) => setRegForm({ ...regForm, buildingType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Perkantoran">Perkantoran</option>
                    <option value="Pusat perbelanjaan">Pusat perbelanjaan / Mall</option>
                    <option value="Hotel">Hotel &amp; Penginapan</option>
                    <option value="Apartemen">Apartemen &amp; Hunian Vertikal</option>
                    <option value="Bangunan industri / pergudangan">Bangunan industri / pergudangan</option>
                    <option value="Fungsi lainnya">Fungsi lainnya</option>
                  </select>
                </div>
              </div>

              {/* PIC & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nama Penanggung Jawab (PIC) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.picName}
                    onChange={(e) => setRegForm({ ...regForm, picName: e.target.value })}
                    placeholder="Nama PIC gedung"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nomor HP / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="0812-XXXX-XXXX"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Alamat Gedung */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Alamat Gedung (Jakarta Selatan) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  placeholder="Jl. Sudirman / Jl. Rasuna Said, Kec. Kebayoran Baru"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Email & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Email Resmi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="pengelola@gedung.co.id"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Username Login <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="Contoh: gedungtower"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Kata Sandi <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="Min. 6 karakter"
                      className="w-full px-3 py-2 pr-9 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Konfirmasi Sandi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="Ulangi kata sandi"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mendaftarkan Akun Gedung...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar &amp; Buka Kendali Gedung Anda</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Sudah memiliki akun terdaftar? Masuk di sini
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security Footnote */}
        <p className="text-center text-[11px] text-slate-500">
          Jaksel Building Assistance • Unit Pengelola PTSP Kota Administrasi Jakarta Selatan
        </p>
      </div>
    </div>
  );
};

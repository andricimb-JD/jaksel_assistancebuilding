import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Store, 
  Bed, 
  Building, 
  Factory, 
  MoreHorizontal, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  Flame, 
  FileText, 
  Zap, 
  Leaf, 
  Calendar, 
  Clock, 
  Download, 
  Headphones, 
  ClipboardCheck, 
  Play, 
  Award, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Mail, 
  BookOpen, 
  Home, 
  RotateCcw,
  Sparkles,
  Printer,
  Maximize2,
  Eye,
  CheckCircle2,
  Box,
  Layers,
  Cpu,
  Megaphone,
  HelpCircle
} from 'lucide-react';
import { UserAccount, ConsultationApplication } from '../types';
import { Building4DViewer } from './Building4DViewer';

interface BuildingControlViewProps {
  currentUser: UserAccount;
  consultations?: ConsultationApplication[];
  onSubmitConsultation?: (application: ConsultationApplication) => void;
  onLogout?: () => void;
  onNavigateSuperAdmin?: () => void;
}

export const BuildingControlView: React.FC<BuildingControlViewProps> = ({
  currentUser,
  consultations,
  onSubmitConsultation,
  onLogout,
  onNavigateSuperAdmin
}) => {
  // Current screen: 'home' | 'step0' | 'step1' | 'step2' | 'step3' | 'result'
  const [screen, setScreen] = useState<'home' | 'step0' | 'step1' | 'step2' | 'step3' | 'result'>('home');

  // Pra-Langkah 1: Identifikasi Pemilik Gedung vs Pemilik Prasarana
  const [ownershipRole, setOwnershipRole] = useState<'Pemilik Gedung' | 'Hanya Pemilik Prasarana'>('Pemilik Gedung');

  // Fullscreen 4D Modal
  const [show4DFullscreen, setShow4DFullscreen] = useState<boolean>(false);

  // Photo viewer modal state
  const [activePhotoModal, setActivePhotoModal] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Step 1: Jenis / Fungsi Bangunan Gedung
  const [selectedBuilding, setSelectedBuilding] = useState<string>(
    currentUser.buildingType || 'Perkantoran'
  );

  // Step 2: Izin Eksisting & Upload File
  const [permitStates, setPermitStates] = useState<Record<string, { 
    name: string; 
    selected: boolean; 
    fileName: string | null;
    validity?: 'berlaku' | 'habis';
    damkarRkk?: boolean;
    damkarSkk?: boolean;
    reklameJenis?: 'Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage';
    reklameJenisList?: ('Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage')[];
  }>>({
    reklame: { 
      name: 'Izin Penyelenggaraan Reklame (IPR)', 
      selected: false, 
      fileName: null, 
      validity: 'berlaku', 
      reklameJenis: 'Papan / Billboard',
      reklameJenisList: ['Papan / Billboard']
    },
    slf: { name: 'Sertifikat Laik Fungsi (SLF)', selected: false, fileName: null, validity: 'berlaku' },
    pbg: { name: 'Persetujuan Bangunan Gedung (PBG / IMB)', selected: false, fileName: null, validity: 'berlaku' },
    damkar: { name: 'Proteksi Kebakaran (Damkar)', selected: false, fileName: null, validity: 'berlaku', damkarRkk: false, damkarSkk: false },
    k3: { name: 'Izin K3 Instalasi (Lift, Genset, Petir)', selected: false, fileName: null, validity: 'berlaku' },
    env: { name: 'Persetujuan Lingkungan & Andalalin', selected: false, fileName: null, validity: 'berlaku' }
  });

  // Step 3: Checkbox Persyaratan Teknis yang sudah siap ('ada' | 'tidak_ada')
  const [preparedRequirements, setPreparedRequirements] = useState<Record<string, Record<string | number, 'ada' | 'tidak_ada' | boolean>>>({
    reklame: {},
    slf: {},
    pbg: {},
    damkar: {},
    k3: {},
    env: {}
  });

  // Modals
  const [showConsultationModal, setShowConsultationModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showHostingerGuideModal, setShowHostingerGuideModal] = useState<boolean>(false);
  const [consultationSuccessData, setConsultationSuccessData] = useState<{ refNumber: string; date: string; method: string } | null>(null);

  // Form konsultasi state
  const [consultationForm, setConsultationForm] = useState({
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    method: 'Tatap Muka di PTSP Jaksel (Kantor Walikota)',
    topic: 'Pendampingan Pengurusan SLF & Dokumen Kelaikan',
    picName: currentUser.name || '',
    phone: currentUser.phone || '',
    notes: 'Mohon asistensi verifikasi persyaratan teknis dan dokumen kelaikan bangunan gedung kami.'
  });

  // Database Persyaratan Teknis untuk Tahap 3 (Standar SIMBG & Kelaikan Bangunan Gedung)
  const requirementDatabase: Record<string, { 
    title: string; 
    icon: any; 
    color: string; 
    questions: string[];
    groups?: { groupTitle: string; items: string[] }[];
  }> = {
    slf: {
      title: 'Persyaratan SLF via simbg.pu.go.id',
      icon: Building2,
      color: 'sky',
      groups: [
        {
          groupTitle: 'Data Teknis Tanah',
          items: [
            'Alas Hak Tanah'
          ]
        },
        {
          groupTitle: 'Data Umum',
          items: [
            'Data Penyedia Jasa Pengkaji Teknis',
            'Laporan Pemeriksaan Berkala Bangunan',
            'Laporan Pemeriksaan Kelaikan Fungsi Bangunan',
            'Surat Pernyataan Kelaikan Fungsi',
            'Data Persetujuan Lingkungan (mengikuti peraturan perundangan yang berlaku)',
            'Data Intensitas Bangunan (KKPR/KRK)',
            'Data SK IMB/PBG/SLF',
            'Data Identitas Pemilik Bangunan (KTP/KITAS)'
          ]
        },
        {
          groupTitle: 'Data Teknis Bangunan',
          items: [
            'Gambar As Built Drawing:\n  a. Arsitektur\n  b. Struktur\n  c. MEP',
            'Perhitungan Teknis:\n  a. Struktur\n  b. MEP'
          ]
        }
      ],
      questions: [
        'Alas Hak Tanah',
        'Data Penyedia Jasa Pengkaji Teknis',
        'Laporan Pemeriksaan Berkala Bangunan',
        'Laporan Pemeriksaan Kelaikan Fungsi Bangunan',
        'Surat Pernyataan Kelaikan Fungsi',
        'Data Persetujuan Lingkungan (mengikuti peraturan perundangan yang berlaku)',
        'Data Intensitas Bangunan (KKPR/KRK)',
        'Data SK IMB/PBG/SLF',
        'Data Identitas Pemilik Bangunan (KTP/KITAS)',
        'Gambar As Built Drawing: a. Arsitektur, b. Struktur, c. MEP',
        'Perhitungan Teknis: a. Struktur, b. MEP'
      ]
    },
    pbg: {
      title: 'Persyaratan PBG via simbg.pu.go.id',
      icon: FileText,
      color: 'amber',
      groups: [
        {
          groupTitle: 'Data Teknis Tanah',
          items: [
            'Data Tanah/Alas Hak (apabila lebih dari satu dapat disesuaikan jumlahnya)',
            'Perjanjian Kerjasama (apabila terdapat kerjasama yang melibatkan lahan yang dimohon)',
            'Hasil Penyelidikan Tanah/Soil Test (Untuk Non Rumah Tinggal)'
          ]
        },
        {
          groupTitle: 'Data Umum',
          items: [
            'Data Penyedia Jasa Perencana',
            'Data Persetujuan Lingkungan (mengikuti peraturan perundang-undangan yang berlaku)',
            'Data Intensitas Bangunan (KKPR/KRK)',
            'Data Identitas Pemilik Bangunan (KTP/KITAS)',
            'Data SK IMB/PBG/SLF (Apabila Perubahan/Penambahan)'
          ]
        },
        {
          groupTitle: 'Data Teknis Arsitektur',
          items: [
            'Gambar Perencanaan Arsitektur'
          ]
        },
        {
          groupTitle: 'Data Teknis Struktur',
          items: [
            'Gambar Perencanaan Struktur',
            'Perhitungan Teknis Struktur'
          ]
        },
        {
          groupTitle: 'Data Teknis Mekanikal, Elektrikal, dan Plambing',
          items: [
            'Gambar Rencana Dan Detail Mekanikal, Elektrikal, dan Plambing',
            'Perhitungan Teknis Mekanikal, Elektrikal, dan Plambing'
          ]
        }
      ],
      questions: [
        'Data Tanah/Alas Hak (apabila lebih dari satu dapat disesuaikan jumlahnya)',
        'Perjanjian Kerjasama (apabila terdapat kerjasama yang melibatkan lahan yang dimohon)',
        'Hasil Penyelidikan Tanah/Soil Test (Untuk Non Rumah Tinggal)',
        'Data Penyedia Jasa Perencana',
        'Data Persetujuan Lingkungan (mengikuti peraturan perundang-undangan yang berlaku)',
        'Data Intensitas Bangunan (KKPR/KRK)',
        'Data Identitas Pemilik Bangunan (KTP/KITAS)',
        'Data SK IMB/PBG/SLF (Apabila Perubahan/Penambahan)',
        'Gambar Perencanaan Arsitektur',
        'Gambar Perencanaan Struktur',
        'Perhitungan Teknis Struktur',
        'Gambar Rencana Dan Detail Mekanikal, Elektrikal, dan Plambing',
        'Perhitungan Teknis Mekanikal, Elektrikal, dan Plambing'
      ]
    },
    damkar: {
      title: 'Persyaratan Proteksi Kebakaran (RKK & SKK via jakevo.jakarta.go.id)',
      icon: Flame,
      color: 'rose',
      groups: [
        {
          groupTitle: 'Persyaratan RKK (Rekomendasi Keselamatan Kebakaran)',
          items: [
            'Menginput Isian Formulir Sertifikat Keselamatan Kebakaran (SKK) secara elektronik melalui jakevo.jakarta.go.id',
            'Identitas Pemohon / Penanggung Jawab',
            'Jika dikuasakan: Surat kuasa di atas kertas bermaterai sesuai ketentuan yang berlaku dan KTP orang yang diberi kuasa',
            'Jika Usaha Perorangan: NPWP Perorangan. Jika Badan Usaha: Akta pendirian dan perubahan (Kantor Pusat dan Kantor Cabang, jika ada), SK pengesahan pendirian dan perubahan yang dikeluarkan oleh Kemenkumham, NPWP Badan Usaha',
            'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)',
            'Lisensi Sertifikat Ahli Pemeriksa Kelaikan Fungsi Bangunan Gedung Bertingkat yang menguasai keahlian pada bangunan Gedung (LAL dan SDP), saat ini dapat dilihat pada Surat Edaran Kementerian PUPR No. 07/SE/LPJK/2022 dengan bidang kompetensi',
            'Spesifikasi Teknis: Spesifikasi peralatan dan instalasi sistem proteksi kebakaran, spesifikasi fasilitas sarana jalan keluar/jalur penyelamatan, spesifikasi akses penanggulangan kebakaran dan penyelamatan, spesifikasi teknis atau buku manual dari produsen alat proteksi kebakaran',
            'Gambar teknis yang ditandatangani oleh Pemegang Lisensi: As built drawing site plan proteksi kebakaran external (IPTB SDP asli), As built drawing denah setiap lantai sarana proteksi kebakaran dalam gedung (titik fire alarm, sprinkler, hidran gedung, APAR ber-IPTB LAL & SDP asli), gambar skematik instalasi proteksi kebakaran (single line diagram IPTB LAL & SDP)',
            'Dokumen perencanaan sistem Manajemen Keselamatan Kebakaran Gedung (MKKG) / SOP',
            'SK Gubernur RPPS'
          ]
        },
        {
          groupTitle: 'Persyaratan SKK (Sertifikat Keselamatan Kebakaran)',
          items: [
            'Menginput Isian Formulir Sertifikat Keselamatan Kebakaran (SKK) secara elektronik melalui jakevo.jakarta.go.id',
            'Identitas Pemohon / Penanggung Jawab',
            'Jika dikuasakan: Surat kuasa di atas kertas bermaterai sesuai ketentuan yang berlaku dan KTP orang yang diberi kuasa',
            'Jika Usaha Perorangan: NPWP Perorangan. Jika Badan Usaha: Akta pendirian dan perubahan (Kantor Pusat dan Kantor Cabang, jika ada), SK pengesahan pendirian dan perubahan yang dikeluarkan oleh Kemenkumham, NPWP Badan Usaha',
            'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)',
            'Sertifikat Keselamatan Kebakaran 2 (dua) tahun terakhir (boleh tidak berturut-turut sehubungan dengan ketentuan pada persyaratan No 8 dan 9)',
            'Sertifikat Laik Fungsi (SLF) tahun terakhir',
            'Lisensi Sertifikat Ahli Pemeriksa Kelaikan Fungsi Bangunan Gedung Bertingkat yang menguasai keahlian pada bangunan Gedung (LAL dan SDP), saat ini dapat dilihat pada Surat Edaran Kementerian PUPR No. 07/SE/LPJK/2022 dengan bidang kompetensi pada Tabel M.05.2 (untuk SDP) dan Tabel M.05.3 (untuk LAL)',
            'Proposal Teknis dan Gambar teknis yang ditandatangani oleh Pemegang Lisensi yang dilampirkan: As built drawing site plan proteksi external (IPTB SDP asli), As built drawing denah setiap lantai sarana proteksi kebakaran (titik fire alarm, sprinkler, hidran gedung, APAR ber-IPTB LAL & SDP asli), gambar skematik instalasi proteksi kebakaran (single line diagram IPTB LAL & SDP)',
            'Checklist pengecekan berkala internal proteksi kebakaran oleh pengelola gedung (alarm, sprinkler, hidran)',
            'Tanda Daftar Keahlian Keselamatan Kebakaran (FSM)',
            'Dokumen penyelenggaraan sistem Manajemen Keselamatan Kebakaran Gedung (MKKG) / SOP (Pelaksanaan Pelatihan Keselamatan kebakaran pada pengelola gedung, Alur Penanggulangan kebakaran dan penyelamatan jiwa)',
            'RKK (untuk permohonan Sertifikat Keselamatan Kebakaran pertama)',
            'Data inventaris pengelolaan dan pemeliharaan Alat Pemadam Api Ringan (APAR)'
          ]
        }
      ],
      questions: [
        'Menginput Isian Formulir Sertifikat Keselamatan Kebakaran (SKK) secara elektronik melalui jakevo.jakarta.go.id',
        'Identitas Pemohon / Penanggung Jawab',
        'Jika dikuasakan: Surat kuasa di atas kertas bermaterai sesuai ketentuan yang berlaku dan KTP orang yang diberi kuasa',
        'Jika Usaha Perorangan: NPWP Perorangan. Jika Badan Usaha: Akta pendirian dan perubahan (Kantor Pusat dan Kantor Cabang, jika ada), SK pengesahan pendirian dan perubahan yang dikeluarkan oleh Kemenkumham, NPWP Badan Usaha',
        'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)',
        'Lisensi Sertifikat Ahli Pemeriksa Kelaikan Fungsi Bangunan Gedung Bertingkat yang menguasai keahlian pada bangunan Gedung (LAL dan SDP), saat ini dapat dilihat pada Surat Edaran Kementerian PUPR No. 07/SE/LPJK/2022 dengan bidang kompetensi',
        'Spesifikasi Teknis: Spesifikasi peralatan dan instalasi sistem proteksi kebakaran, spesifikasi fasilitas sarana jalan keluar/jalur penyelamatan, spesifikasi akses penanggulangan kebakaran dan penyelamatan, spesifikasi teknis atau buku manual dari produsen alat proteksi kebakaran',
        'Gambar teknis yang ditandatangani oleh Pemegang Lisensi: As built drawing site plan proteksi kebakaran external (IPTB SDP asli), As built drawing denah setiap lantai sarana proteksi kebakaran dalam gedung (titik fire alarm, sprinkler, hidran gedung, APAR ber-IPTB LAL & SDP asli), gambar skematik instalasi proteksi kebakaran (single line diagram IPTB LAL & SDP)',
        'Dokumen perencanaan sistem Manajemen Keselamatan Kebakaran Gedung (MKKG) / SOP',
        'SK Gubernur RPPS',
        'Menginput Isian Formulir Sertifikat Keselamatan Kebakaran (SKK) secara elektronik melalui jakevo.jakarta.go.id',
        'Identitas Pemohon / Penanggung Jawab',
        'Jika dikuasakan: Surat kuasa di atas kertas bermaterai sesuai ketentuan yang berlaku dan KTP orang yang diberi kuasa',
        'Jika Usaha Perorangan: NPWP Perorangan. Jika Badan Usaha: Akta pendirian dan perubahan (Kantor Pusat dan Kantor Cabang, jika ada), SK pengesahan pendirian dan perubahan yang dikeluarkan oleh Kemenkumham, NPWP Badan Usaha',
        'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)',
        'Sertifikat Keselamatan Kebakaran 2 (dua) tahun terakhir (boleh tidak berturut-turut sehubungan dengan ketentuan pada persyaratan No 8 dan 9)',
        'Sertifikat Laik Fungsi (SLF) tahun terakhir',
        'Lisensi Sertifikat Ahli Pemeriksa Kelaikan Fungsi Bangunan Gedung Bertingkat yang menguasai keahlian pada bangunan Gedung (LAL dan SDP), saat ini dapat dilihat pada Surat Edaran Kementerian PUPR No. 07/SE/LPJK/2022 dengan bidang kompetensi pada Tabel M.05.2 (untuk SDP) dan Tabel M.05.3 (untuk LAL)',
        'Proposal Teknis dan Gambar teknis yang ditandatangani oleh Pemegang Lisensi yang dilampirkan: As built drawing site plan proteksi external (IPTB SDP asli), As built drawing denah setiap lantai sarana proteksi kebakaran (titik fire alarm, sprinkler, hidran gedung, APAR ber-IPTB LAL & SDP asli), gambar skematik instalasi proteksi kebakaran (single line diagram IPTB LAL & SDP)',
        'Checklist pengecekan berkala internal proteksi kebakaran oleh pengelola gedung (alarm, sprinkler, hidran)',
        'Tanda Daftar Keahlian Keselamatan Kebakaran (FSM)',
        'Dokumen penyelenggaraan sistem Manajemen Keselamatan Kebakaran Gedung (MKKG) / SOP (Pelaksanaan Pelatihan Keselamatan kebakaran pada pengelola gedung, Alur Penanggulangan kebakaran dan penyelamatan jiwa)',
        'RKK (untuk permohonan Sertifikat Keselamatan Kebakaran pertama)',
        'Data inventaris pengelolaan dan pemeliharaan Alat Pemadam Api Ringan (APAR)'
      ]
    },
    k3: {
      title: 'Syarat Pengesahan K3 (Lift, Genset, Petir)',
      icon: Zap,
      color: 'amber',
      questions: [
        'Apakah lift & eskalator memiliki laporan riksa uji berkala dari PJK3 resmi Disnakertrans?',
        'Apakah tahanan pentanahan instalasi penyalur petir memenuhi standar (di bawah 5 Ohm)?',
        'Apakah operator genset dan teknisi lift memiliki Surat Izin Operasi (SIO) aktif?'
      ]
    },
    env: {
      title: 'Syarat Dokumen Lingkungan & Andalalin',
      icon: Leaf,
      color: 'emerald',
      questions: [
        'Apakah dokumen lingkungan (AMDAL / UKL-UPL / SPPL) telah terdaftar di sistem AMDALNET / KLHK?',
        'Apakah sarana IPAL (Pengolahan Air Limbah) memiliki izin baku mutu / IPLC?',
        'Apakah telah dilakukan kajian dampak lalu lintas (Andalalin) dengan Dinas Perhubungan?'
      ]
    },
    reklame: {
      title: 'Persyaratan Izin Penyelenggaraan Reklame (IPR via jakevo.jakarta.go.id)',
      icon: Megaphone,
      color: 'purple',
      groups: [
        {
          groupTitle: 'Persyaratan Legalitas & Identitas Pemohon',
          items: [
            'Menginput isian formulir Izin Penyelenggaraan Reklame (IPR) secara elektronik melalui jakevo.jakarta.go.id',
            'Identitas Pemohon / Penanggung Jawab (KTP & NPWP Pemohon / Perusahaan)',
            'Jika dikuasakan: Surat kuasa di atas kertas bermaterai sesuai ketentuan yang berlaku dan KTP penerima kuasa',
            'Surat Pernyataan Persetujuan Pemilik Bangunan Gedung / Perjanjian Pemanfaatan Lahan Reklame (apabila reklame diselenggarakan pihak ketiga)',
            'Nomor Induk Berusaha (NIB) dan izin operasional usaha terkait'
          ]
        },
        {
          groupTitle: 'Persyaratan Teknis & Konstruksi Reklame',
          items: [
            'Gambar Denah & Peletakan Titik Reklame pada Bangunan Gedung (Site Plan, Layout Fasad Gedung, & Titik Koordinat GPS)',
            'Gambar Teknis Rancang Bangun & Konstruksi Reklame yang ditandatangani Pemegang Lisensi Keahlian (IPTB Konstruksi/Arsitektur) asli',
            'Perhitungan Teknis Kekuatan Konstruksi Reklame (Ketahanan Terhadap Beban Statis & Beban Terpaan Angin / Gempa)',
            'Surat Keterangan Kelaikan Konstruksi Reklame (SKKR) dari Ahli/Penyedia Jasa Pengkaji Teknis'
          ]
        },
        {
          groupTitle: 'Instalasi Kelistrikan & Jaminan Keselamatan',
          items: [
            'Gambar Skematik Instalasi Kelistrikan Reklame (Single Line Diagram untuk Videotron / Megatron / Neon Box)',
            'Surat Pernyataan Keamanan Kelistrikan dan Penggunaan Lampu Hemat Energi (LED)',
            'Polis Asuransi Tanggung Gugat Pihak Ketiga (Third Party Liability) atas risiko roboh atau kecelakaan fisik',
            'Foto visual simulasi / mock-up peletakan materi reklame pada fasad atau halaman gedung'
          ]
        },
        {
          groupTitle: 'Kewajiban Perpajakan Daerah (Bapenda DKI Jakarta)',
          items: [
            'Surat Pemberitahuan Pajak Daerah (SPTPD) / Surat Ketetapan Pajak Daerah (SKPD) Pajak Reklame',
            'Bukti Pelunasan Surat Setoran Pajak Daerah (SSPD) Pajak Reklame tahun/masa berlaku berjalan',
            'Surat Izin Penyelenggaraan Reklame (IPR) periode sebelumnya (khusus untuk permohonan perpanjangan izin)'
          ]
        }
      ],
      questions: [
        'Menginput isian formulir Izin Penyelenggaraan Reklame (IPR) secara elektronik melalui jakevo.jakarta.go.id',
        'Identitas Pemohon / Penanggung Jawab (KTP & NPWP Pemohon / Perusahaan)',
        'Jika dikuasakan: Surat kuasa bermaterai dan KTP penerima kuasa',
        'Surat Persetujuan Pemilik Bangunan Gedung / Perjanjian Pemanfaatan Lahan Reklame',
        'Gambar Denah / Peletakan Titik Reklame pada Bangunan Gedung (Site Plan & Fasad)',
        'Gambar Teknis Konstruksi Reklame ber-IPTB asli',
        'Perhitungan Teknis Kekuatan Konstruksi Reklame (Ketahanan Beban & Angin)',
        'Gambar Skematik Instalasi Kelistrikan Reklame (Single Line Diagram)',
        'Polis Asuransi Tanggung Gugat Pihak Ketiga (Third Party Liability)',
        'Bukti Pembayaran Pajak Reklame (SKPD / SSPD Pajak Reklame Bapenda DKI)'
      ]
    }
  };

  // Toggle Permit card in Step 2
  const togglePermitCard = (key: string) => {
    setPermitStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        selected: !prev[key].selected
      }
    }));
  };

  // Handle local file upload simulation
  const handleItemUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPermitStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          selected: true,
          fileName: file.name
        }
      }));
    }
  };

  // Remove uploaded file
  const removeItemUpload = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPermitStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        fileName: null
      }
    }));
  };

  // Handle setting permit validity ('berlaku' | 'habis')
  const handleSetPermitValidity = (key: string, validity: 'berlaku' | 'habis') => {
    setPermitStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        selected: true,
        validity
      }
    }));
  };

  // Handle toggling Damkar sub-documents (RKK & SKK)
  const handleToggleDamkarDoc = (subDoc: 'damkarRkk' | 'damkarSkk') => {
    setPermitStates(prev => {
      const currentDamkar = prev.damkar;
      const nextVal = !currentDamkar[subDoc];
      const willHaveAny = subDoc === 'damkarRkk' ? (nextVal || !!currentDamkar.damkarSkk) : (nextVal || !!currentDamkar.damkarRkk);
      return {
        ...prev,
        damkar: {
          ...currentDamkar,
          [subDoc]: nextVal,
          selected: willHaveAny || currentDamkar.selected
        }
      };
    });
  };

  // Handle setting Reklame jenis ('Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage')
  const handleSetReklameJenis = (jenis: 'Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage') => {
    setPermitStates(prev => ({
      ...prev,
      reklame: {
        ...prev.reklame,
        selected: true,
        reklameJenis: jenis,
        reklameJenisList: [jenis]
      }
    }));
  };

  // Handle toggling Reklame jenis cheklis ('Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage')
  const handleToggleReklameJenis = (jenis: 'Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage') => {
    setPermitStates(prev => {
      const currentList = prev.reklame.reklameJenisList || (prev.reklame.reklameJenis ? [prev.reklame.reklameJenis] : ['Papan / Billboard']);
      const exists = currentList.includes(jenis);
      let nextList: ('Papan / Billboard' | 'Megatron / Videotron / LED' | 'Neon Box / Signage')[];
      if (exists) {
        nextList = currentList.filter(j => j !== jenis);
        if (nextList.length === 0) nextList = [jenis]; // minimal tetap ada 1 pilihan jika aktif
      } else {
        nextList = [...currentList, jenis];
      }
      return {
        ...prev,
        reklame: {
          ...prev.reklame,
          selected: true,
          reklameJenis: nextList[0] || jenis,
          reklameJenisList: nextList
        }
      };
    });
  };

  // Set requirement status ('ada' | 'tidak_ada')
  const handleSetRequirementStatus = (permitKey: string, qKey: string | number, status: 'ada' | 'tidak_ada') => {
    setPreparedRequirements(prev => {
      const currentPermitReqs = prev[permitKey] || {};
      const currentVal = currentPermitReqs[qKey];
      const nextVal = currentVal === status ? undefined : status;
      const updated = { ...currentPermitReqs };
      if (nextVal === undefined) {
        delete updated[qKey];
      } else {
        updated[qKey] = nextVal;
      }
      return {
        ...prev,
        [permitKey]: updated
      };
    });
  };

  // Toggle prepared requirement checkbox (legacy helper)
  const toggleRequirement = (permitKey: string, qIdx: number) => {
    handleSetRequirementStatus(permitKey, qIdx, 'ada');
  };

  // Missing permits keys based on role
  const missingPermitKeys = Object.keys(permitStates).filter(k => {
    if (ownershipRole === 'Hanya Pemilik Prasarana') {
      return k === 'reklame';
    }
    return k !== 'reklame' && !permitStates[k].selected;
  });
  const ownedPermitsCount = Object.keys(permitStates).filter(k => {
    if (ownershipRole === 'Hanya Pemilik Prasarana') {
      return k === 'reklame' && permitStates.reklame.selected;
    }
    return k !== 'reklame' && permitStates[k].selected;
  }).length;
  const uploadedFilesCount = Object.keys(permitStates).filter(k => permitStates[k].fileName !== null).length;
  const totalPermitsCount = ownershipRole === 'Hanya Pemilik Prasarana' ? 1 : 5;

  const buildingName = currentUser.buildingName || currentUser.companyName || 'Gedung Surya Tower';
  const districtName = 'Jakarta Selatan';

  // Find current user's consultation if already submitted
  const myConsultation = consultations?.find(
    (c) => c.userId === currentUser.id || c.nib === currentUser.nib || c.buildingName === buildingName
  );

  // Handle consultation form submit
  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = `PTSP-JS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: ConsultationApplication = {
      id: `cs-${Date.now()}`,
      refNumber: ref,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      userId: currentUser.id,
      userName: currentUser.name,
      buildingName: buildingName,
      buildingType: selectedBuilding,
      companyName: currentUser.companyName || buildingName,
      nib: currentUser.nib || '0123456789012',
      address: currentUser.address || 'Jakarta Selatan',
      district: districtName,
      picName: consultationForm.picName || currentUser.name,
      picPhone: consultationForm.phone || currentUser.phone || '-',
      picEmail: currentUser.email,
      consultationDate: consultationForm.date,
      method: consultationForm.method,
      topic: consultationForm.topic,
      notes: consultationForm.notes,
      ownedPermits: Object.keys(permitStates).filter(k => permitStates[k].selected).map(k => {
        const p = permitStates[k];
        const valText = p.validity === 'habis' ? ' (Habis Masa Berlaku)' : ' (Masih Berlaku)';
        const damkarExtra = k === 'damkar' && (p.damkarRkk || p.damkarSkk)
          ? ` [${[p.damkarRkk && 'RKK', p.damkarSkk && 'SKK'].filter(Boolean).join(', ')}]`
          : '';
        const reklameExtra = k === 'reklame' && p.reklameJenis
          ? ` [Jenis: ${p.reklameJenis}]`
          : '';
        return `${p.name}${valText}${damkarExtra}${reklameExtra}`;
      }),
      uploadedFiles: Object.keys(permitStates).reduce((acc, k) => {
        if (permitStates[k].fileName) acc[k] = permitStates[k].fileName!;
        return acc;
      }, {} as Record<string, string>),
      preparedRequirementsCount: Object.values(preparedRequirements).reduce(
        (acc, curr) => acc + Object.values(curr).filter(v => v === 'ada' || v === true).length, 0
      ),
      status: 'Menunggu Verifikasi'
    };

    if (onSubmitConsultation) {
      onSubmitConsultation(newApp);
    }

    setConsultationSuccessData({
      refNumber: ref,
      date: consultationForm.date,
      method: consultationForm.method
    });
  };

  return (
    <div className="w-full flex-1 py-1 sm:py-3 px-1 sm:px-2 font-sans text-slate-800 transition-all">
      {/* Responsive Wrapper: Adaptively expands to screen width */}
      <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Interactive App Container */}
        <div className="w-full mx-auto lg:col-span-7 xl:col-span-7 2xl:col-span-7 bg-white min-h-[860px] rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden relative border border-slate-200">
        
        {/* ==================== TOP HEADER ==================== */}
        <header className="px-5 py-3.5 bg-white flex items-center justify-between border-b border-slate-100 z-20 sticky top-0 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0c406d] to-sky-500 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-[#0c406d]">
                <ShieldCheck className="w-5 h-5 text-[#0c406d]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-sm leading-tight text-slate-900">Jaksel Building Assistance</h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-[#0c406d]">
                  PTSP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">Pendampingan Gedung Jakarta Selatan</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser.role === 'superadmin' && (
              <>
                <a
                  href="/dist.zip"
                  download="dist_hostinger.zip"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0c406d] hover:bg-[#093256] text-white shadow-2xs transition cursor-pointer"
                  title="Unduh paket file build (dist.zip) siap upload ke Hostinger"
                >
                  <Download className="w-3.5 h-3.5 text-sky-300" />
                  <span className="hidden sm:inline">Ekspor Build (dist.zip)</span>
                  <span className="sm:hidden">dist.zip</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowHostingerGuideModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition cursor-pointer"
                  title="Panduan upload ke Hostinger (Anti-Gagal)"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-100" />
                  <span className="hidden sm:inline">Panduan Hostinger</span>
                </button>
              </>
            )}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Pelaku Usaha
            </span>
            {currentUser.role === 'superadmin' && onNavigateSuperAdmin && (
              <button
                onClick={onNavigateSuperAdmin}
                className="text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold px-2 py-1 rounded-lg transition"
                title="Kembali ke Manajemen Super Admin"
              >
                Dashboard Super Admin
              </button>
            )}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                title="Keluar dari akun"
              >
                Keluar
              </button>
            )}
          </div>
        </header>

        {/* ==================== DYNAMIC CONTENT AREA ==================== */}
        <div className="flex-1 overflow-y-auto relative flex flex-col p-5">
          
          {/* ========================================================= */}
          {/* SCREEN 1: BERANDA / HOME (Kendali Kondisi Gedung Anda)      */}
          {/* ========================================================= */}
          {screen === 'home' && (
            <section className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>

                {/* 4D Digital Twin Interactive Viewer */}
                <div className="mb-5">
                  <Building4DViewer
                    buildingName={buildingName}
                    buildingType={selectedBuilding}
                    companyName={currentUser.companyName}
                    nib={currentUser.nib}
                    address={currentUser.address}
                    permitStates={permitStates}
                    onOpenConsultation={() => setShowConsultationModal(true)}
                  />
                </div>

                {/* Building Profile Card */}
                <div className="bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 border border-blue-200/90 rounded-2xl p-4 mb-5 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    {/* Building Icon Badge */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0c406d] to-sky-700 flex items-center justify-center text-white shrink-0 shadow-md border-t border-l border-white/40 border-b-2 border-r-2 border-black/20">
                      <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full truncate">
                          Gedung Terdaftar
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs shrink-0">
                          NIB: {currentUser.nib || '0123456789012'}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1 truncate">{buildingName}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{currentUser.companyName || 'PT Pengelola Gedung Jaksel'}</p>

                      <div className="mt-2 pt-2 border-t border-blue-100/70 flex items-center justify-between text-[11px] text-slate-600">
                        <div className="flex items-center space-x-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{currentUser.address || 'Kec. Kebayoran Baru, Jakarta Selatan'}</span>
                        </div>
                        <span className="font-semibold text-[#0c406d] bg-sky-100/70 px-2 py-0.5 rounded text-[10px] shrink-0 ml-1">
                          {selectedBuilding}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Permohonan Pendampingan Pelaku Usaha (jika sudah diajukan) */}
                {myConsultation && (
                  <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/90 shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-sky-200/60">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-[#0c406d] text-white">
                          <Headphones className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="font-extrabold text-[#0c406d] text-xs block leading-tight">
                            Permohonan Pendampingan PTSP Anda
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            No. Registrasi: <strong>{myConsultation.refNumber}</strong>
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        myConsultation.status === 'Menunggu Verifikasi'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : myConsultation.status === 'Diverifikasi & Dijadwalkan'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : myConsultation.status === 'Sedang Didampingi'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        {myConsultation.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-start justify-between">
                        <span>Jadwal Konsultasi:</span>
                        <div className="text-right">
                          <strong className="text-slate-800 block">{myConsultation.consultationDate} ({myConsultation.method})</strong>
                          {myConsultation.previousDate && (
                            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                              *Telah dijadwalkan ulang oleh Koordinator PTSP (Semula: {myConsultation.previousDate})
                            </span>
                          )}
                        </div>
                      </div>
                      {myConsultation.rescheduleReason && (
                        <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg mt-1">
                          <strong className="block text-amber-950 font-bold mb-0.5">Catatan Penjadwalan Ulang Koordinator:</strong>
                          <p className="italic">"{myConsultation.rescheduleReason}"</p>
                        </div>
                      )}
                      {myConsultation.verifiedBy && (
                        <div className="pt-1.5 mt-1 border-t border-sky-200/60 text-emerald-700 bg-emerald-50/70 p-2 rounded-lg">
                          <div className="font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Diverifikasi oleh Tim Monitoring PTSP: {myConsultation.verifiedBy}</span>
                          </div>
                          {myConsultation.officerNotes && (
                            <p className="text-[10px] text-slate-700 mt-0.5 italic">
                              "{myConsultation.officerNotes}"
                            </p>
                          )}
                        </div>
                      )}
                      {!myConsultation.verifiedBy && (
                        <p className="text-[10px] text-amber-700 italic pt-0.5">
                          Permohonan telah masuk ke antrean verifikasi user Monitoring PTSP. Anda akan dihubungi setelah verifikasi berkas selesai.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Headline */}
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug mb-1.5">
                  Kenali kondisi gedung Anda.
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Lakukan evaluasi mandiri kelengkapan izin &amp; kelaikan fungsi gedung Anda, lalu manfaatkan fasilitas pendampingan langsung dari PTSP Kota Administrasi Jakarta Selatan.
                </p>

                {/* 3 Main Action Cards */}
                <div className="space-y-3">
                  {/* Card 1: Mulai Self-Check */}
                  <div 
                    onClick={() => setScreen('step0')} 
                    className="cursor-pointer bg-[#0c406d] hover:bg-[#083053] text-white p-4 rounded-2xl flex items-center gap-3.5 transition shadow-md shadow-[#0c406d]/20 group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">Mulai Self-Check Gedung</h3>
                      <p className="text-xs text-blue-100/80 mt-0.5">Periksa kondisi kelaikan dan kebutuhan perizinan gedung</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-sky-200 group-hover:translate-x-1 transition shrink-0" />
                  </div>

                  {/* Card 2: Lanjutkan Self-Check */}
                  <div 
                    onClick={() => setScreen(ownedPermitsCount > 0 ? 'step2' : 'step0')} 
                    className="cursor-pointer bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 p-4 rounded-2xl flex items-center gap-3.5 transition shadow-xs group"
                  >
                    <div className="w-11 h-11 rounded-xl border border-slate-200 bg-sky-50 flex items-center justify-center shrink-0 text-[#0c406d]">
                      <Play className="w-5 h-5 fill-current ml-0.5 text-[#0c406d]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-slate-900">Lanjutkan Evaluasi Terakhir</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Lanjutkan pemeriksaan pada tahap yang belum selesai</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#0c406d] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 shrink-0">
                      {ownedPermitsCount} Izin Diisi
                    </span>
                  </div>

                  {/* Card 3: Minta Pendampingan PTSP with 3D Badge */}
                  <div 
                    onClick={() => setShowConsultationModal(true)} 
                    className="cursor-pointer bg-gradient-to-r from-amber-50/60 to-white border border-amber-200/90 hover:border-amber-300 hover:bg-amber-50 text-slate-800 p-3.5 rounded-2xl flex items-center gap-3.5 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 flex items-center justify-center text-white shrink-0 shadow-md border-t border-l border-white/40 border-b-2 border-r-2 border-black/20 group-hover:scale-105 transition-transform">
                      <Headphones className="w-6 h-6 drop-shadow-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-bold text-sm text-slate-900">Minta Pendampingan PTSP</h3>
                        <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          Resmi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Konsultasi tatap muka / online dengan tim teknis PTSP Jaksel</p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                      Gratis
                    </span>
                  </div>
                </div>
              </div>

              {/* Sistem Kelaikan Terintegrasi Footer Banner */}
              <div className="mt-6 pt-3 border-t border-slate-100">
                <div className="w-full p-3 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-sky-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                        <Box className="w-3.5 h-3.5 text-sky-400" />
                        <span>Sistem Kelaikan Gedung Terintegrasi</span>
                      </h4>
                      <p className="text-[10px] text-slate-300">PP No. 16/2021 &amp; Perda DKI No. 7/2010</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    PTSP Jaksel
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SCREEN: SEBELUM LANGKAH 1 (Identifikasi Pemilik Gedung vs Pemilik Prasarana) */}
          {/* ========================================================================= */}
          {screen === 'step0' && (
            <section className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setScreen('home')} 
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-700 transition cursor-pointer"
                    title="Kembali ke Beranda"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base leading-tight">Self-Check Gedung &amp; Prasarana</h2>
                    <p className="text-[11px] text-slate-500">Tahap Kualifikasi Objek Evaluasi</p>
                  </div>
                </div>

                {/* Stepper: Pra-Langkah Active */}
                <div className="flex items-center justify-center gap-2 py-2 mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c406d] text-white text-xs font-bold shadow-sm ring-4 ring-sky-100">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Tahap Awal</span>
                  </div>
                  <span className="w-6 h-0.5 bg-slate-200" />
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">1</div>
                  <span className="w-6 h-0.5 bg-slate-200" />
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">2</div>
                  <span className="w-6 h-0.5 bg-slate-200" />
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">3</div>
                  <span className="w-6 h-0.5 bg-slate-200" />
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">4</div>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-[#0c406d] font-bold uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Pra-Langkah 1
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-2 leading-tight">
                    Apakah Anda Pemilik Gedung atau Pemilik Prasarana?
                  </h3>
                  <p className="font-medium text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                    Pilih salah satu cheklis di bawah ini agar materi evaluasi perizinan dan kelaikan fungsi disesuaikan dengan peran kepemilikan Anda:
                  </p>
                </div>

                {/* 2 Opsi Cheklis: Pemilik Gedung vs Hanya Pemilik Prasarana */}
                <div className="space-y-3.5">
                  {/* Opsi 1: Cheklis Pemilik Gedung */}
                  <div 
                    onClick={() => setOwnershipRole('Pemilik Gedung')}
                    className={`flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer select-none ${
                      ownershipRole === 'Pemilik Gedung'
                        ? 'border-[#0c406d] bg-sky-50/50 shadow-md ring-4 ring-sky-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1 mr-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0 transition ${
                        ownershipRole === 'Pemilik Gedung' 
                          ? 'bg-[#0c406d] border-[#0c406d] text-white shadow-xs' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {ownershipRole === 'Pemilik Gedung' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                            Pemilik Gedung
                          </h4>
                          <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                            Kelaikan Gedung Menyeluruh
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Pemilik, pengelola, atau perwakilan badan usaha pengelola <strong>bangunan gedung seutuhnya</strong>. Bertanggung jawab atas kelaikan struktur, arsitektur, proteksi kebakaran (Damkar), K3 instalasi mekanikal/elektrikal (lift, genset, petir), lingkungan hidup, dan reklame gedung.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">SLF Gedung</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">PBG / IMB</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">Damkar RKK/SKK</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">K3 Instalasi</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">Lingkungan</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-[#0c406d] flex items-center justify-center text-white shrink-0 shadow-md border-t border-l border-white/40 border-b-2 border-r-2 border-black/20">
                      <Building2 className="w-6 h-6 drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Opsi 2: Cheklis Hanya Pemilik Prasarana */}
                  <div 
                    onClick={() => {
                      setOwnershipRole('Hanya Pemilik Prasarana');
                      setPermitStates(prev => ({
                        ...prev,
                        reklame: {
                          ...prev.reklame,
                          selected: true
                        }
                      }));
                    }}
                    className={`flex flex-col p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer select-none ${
                      ownershipRole === 'Hanya Pemilik Prasarana'
                        ? 'border-purple-600 bg-purple-50/50 shadow-md ring-4 ring-purple-100'
                        : 'border-slate-200 hover:border-purple-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1 mr-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0 transition ${
                          ownershipRole === 'Hanya Pemilik Prasarana' 
                            ? 'bg-purple-600 border-purple-600 text-white shadow-xs' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {ownershipRole === 'Hanya Pemilik Prasarana' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                              Hanya Pemilik Prasarana
                            </h4>
                            <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              Fokus Prasarana &amp; IPR Reklame
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            Pemilik, vendor advertising, atau penyelenggara <strong>prasarana komersial</strong> (seperti Papan Reklame/Billboard, Megatron/Videotron LED, Neon Box Fasad, atau Sarana Menara) yang terpasang pada bangunan atau persil tanah tanpa memiliki keseluruhan gedung induk.
                          </p>
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-purple-700">
                            <span className="px-2 py-0.5 rounded bg-purple-100/70 border border-purple-200">Izin Reklame (IPR JakEVO)</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100/70 border border-purple-200">Pajak Reklame Bapenda</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100/70 border border-purple-200">Konstruksi Prasarana</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100/70 border border-purple-200">Kelistrikan &amp; LED</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-900 flex items-center justify-center text-white shrink-0 shadow-md border-t border-l border-white/40 border-b-2 border-r-2 border-black/20">
                        <Megaphone className="w-6 h-6 drop-shadow-sm" />
                      </div>
                    </div>

                    {/* Penyelenggara Reklame Gedung (IPR) - Terpasang di Pilihan Pemilik Prasarana */}
                    {ownershipRole === 'Hanya Pemilik Prasarana' && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="mt-4 pt-3.5 border-t border-purple-200/80 w-full animate-fade-in"
                      >
                        <div className="p-3.5 bg-white/95 border border-purple-200 rounded-2xl space-y-3 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-600" />
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                                Penyelenggara Reklame Gedung (IPR)
                              </h5>
                              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                JakEVO PTSP
                              </span>
                            </div>

                            {/* Validity toggle */}
                            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSetPermitValidity('reklame', 'berlaku')}
                                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                  permitStates.reklame.validity !== 'habis'
                                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Izin Masih Berlaku
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetPermitValidity('reklame', 'habis')}
                                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                  permitStates.reklame.validity === 'habis'
                                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                Habis Masa Berlaku
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-snug">
                            Tentukan jenis prasarana reklame komersial yang Anda selenggarakan pada bangunan gedung:
                          </p>

                          {/* 3 Opsi Jenis Reklame dengan Cheklis */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              { jenis: 'Papan / Billboard' as const, label: 'Papan / Billboard', sub: 'Konstruksi fisik di halaman/atap gedung' },
                              { jenis: 'Megatron / Videotron / LED' as const, label: 'Megatron / Videotron / LED', sub: 'Layar digital & videotron pada fasad' },
                              { jenis: 'Neon Box / Signage' as const, label: 'Neon Box / Signage Fasad', sub: 'Signage nama tenant & logo iluminasi' }
                            ].map((opt) => {
                              const currentList = permitStates.reklame.reklameJenisList || (permitStates.reklame.reklameJenis ? [permitStates.reklame.reklameJenis] : ['Papan / Billboard']);
                              const isChecked = currentList.includes(opt.jenis);
                              return (
                                <div
                                  key={opt.jenis}
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleToggleReklameJenis(opt.jenis);
                                  }}
                                  className={`cursor-pointer flex items-start gap-2.5 p-2.5 rounded-xl border transition select-none ${
                                    isChecked
                                      ? 'bg-purple-50/70 border-purple-600 shadow-xs ring-2 ring-purple-200'
                                      : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/20'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                                    isChecked 
                                      ? 'bg-purple-600 border-purple-600 text-white' 
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                                      {opt.label}
                                    </span>
                                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                                      {opt.sub}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* File Upload for IPR */}
                          <div className="pt-2 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-purple-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                              <span className="font-semibold text-slate-700">Kepatuhan Pajak Reklame Bapenda DKI:</span>
                              <span className="text-slate-500 italic">Wajib SKPD &amp; SSPD berjalan</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {permitStates.reklame.fileName ? (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[150px]">
                                  {permitStates.reklame.fileName}
                                </span>
                              ) : null}
                              <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-purple-900 bg-purple-100 hover:bg-purple-200 rounded-lg cursor-pointer transition border border-purple-300">
                                <Upload className="w-3 h-3 text-purple-700" />
                                <span>{permitStates.reklame.fileName ? 'Ganti Berkas IPR' : 'Unggah IPR (Opsional)'}</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleItemUpload('reklame', e)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => {
                    if (ownershipRole === 'Hanya Pemilik Prasarana') {
                      setPermitStates(prev => ({
                        ...prev,
                        reklame: {
                          ...prev.reklame,
                          selected: true
                        }
                      }));
                    }
                    setScreen('step1');
                  }} 
                  className="w-full bg-[#0c406d] hover:bg-[#093256] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <span>Lanjutkan ke Langkah 1: Kenali Gedung Anda</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* SCREEN 2: TAHAP 1 (Fungsi Utama Bangunan Gedung)           */}
          {/* ========================================================= */}
          {screen === 'step1' && (
            <section className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setScreen('step0')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-700 transition cursor-pointer" title="Kembali ke Pemilihan Peran">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="font-bold text-slate-900 text-base">Self-Check Gedung</h2>
                </div>

                {/* Stepper: 1 Active */}
                <div className="flex items-center justify-center gap-3 py-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#0c406d] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-sky-100">1</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">2</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">3</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">4</div>
                </div>

                {/* Role Badge Indicator */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Status Pemohon:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      ownershipRole === 'Pemilik Gedung' 
                        ? 'bg-sky-100 text-[#0c406d] border border-sky-200' 
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {ownershipRole}
                    </span>
                  </div>
                  <button 
                    onClick={() => setScreen('step0')}
                    className="text-[#0c406d] font-bold hover:underline cursor-pointer text-[11px]"
                  >
                    Ubah
                  </button>
                </div>

                {/* Banner Mode Pemilik Prasarana */}
                {ownershipRole === 'Hanya Pemilik Prasarana' && (
                  <div className="mb-4 p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 flex items-start gap-2.5">
                    <Megaphone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Mode Penyelenggara Prasarana Aktif</span>
                      <span className="text-[11px] text-purple-900 leading-snug block mt-0.5">
                        Tentukan fungsi gedung tempat prasarana Anda terpasang, lalu sesuaikan cheklis jenis reklame (IPR) Anda pada panel di bawah.
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <span className="text-xs text-slate-500 font-medium">Langkah 1 dari 4</span>
                  <h3 className="font-bold text-slate-900 text-base">Kenali Gedung Anda</h3>
                  <p className="font-semibold text-slate-800 text-sm mt-2">Apa fungsi utama gedung Anda saat ini?</p>
                </div>

                {/* Pilihan Opsi Gedung */}
                <div className="space-y-2.5">
                  {[
                    { 
                      id: 'Perkantoran', 
                      label: 'Perkantoran', 
                      desc: 'Menara kantor komersial, gedung instansi & bisnis', 
                      icon: Building2, 
                      color: 'from-blue-600 to-indigo-700'
                    },
                    { 
                      id: 'Pusat perbelanjaan', 
                      label: 'Pusat perbelanjaan / Mall', 
                      desc: 'Mall gaya hidup, pusat pertokoan & ritel komersial', 
                      icon: Store, 
                      color: 'from-amber-500 to-orange-600'
                    },
                    { 
                      id: 'Hotel', 
                      label: 'Hotel & Penginapan', 
                      desc: 'Hotel bintang, kondotel & akomodasi komersial', 
                      icon: Bed, 
                      color: 'from-violet-600 to-purple-700'
                    },
                    { 
                      id: 'Apartemen', 
                      label: 'Apartemen & Hunian Vertikal', 
                      desc: 'Hunian bertingkat tinggi & kondominium', 
                      icon: Building, 
                      color: 'from-sky-500 to-cyan-600'
                    },
                    { 
                      id: 'Bangunan industri / pergudangan', 
                      label: 'Bangunan industri / pergudangan', 
                      desc: 'Pabrik manufaktur, logistik & gudang modern', 
                      icon: Factory,
                      color: 'from-slate-600 to-slate-800'
                    },
                    { 
                      id: 'Fungsi lainnya', 
                      label: 'Fungsi lainnya (Fasilitas Sosial/Umum)', 
                      desc: 'Rumah sakit, universitas, sarana olahraga/budaya', 
                      icon: MoreHorizontal,
                      color: 'from-teal-600 to-emerald-700'
                    }
                  ].map((item) => {
                    const isSelected = selectedBuilding === item.id;
                    const Icon = item.icon;
                    return (
                      <label 
                        key={item.id}
                        onClick={() => setSelectedBuilding(item.id)} 
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border-2 ${
                          isSelected 
                            ? 'border-[#0c406d] bg-blue-50/40 shadow-xs ring-2 ring-sky-200/50' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#0c406d]' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#0c406d]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-xs sm:text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                {item.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                          </div>
                        </div>

                        {/* 3D Isometric Icon Badge */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-sm border-t border-l border-white/40 border-b-2 border-r-2 border-black/20`}>
                          <Icon className="w-5 h-5 drop-shadow-sm" />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => {
                    if (ownershipRole === 'Hanya Pemilik Prasarana') {
                      setScreen('step3');
                    } else {
                      setScreen('step2');
                    }
                  }} 
                  className="w-full bg-[#0c406d] hover:bg-[#093256] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <span>{ownershipRole === 'Hanya Pemilik Prasarana' ? 'Lanjutkan ke Evaluasi Syarat IPR' : 'Lanjutkan ke Tahap 2'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 3: TAHAP 2 (Identifikasi Izin Eksisting + Upload Masing-Masing)      */}
          {/* ========================================================================= */}
          {screen === 'step2' && (
            <section className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setScreen('step1')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-700">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="font-bold text-slate-900 text-base">Self-Check Gedung</h2>
                </div>

                {/* Stepper: 1 Done, 2 Active */}
                <div className="flex items-center justify-center gap-3 py-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#0c406d] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-sky-100">2</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">3</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">4</div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Langkah 2 dari 4</span>
                    <span className="text-[11px] font-bold bg-sky-100 text-blue-900 px-2.5 py-0.5 rounded-full">
                      {selectedBuilding}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1">Identifikasi Izin Eksisting</h3>
                  <p className="font-semibold text-slate-800 text-xs mt-1.5 leading-snug">
                    Centang izin yang <span className="text-[#0c406d] font-bold">SUDAH DIMILIKI</span> gedung Anda saat ini. Izin yang tidak dicentang akan dievaluasi persyaratannya di Tahap 3:
                  </p>
                </div>

                {/* 5 Permit Items */}
                <div className="space-y-3">
                  {[
                    { key: 'slf', title: 'Sertifikat Laik Fungsi (SLF)', desc: 'Gedung sudah memiliki sertifikat kelaikan operasi berkala resmi.' },
                    { key: 'pbg', title: 'Persetujuan Bangunan Gedung (PBG / IMB)', desc: 'Memiliki surat izin konstruksi fisik & arsitektur resmi terdahulu.' },
                    { key: 'damkar', title: 'Proteksi Kebakaran (Damkar)', desc: 'Memiliki sertifikasi berkala instalasi proteksi kebakaran aktif/pasif.' },
                    { key: 'k3', title: 'Izin K3 Instalasi (Lift, Genset, Petir)', desc: 'Telah memiliki pengesahan riksa uji instalasi dari Disnakertrans DKI.' },
                    { key: 'env', title: 'Persetujuan Lingkungan & Andalalin', desc: 'Memiliki persetujuan teknis AMDAL/UKL-UPL dan rekomendasi lalu lintas.' }
                  ].map((item) => {
                    const state = permitStates[item.key];
                    const isDamkar = item.key === 'damkar';

                    return (
                      <div 
                        key={item.key}
                        className={`border rounded-2xl p-4 bg-white transition space-y-3.5 ${
                          state.selected 
                            ? 'border-[#0c406d] bg-blue-50/15 ring-1 ring-[#0c406d]/30 shadow-xs' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header kartu izin dengan checkbox kepemilikan */}
                        <div 
                          className="flex items-start gap-3 cursor-pointer select-none" 
                          onClick={() => togglePermitCard(item.key)}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition ${
                            state.selected ? 'bg-[#0c406d] border-[#0c406d]' : 'border-slate-300 bg-white'
                          }`}>
                            {state.selected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                              {state.selected && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border inline-flex items-center gap-1 self-start sm:self-auto ${
                                  state.validity === 'habis'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    state.validity === 'habis' ? 'bg-amber-600' : 'bg-emerald-600'
                                  }`} />
                                  <span>{state.validity === 'habis' ? 'Habis Masa Berlaku' : 'Masih Berlaku'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>

                        {/* Pilihan Masa Berlaku (Masing-Masing Izin Eksisting) */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Masa Berlaku Izin:</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Tombol Masih Berlaku */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPermitValidity(item.key, 'berlaku');
                              }}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer select-none ${
                                state.selected && (state.validity === 'berlaku' || !state.validity)
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                state.selected && (state.validity === 'berlaku' || !state.validity) ? 'bg-white' : 'bg-emerald-500'
                              }`} />
                              <span>Masih Berlaku</span>
                            </button>

                            {/* Tombol Habis Masa Berlaku */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPermitValidity(item.key, 'habis');
                              }}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer select-none ${
                                state.selected && state.validity === 'habis'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                state.selected && state.validity === 'habis' ? 'bg-white' : 'bg-amber-500'
                              }`} />
                              <span>Habis Masa Berlaku</span>
                            </button>
                          </div>
                        </div>

                        {/* Cheklis Dokumen Damkar: RKK dan SKK */}
                        {isDamkar && (
                          <div className="p-2.5 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-white border border-amber-200/90 rounded-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Cheklis RKK */}
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleDamkarDoc('damkarRkk');
                                }}
                                className={`cursor-pointer flex items-start gap-2.5 p-2.5 rounded-xl border transition select-none ${
                                  state.damkarRkk
                                    ? 'bg-white border-rose-500 shadow-xs ring-2 ring-rose-200'
                                    : 'bg-white/90 border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!state.damkarRkk}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-0 mt-0.5 cursor-pointer accent-rose-600 pointer-events-none"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-xs font-bold text-slate-900">RKK</span>
                                    <span className="text-[9px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                                      Rekomendasi
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                                    Rekomendasi Keselamatan Kebakaran (Tahap Rencana / Konstruksi)
                                  </span>
                                </div>
                              </div>

                              {/* Cheklis SKK */}
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleDamkarDoc('damkarSkk');
                                }}
                                className={`cursor-pointer flex items-start gap-2.5 p-2.5 rounded-xl border transition select-none ${
                                  state.damkarSkk
                                    ? 'bg-white border-rose-500 shadow-xs ring-2 ring-rose-200'
                                    : 'bg-white/90 border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!state.damkarSkk}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-0 mt-0.5 cursor-pointer accent-rose-600 pointer-events-none"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-xs font-bold text-slate-900">SKK</span>
                                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                      Sertifikat
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                                    Sertifikat Keselamatan Kebakaran (Tahap Pemanfaatan Gedung)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* File Upload Section */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-600 font-medium">Unggah Berkas Bukti Izin (Opsional)</span>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#0c406d] bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer transition border border-sky-200">
                              <Upload className="w-3 h-3" />
                              <span>Unggah Dokumen</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleItemUpload(item.key, e)} 
                              />
                            </label>
                          </div>

                          {state.fileName && (
                            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in">
                              <span className="text-[11px] text-slate-700 font-mono truncate max-w-[280px]">
                                {state.fileName}
                              </span>
                              <button 
                                type="button" 
                                onClick={(e) => removeItemUpload(item.key, e)} 
                                className="text-slate-400 hover:text-rose-500 p-0.5 transition"
                                title="Hapus file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setScreen('step3')} 
                  className="w-full bg-[#0c406d] hover:bg-[#093256] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
                >
                  <span>Lanjutkan ke Tahap 3 (Evaluasi Syarat)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 4: TAHAP 3 (Dinamis: Cek Kesiapan Syarat Izin yang Belum Dimiliki)   */}
          {/* ========================================================================= */}
          {screen === 'step3' && (
            <section className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setScreen(ownershipRole === 'Hanya Pemilik Prasarana' ? 'step1' : 'step2')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer" title="Kembali">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="font-bold text-slate-900 text-base">Self-Check Gedung</h2>
                </div>

                {/* Stepper: 1 & 2 Done, 3 Active */}
                <div className="flex items-center justify-center gap-3 py-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#0c406d] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-sky-100">3</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-xs">4</div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Langkah 3 dari 4</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      missingPermitKeys.length === 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {missingPermitKeys.length === 0 ? 'Semua Izin Terpenuhi' : `${missingPermitKeys.length} Izin Perlu Diurus`}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1">Cek Kesiapan Syarat Teknis</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">
                    {missingPermitKeys.length === 0 
                      ? 'Seluruh izin dasar telah dicentang. Silakan verifikasi kelengkapan berkas Anda:'
                      : 'Berdasarkan isian Tahap 2, izin berikut belum dimiliki gedung Anda. Berikan tanda centang pada persyaratan yang SUDAH SIAP / TERSEDIA:'}
                  </p>
                </div>

                {/* Dynamic List */}
                <div className="space-y-4">
                  {missingPermitKeys.length === 0 ? (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                        <Award className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">Luar Biasa! Semua Izin Dasar Terpenuhi</h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                        Gedung Anda telah memiliki seluruh izin dasar yang dipersyaratkan. Pastikan jadwal perpanjangan berkala tetap diawasi sebelum masa berlaku habis.
                      </p>
                    </div>
                  ) : (
                    missingPermitKeys.map((key) => {
                      const req = requirementDatabase[key];
                      if (!req) return null;
                      const Icon = req.icon;
                      const currentPrepared = preparedRequirements[key] || {};

                      const totalItems = req.groups 
                        ? req.groups.reduce((acc, g) => acc + g.items.length, 0)
                        : req.questions.length;

                      const countAda = req.groups
                        ? req.groups.reduce((acc, g, gIdx) => 
                            acc + g.items.filter((_, iIdx) => currentPrepared[`${gIdx}_${iIdx}`] === 'ada' || currentPrepared[`${gIdx}_${iIdx}`] === true).length, 0)
                        : req.questions.filter((_, idx) => currentPrepared[idx] === 'ada' || currentPrepared[idx] === true).length;

                      const countTidakAda = req.groups
                        ? req.groups.reduce((acc, g, gIdx) => 
                            acc + g.items.filter((_, iIdx) => currentPrepared[`${gIdx}_${iIdx}`] === 'tidak_ada').length, 0)
                        : req.questions.filter((_, idx) => currentPrepared[idx] === 'tidak_ada').length;

                      return (
                        <div key={key} className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white shadow-xs space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0c406d] flex items-center justify-center shrink-0 border border-sky-100 shadow-2xs">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">{req.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {totalItems} item persyaratan • Berikan centang Ada atau Tidak Ada pada setiap dokumen:
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Ada: {countAda}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                Tidak Ada: {countTidakAda}
                              </span>
                            </div>
                          </div>

                          {/* Jika ada pengelompokan resmi (seperti SIMBG PBG) */}
                          {req.groups ? (
                            <div className="space-y-3.5">
                              {req.groups.map((group, gIdx) => (
                                <div key={gIdx} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#0c406d]" />
                                      <h5 className="text-xs font-bold text-[#0c406d] uppercase tracking-wide">
                                        {group.groupTitle}
                                      </h5>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      {group.items.length} Persyaratan
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {group.items.map((itemText, iIdx) => {
                                      const itemKey = `${gIdx}_${iIdx}`;
                                      const currentStatus = currentPrepared[itemKey];

                                      return (
                                        <div 
                                          key={iIdx}
                                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border bg-white hover:bg-slate-50/70 transition border-slate-200 shadow-2xs"
                                        >
                                          <div className="flex items-start gap-2.5 flex-1 pr-2">
                                            <span className="w-5 h-5 rounded-full bg-sky-50 text-[#0c406d] border border-sky-100 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                              {iIdx + 1}
                                            </span>
                                            <span className={`text-xs leading-snug whitespace-pre-line ${
                                              currentStatus === 'ada' || currentStatus === true
                                                ? 'font-bold text-slate-900' 
                                                : currentStatus === 'tidak_ada'
                                                ? 'font-medium text-slate-600'
                                                : 'text-slate-700'
                                            }`}>
                                              {itemText}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                            {/* Opsi ADA */}
                                            <button
                                              type="button"
                                              onClick={() => handleSetRequirementStatus(key, itemKey, 'ada')}
                                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition select-none cursor-pointer ${
                                                currentStatus === 'ada' || currentStatus === true
                                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={currentStatus === 'ada' || currentStatus === true}
                                                readOnly
                                                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600 pointer-events-none"
                                              />
                                              <span>Ada</span>
                                            </button>

                                            {/* Opsi TIDAK ADA */}
                                            <button
                                              type="button"
                                              onClick={() => handleSetRequirementStatus(key, itemKey, 'tidak_ada')}
                                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition select-none cursor-pointer ${
                                                currentStatus === 'tidak_ada'
                                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={currentStatus === 'tidak_ada'}
                                                readOnly
                                                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-0 cursor-pointer accent-rose-600 pointer-events-none"
                                              />
                                              <span>Tidak Ada</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Flat list untuk perizinan lainnya */
                            <div className="space-y-2">
                              {req.questions.map((q, idx) => {
                                const currentStatus = currentPrepared[idx];
                                return (
                                  <div 
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border bg-white hover:bg-slate-50/70 transition border-slate-200 shadow-2xs"
                                  >
                                    <div className="flex items-start gap-2.5 flex-1 pr-2">
                                      <span className="w-5 h-5 rounded-full bg-sky-50 text-[#0c406d] border border-sky-100 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <span className={`text-xs leading-snug ${
                                        currentStatus === 'ada' || currentStatus === true
                                          ? 'font-bold text-slate-900' 
                                          : currentStatus === 'tidak_ada'
                                          ? 'font-medium text-slate-600'
                                          : 'text-slate-700'
                                      }`}>
                                        {q}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                      {/* Opsi ADA */}
                                      <button
                                        type="button"
                                        onClick={() => handleSetRequirementStatus(key, idx, 'ada')}
                                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition select-none cursor-pointer ${
                                          currentStatus === 'ada' || currentStatus === true
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={currentStatus === 'ada' || currentStatus === true}
                                          readOnly
                                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600 pointer-events-none"
                                        />
                                        <span>Ada</span>
                                      </button>

                                      {/* Opsi TIDAK ADA */}
                                      <button
                                        type="button"
                                        onClick={() => handleSetRequirementStatus(key, idx, 'tidak_ada')}
                                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition select-none cursor-pointer ${
                                          currentStatus === 'tidak_ada'
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={currentStatus === 'tidak_ada'}
                                          readOnly
                                          className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-0 cursor-pointer accent-rose-600 pointer-events-none"
                                        />
                                        <span>Tidak Ada</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setScreen('result')} 
                  className="w-full bg-[#0c406d] hover:bg-[#093256] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
                >
                  <span>Lihat Ringkasan Hasil Evaluasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* SCREEN 5: HASIL SELF-CHECK & KENDALI KONDISI GEDUNG        */}
          {/* ========================================================= */}
          {screen === 'result' && (
            <section className="flex-1 flex flex-col justify-between animate-fade-in">
              <div>
                {/* Result Header with 3D/4D Blueprint styling */}
                <div className="relative rounded-2xl overflow-hidden mb-4 border border-blue-200/80 shadow-xs bg-gradient-to-r from-slate-900 via-[#0c406d] to-slate-900 p-4 text-white">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md border-t border-l border-white/40 border-b-2 border-r-2 border-black/20 shrink-0">
                      <ShieldCheck className="w-6 h-6 text-emerald-300 drop-shadow-sm" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-sky-300 bg-sky-950/70 px-2 py-0.5 rounded-full border border-sky-400/30">
                        Evaluasi Kelaikan Bangunan 4D
                      </span>
                      <h2 className="font-extrabold text-white text-base leading-tight mt-1">
                        Hasil Self-Check Gedung Anda
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Building Profile Summary Card */}
                <div className="bg-gradient-to-r from-blue-50/80 to-white border border-blue-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 mb-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0c406d] to-sky-700 flex items-center justify-center text-white shrink-0 shadow-sm border-t border-l border-white/40 border-b-2 border-r-2 border-black/20">
                    <Building2 className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{buildingName}</h3>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded shrink-0">
                        NIB: {currentUser.nib || '0123456789012'}
                      </span>
                    </div>
                    <p className="text-xs text-[#0c406d] font-semibold">{selectedBuilding}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.address || 'Kec. Kebayoran Baru, Jakarta Selatan'}</p>
                  </div>
                </div>

                {/* Ringkasan Kondisi Evaluasi */}
                <div className="mb-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center justify-between">
                    <span>Ringkasan Evaluasi Kelaikan</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Status Terverifikasi
                    </span>
                  </h3>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                        <span className="text-slate-700">Profil &amp; Legalitas Gedung:</span>
                      </div>
                      <strong className="text-slate-900">Lengkap</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                        <span className="text-slate-700">Izin Sudah Dimiliki:</span>
                      </div>
                      <strong className="text-emerald-700">{ownedPermitsCount} dari {totalPermitsCount} Izin</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                          !
                        </div>
                        <span className="text-slate-700">Perlu Pengurusan Izin Baru:</span>
                      </div>
                      <strong className="text-amber-700">{missingPermitKeys.length} Perizinan</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          📄
                        </div>
                        <span className="text-slate-700">Dokumen Terunggah:</span>
                      </div>
                      <strong className="text-blue-700">{uploadedFilesCount} berkas digital</strong>
                    </div>
                  </div>
                </div>

                {/* Langkah Berikutnya Sesuai Hasil */}
                <div className="mb-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <h3 className="font-bold text-slate-900 text-xs mb-2.5">Langkah Pendampingan Berikutnya</h3>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-sky-200 text-blue-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <p className="leading-snug">Lengkapi berkas teknis yang masih bertanda silang pada formulir evaluasi kelaikan.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-sky-200 text-blue-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <p className="leading-snug">Siapkan dokumen pendukung fisik/digital sesuai checklist resmi PTSP Jakarta Selatan.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-sky-200 text-blue-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <p className="leading-snug">Jadwalkan pendampingan langsung dengan tim teknis PTSP jika ada kendala pengurusan.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button 
                  onClick={() => setShowConsultationModal(true)} 
                  className="w-full bg-[#0c406d] hover:bg-[#093256] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ajukan Pendampingan PTSP Jakarta Selatan</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => window.print()} 
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-xs"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Unduh Resume (PDF)</span>
                  </button>

                  <button 
                    onClick={() => setScreen('step1')} 
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-xs"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span>Ulangi Self-Check</span>
                  </button>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* ==================== BOTTOM NAVBAR ==================== */}
        <nav className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-around z-20">
          <button 
            onClick={() => setScreen('home')} 
            className={`flex flex-col items-center gap-1 transition ${
              screen === 'home' ? 'text-[#0c406d]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Beranda</span>
          </button>

          <button 
            onClick={() => setShowGuideModal(true)} 
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px]">Panduan</span>
          </button>

          <button 
            onClick={() => setShowContactModal(true)} 
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[11px]">Kontak</span>
          </button>
        </nav>

      </div>

        {/* Right Column: Desktop Building Control & Inspection Desk */}
        <div className="hidden lg:flex lg:flex-col lg:col-span-5 xl:col-span-5 2xl:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  Profil Bangunan Gedung
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{buildingName}</h3>
                <p className="text-xs text-slate-500 font-medium">{currentUser.companyName || 'PT Pengelola Gedung Jaksel'}</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                NIB: {currentUser.nib || '0123456789012'}
              </span>
            </div>
          </div>

          {/* Card 2: Live Status Kepatuhan Dokumen Pokok */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Status {totalPermitsCount} Izin Eksisting Gedung</h4>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                ownedPermitsCount >= 5 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : ownedPermitsCount >= 3 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {ownedPermitsCount} / {totalPermitsCount} Terpenuhi
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {[
                { name: 'Sertifikat Laik Fungsi (SLF)', state: permitStates.slf },
                { name: 'Persetujuan Bangunan Gedung (PBG/IMB)', state: permitStates.pbg },
                { 
                  name: `Proteksi Kebakaran (Damkar)${
                    permitStates.damkar?.selected && (permitStates.damkar?.damkarRkk || permitStates.damkar?.damkarSkk)
                      ? ` [${[permitStates.damkar.damkarRkk && 'RKK', permitStates.damkar.damkarSkk && 'SKK'].filter(Boolean).join(', ')}]`
                      : ''
                  }`, 
                  state: permitStates.damkar 
                },
                { name: 'Izin K3 Instalasi (Lift & Genset)', state: permitStates.k3 },
                { name: 'Persetujuan Lingkungan & Andalalin', state: permitStates.env },
                {
                  name: `Izin Penyelenggaraan Reklame (IPR)${
                    permitStates.reklame?.selected && permitStates.reklame?.reklameJenis
                      ? ` [${permitStates.reklame.reklameJenis}]`
                      : ''
                  }`,
                  state: permitStates.reklame
                }
              ].map((item, idx) => {
                const isOwned = item.state?.selected;
                const isHabis = item.state?.validity === 'habis';
                return (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-150">
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        !isOwned ? 'bg-slate-300' : isHabis ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className={`truncate ${isOwned ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{item.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${
                      !isOwned 
                        ? 'bg-slate-200/70 text-slate-500 border-slate-200' 
                        : isHabis 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {!isOwned ? 'Perlu Diisi' : isHabis ? 'Habis Masa Berlaku' : 'Masih Berlaku'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Fasilitasi Pendampingan Langsung Tim Teknis PTSP */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0c406d] to-slate-900 text-white rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 border-t border-l border-white/40 border-b-2 border-r-2 border-black/20 shadow-md">
                <ClipboardCheck className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 bg-white/10 px-2 py-0.5 rounded-full">
                  Unit Pengelola PTSP Jaksel
                </span>
                <h4 className="text-sm font-bold text-white mt-1">Butuh Bantuan Pengurusan Izin?</h4>
                <p className="text-xs text-blue-100/80 leading-relaxed mt-0.5">
                  Tim teknis kami siap mendampingi proses pemenuhan kelaikan fungsi gedung secara gratis.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowConsultationModal(true)}
                className="w-full py-2.5 px-4 bg-white text-[#0c406d] font-bold rounded-xl text-xs hover:bg-blue-50 transition shadow-sm text-center flex items-center justify-center space-x-1.5"
              >
                <span>Ajukan Pendampingan</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORM PENGAJUAN PENDAMPINGAN PTSP JAKSEL                          */}
      {/* ========================================================================= */}
      {showConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-blue-100 text-[#0c406d]">
                  <Headphones className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Permohonan Pendampingan PTSP</h3>
                  <p className="text-xs text-slate-500">Unit Pengelola PTSP Kota Jakarta Selatan</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowConsultationModal(false);
                  setConsultationSuccessData(null);
                }} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {consultationSuccessData ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Permohonan Berhasil Diajukan!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Data permohonan telah diteruskan ke data <strong className="text-[#0c406d]">User Monitoring PTSP</strong> untuk dilakukan verifikasi dokumen teknis dan konfirmasi jadwal asistensi.
                </p>

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Status: Menunggu Verifikasi Tim Monitoring</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor Registrasi:</span>
                    <strong className="text-[#0c406d]">{consultationSuccessData.refNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Rencana:</span>
                    <strong className="text-slate-800">{consultationSuccessData.date}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode:</span>
                    <strong className="text-slate-800 truncate max-w-[180px]">{consultationSuccessData.method}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowConsultationModal(false);
                    setConsultationSuccessData(null);
                  }}
                  className="w-full py-2.5 bg-[#0c406d] text-white rounded-xl text-xs font-bold hover:bg-[#083053] transition"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gedung &amp; Perusahaan Pemohon:
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${buildingName} - ${currentUser.companyName || 'PT Pengelola'}`} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Kontak PIC <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={consultationForm.picName}
                      onChange={(e) => setConsultationForm({ ...consultationForm, picName: e.target.value })}
                      placeholder="Nama lengkap PIC"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0c406d]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      No. WhatsApp / HP <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={consultationForm.phone}
                      onChange={(e) => setConsultationForm({ ...consultationForm, phone: e.target.value })}
                      placeholder="0812-XXXX-XXXX"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0c406d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilihan Metode Konsultasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={consultationForm.method}
                    onChange={(e) => setConsultationForm({ ...consultationForm, method: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0c406d] bg-white"
                  >
                    <option value="Tatap Muka di PTSP Jaksel (Kantor Walikota)">Tatap Muka di PTSP Jaksel (Kantor Walikota)</option>
                    <option value="Konsultasi Daring (Online Zoom Meeting)">Konsultasi Daring (Online Zoom Meeting)</option>
                    <option value="Permohonan Asistensi Kunjungan Lapangan">Permohonan Asistensi Kunjungan Lapangan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Rencana Konsultasi <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={consultationForm.date}
                    onChange={(e) => setConsultationForm({ ...consultationForm, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0c406d]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kendala / Dokumen yang Perlu Diasistensi:
                  </label>
                  <textarea 
                    rows={2}
                    value={consultationForm.notes}
                    onChange={(e) => setConsultationForm({ ...consultationForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0c406d]"
                    placeholder="Tuliskan kendala teknis atau izin yang ingin dikonsultasikan..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setShowConsultationModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#0c406d] hover:bg-[#083053] text-white rounded-lg font-bold shadow-md shadow-[#0c406d]/20 transition flex items-center space-x-1.5"
                  >
                    <span>Kirim Permohonan</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PANDUAN REGULASI GEDUNG                                          */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-sky-100 text-[#0c406d]">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Panduan &amp; Dasar Hukum</h3>
                  <p className="text-xs text-slate-500">Regulasi Bangunan Gedung DKI Jakarta</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 max-h-96 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">1. Sertifikat Laik Fungsi (SLF)</h4>
                <p className="text-[11px] leading-relaxed">
                  Berdasarkan <strong>PP No. 16 Tahun 2021</strong> dan <strong>Pergub DKI No. 118 Tahun 2020</strong>, setiap bangunan gedung wajib memiliki SLF sebelum dimanfaatkan dan diperpanjang setiap 5 tahun sekali untuk menjamin kelaikan struktur, keselamatan, dan tata ruang.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">2. Proteksi Kebakaran (Damkar)</h4>
                <p className="text-[11px] leading-relaxed">
                  Sistem proteksi aktif (sprinkler, hydrant, alarm) dan pasif (fire door, kompartemen) wajib diuji kelayakannya secara berkala melalui rekomendasi Dinas Penanggulangan Kebakaran &amp; Penyelamatan DKI Jakarta.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">3. Keselamatan &amp; Kesehatan Kerja (K3)</h4>
                <p className="text-[11px] leading-relaxed">
                  Peralatan instalasi penunjang gedung seperti lift penumpang, elevator, instalasi penyalur petir, dan genset wajib menjalani riksa uji tahunan oleh PJK3 dan disahkan oleh Disnakertrans.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">4. Kepatuhan LKPM Terintegrasi</h4>
                <p className="text-[11px] leading-relaxed">
                  Selain kelaikan fisik gedung, badan usaha pengelola gedung wajib menyampaikan Laporan Kegiatan Penanaman Modal (LKPM) melalui portal OSS-RBA secara berkala tiap triwulan.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-[#0c406d] text-white rounded-xl text-xs font-bold hover:bg-[#083053]"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONTAK & LAYANAN PTSP JAKSEL                                     */}
      {/* ========================================================================= */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Phone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kontak Layanan PTSP</h3>
                  <p className="text-xs text-slate-500">Unit Pengelola PTSP Kota Jakarta Selatan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowContactModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Kantor Pelayanan Terpadu Satu Pintu:</strong>
                  <span>Kantor Walikota Jakarta Selatan, Blok A Lantai 1, Jl. Prapanca Raya No. 9, Kebayoran Baru, Jakarta Selatan 12170</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Call Center &amp; Hotline Pendampingan:</strong>
                  <span className="text-emerald-700 font-bold text-sm tracking-wide">1500164</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <Mail className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Email Layanan Asistensi:</strong>
                  <span className="text-sky-700 font-semibold font-mono">ptspjs@gmail.com</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                <strong>Jam Operasional Layanan:</strong>
                <p className="mt-0.5">Senin – Jumat: 07.30 – 16.00 WIB (Kecuali Hari Libur Nasional)</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-5 py-2 bg-[#0c406d] text-white rounded-xl text-xs font-bold hover:bg-[#083053]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PHOTO LIGHTBOX VIEWER (High-Res Architectural Gallery)            */}
      {/* ========================================================================= */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">{activePhotoModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activePhotoModal.subtitle}</p>
              </div>
              <button 
                onClick={() => setActivePhotoModal(null)} 
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Image Display */}
            <div className="relative max-h-[70vh] overflow-hidden flex items-center justify-center bg-black">
              <img 
                src={activePhotoModal.url} 
                alt={activePhotoModal.title} 
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[70vh] object-contain" 
              />
            </div>

            {/* Modal Footer with Info */}
            <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Dokumentasi Resmi PTSP Jakarta Selatan</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FULLSCREEN 4D DIGITAL TWIN SIMULATOR                              */}
      {/* ========================================================================= */}
      {show4DFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-700 shadow-2xl relative flex flex-col my-auto">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Simulator 4D Digital Twin Gedung - Layar Penuh</h3>
                  <p className="text-xs text-slate-400">{buildingName} • Pengawasan Kelaikan Bangunan PTSP Jaksel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow4DFullscreen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <Building4DViewer
                buildingName={buildingName}
                buildingType={selectedBuilding}
                companyName={currentUser.companyName}
                nib={currentUser.nib}
                address={currentUser.address}
                permitStates={permitStates}
                onOpenConsultation={() => {
                  setShow4DFullscreen(false);
                  setShowConsultationModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PANDUAN CARA UPLOAD KE HOSTINGER (ANTI-GAGAL)                     */}
      {/* ========================================================================= */}
      {showHostingerGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cara Upload ke Hostinger (Anti-Gagal)</h3>
                  <p className="text-xs text-slate-500">Solusi tepat agar tidak muncul pesan error framework</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHostingerGuideModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Box menjelaskan penyebab error di screenshot */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
              <strong className="text-rose-900 block font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Penyebab Muncul Error di Hostinger:</span>
              </strong>
              <p className="text-rose-700 leading-relaxed">
                Anda menggunakan menu <em>"Upload file backup website"</em> (yang hanya khusus backup WordPress/cPanel/SQL). Jangan gunakan menu tersebut!
              </p>
            </div>

            {/* Langkah Benar */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 text-sm">Gunakan Cara Ini (Pasti Berhasil):</h4>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#0c406d] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-slate-900 block">Unduh file dist.zip</strong>
                    <span className="text-slate-600">Klik tombol <strong>"Ekspor Build (dist.zip)"</strong> di header aplikasi ini.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#0c406d] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-slate-900 block">Buka File Manager di Hostinger</strong>
                    <span className="text-slate-600">Masuk ke hPanel Hostinger &gt; pilih menu <strong>File Manager (Manajer Berkas)</strong> &gt; buka folder <strong>public_html</strong>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#0c406d] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-slate-900 block">Upload file dist.zip ke dalam public_html</strong>
                    <span className="text-slate-600">Gunakan tombol upload di pojok File Manager Hostinger dan pilih file <code>dist.zip</code>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#0c406d] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-slate-900 block">Ekstrak file dist.zip</strong>
                    <span className="text-slate-600">Klik kanan file <code>dist.zip</code> di File Manager Hostinger lalu klik <strong>Extract</strong>. Pastikan file <code>index.html</code> dan folder <code>assets/</code> berada langsung di dalam folder <code>public_html</code>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="block font-bold">Selesai! Website Langsung Aktif</strong>
                    <span className="text-emerald-700">Buka domain website Anda di browser. Semua fitur bekerja 100%!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <a
                href="/dist.zip"
                download="dist_hostinger.zip"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0c406d] text-white font-bold rounded-xl text-xs hover:bg-[#083053] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh dist.zip Sekarang</span>
              </a>
              <button 
                type="button" 
                onClick={() => setShowHostingerGuideModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

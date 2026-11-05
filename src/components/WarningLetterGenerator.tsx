import React, { useState, useEffect } from 'react';
import { 
  FileWarning, 
  Printer, 
  Download, 
  Mail, 
  CheckCircle2, 
  Edit3, 
  ShieldAlert, 
  Building2, 
  QrCode, 
  Save, 
  Sparkles,
  Plus,
  Trash2,
  FileSpreadsheet,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { WarningLetter, WarningLetterItem, Permit, LKPMRecord, Company, UserRole } from '../types';
import { formatIndonesianDate, calculateDaysRemaining } from '../utils/helpers';

interface WarningLetterGeneratorProps {
  companies: Company[];
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  savedLetters: WarningLetter[];
  currentUserRole?: UserRole;
  initialItem?: { type: 'PERMIT' | 'LKPM' | 'DUAL_VIOLATION'; record: any } | null;
  onSaveLetter: (letter: WarningLetter) => void;
  onSendEmailWithLetter: (letter: WarningLetter) => void;
}

export const WarningLetterGenerator: React.FC<WarningLetterGeneratorProps> = ({
  companies,
  permits,
  lkpmRecords,
  savedLetters,
  currentUserRole = 'koordinator',
  initialItem,
  onSaveLetter,
  onSendEmailWithLetter
}) => {
  // Mode Edit toggle
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

  // Core Letter State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [letterType, setLetterType] = useState<WarningLetter['type']>('Surat Peringatan Tertulis Terpadu (Izin Kedaluwarsa & Keterlambatan LKPM)');
  const [urgency, setUrgency] = useState<WarningLetter['urgency']>('Sangat Segera / Mendesak');
  const [letterNumber, setLetterNumber] = useState<string>('');
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [letterCity, setLetterCity] = useState<string>('Jakarta');
  
  // Kop Surat & Instansi
  const [senderOrganization, setSenderOrganization] = useState<string>('BADAN PENGAWAS KEPATUHAN & REGULASI PERIZINAN USAHA');
  const [kopSubtitle, setKopSubtitle] = useState<string>('DIREKTORAT INTEGRITAS KEPATUHAN & AUDIT REGULASI PERIZINAN USAHA');
  const [kopAddress, setKopAddress] = useState<string>('Gedung Menara Kepatuhan Lt. 14, Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan 12190');
  const [kopContact, setKopContact] = useState<string>('Telepon: (021) 5299-1000 | Email: kepatuhan.audit@oss-compliance.go.id | Laman: www.kepatuhanplus.id');

  // Recipient / Company Details (Fully editable)
  const [recipientName, setRecipientName] = useState<string>('Andri Wicaksono');
  const [recipientRole, setRecipientRole] = useState<string>('Direktur Kepatuhan & Hubungan Korporasi');
  const [recipientEmail, setRecipientEmail] = useState<string>('andri.cimb@gmail.com');
  const [companyName, setCompanyName] = useState<string>('PT Nusantara Petrokimia Raya');
  const [companyNIB, setCompanyNIB] = useState<string>('1289000452109');
  const [companyAddress, setCompanyAddress] = useState<string>('Kawasan Industri Cilegon Kav. B-12, Cilegon, Banten');

  // Letter Subject & Body
  const [subjectTitle, setSubjectTitle] = useState<string>('SURAT PERINGATAN RESMI TERPADU: KEDALUWARSA PERIZINAN BERUSAHA DAN KETERLAMBATAN PENYAMPAIAN LKPM BKPM');
  const [openingText, setOpeningText] = useState<string>(
    'Merujuk pada hasil evaluasi komparasi kepatuhan terpadu berbasis Nomor Induk Berusaha (NIB) melalui Sistem Pengawasan Perizinan Berusaha Terintegrasi OSS-RBA, serta berdasarkan ketentuan perundang-undangan:'
  );
  
  // Legal Basis List
  const [legalBases, setLegalBases] = useState<string[]>([
    'Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja menjadi Undang-Undang',
    'Peraturan Pemerintah Nomor 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko (Khususnya Pengawasan Perizinan & Sanksi Administratif)',
    'Peraturan Badan Koordinasi Penanaman Modal (BKPM) Nomor 5 Tahun 2021 tentang Pedoman dan Tata Cara Pengawasan Perizinan Berusaha Berbasis Risiko'
  ]);

  // Selected violation items to attach (Fully editable rows)
  const [selectedItems, setSelectedItems] = useState<WarningLetterItem[]>([]);
  
  // Deadline & Sanctions
  const [deadlineDays, setDeadlineDays] = useState<number>(5);
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    'Kelalaian ganda dalam menindaklanjuti perpanjangan perizinan berusaha dan pelaporan LKPM dalam batas waktu 5 (lima) hari kerja akan berakibat pada penerbitan sanksi administratif berjenjang, penangguhan hak akses akun OSS, pembekuan fasilitas kepabeanan, serta penghentian sementara operasional lini produksi.'
  );
  const [closingText, setClosingText] = useState<string>(
    'Demikian Surat Teguran Resmi Terpadu ini disampaikan untuk menjadi perhatian serius dan dilaksanakan dengan penuh tanggung jawab demi kepatuhan hukum dan kelancaran kegiatan berusaha.'
  );

  // Signatory
  const [signatoryName, setSignatoryName] = useState<string>('Prof. Dr. Ir. Danang Supriyanto, S.H., M.H.');
  const [signatoryTitle, setSignatoryTitle] = useState<string>('Kepala Divisi Audit Kepatuhan & Regulasi Perizinan');
  const [signatoryNIP, setSignatoryNIP] = useState<string>('19780512 200212 1 002');

  // Carbon copies (Tembusan)
  const [copies, setCopies] = useState<string[]>([
    'Menteri Investasi / Kepala Badan Koordinasi Penanaman Modal (BKPM) RI;',
    'Gubernur / Kepala Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP) Terkait;',
    'Dewan Komisaris dan Manajemen Eksekutif Perusahaan;',
    'Pertinggal / Arsip Pengawasan Kepatuhan Hukum.'
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Handle incoming initialItem (e.g. from NIB comparison)
  useEffect(() => {
    if (initialItem) {
      if (initialItem.type === 'DUAL_VIOLATION') {
        const targetComp = initialItem.record.company || initialItem.record;
        if (targetComp?.id) {
          setSelectedCompanyId(targetComp.id);
        }
        applyPreset('DUAL_VIOLATION');
      } else if (initialItem.type === 'PERMIT') {
        setSelectedCompanyId(initialItem.record.companyId);
        applyPreset('EXPIRED_PERMIT');
      } else if (initialItem.type === 'LKPM') {
        setSelectedCompanyId(initialItem.record.companyId);
        applyPreset('LKPM_OVERDUE');
      }
    }
  }, [initialItem]);

  // Generate Letter Number on mount or change
  useEffect(() => {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const curMonth = romanMonths[new Date().getMonth()];
    const curYear = new Date().getFullYear();
    setLetterNumber(`${randomSeq}/CORP-AUDIT/ST-TERPADU/${curMonth}/${curYear}`);
  }, [selectedCompanyId, letterType]);

  // Update defaults when company changes
  useEffect(() => {
    if (selectedCompany) {
      setCompanyName(selectedCompany.name);
      setCompanyNIB(selectedCompany.nib);
      setCompanyAddress(selectedCompany.address);
      setRecipientName(selectedCompany.picName);
      setRecipientEmail(selectedCompany.picEmail);
    }
  }, [selectedCompanyId]);

  // Populate items when company changes or initialItem is passed
  useEffect(() => {
    if (!selectedCompany) return;

    // Filter relevant permits for this company that are expired or <60 days
    const relevantPermits = permits
      .filter((p) => p.companyId === selectedCompany.id || (p.nib && p.nib === selectedCompany.nib))
      .filter((p) => calculateDaysRemaining(p.expiryDate) <= 60);

    // Filter relevant LKPM for this company that are Belum Lapor
    const relevantLKPM = lkpmRecords
      .filter((l) => l.companyId === selectedCompany.id || l.nib === selectedCompany.nib)
      .filter((l) => l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan');

    const generatedItems: WarningLetterItem[] = [];

    relevantPermits.forEach((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      generatedItems.push({
        itemType: 'PERMIT',
        itemName: `Perizinan: ${p.permitName}`,
        referenceNumber: p.documentNumber,
        deadlineOrExpiry: p.expiryDate,
        daysRemainingOrOverdue: days,
        legalBasis: 'PP No. 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko',
        actionRequired: days < 0 
          ? 'Dokumen telah KEDALUWARSA. Wajib melakukan perpanjangan izin dan mengajukan pembaruan ke instansi berwenang.'
          : `Masa berlaku tersisa ${days} hari. Segera selesaikan persyaratan administrasi dan perpanjangan izin.`
      });
    });

    relevantLKPM.forEach((l) => {
      const days = calculateDaysRemaining(l.deadlineDate);
      generatedItems.push({
        itemType: 'LKPM',
        itemName: `Kewajiban LKPM: Penyampaian ${l.period} ${l.year} (KBLI ${l.kbliCode})`,
        referenceNumber: `OSS-LKPM-${l.kbliCode}-${l.period}`,
        deadlineOrExpiry: l.deadlineDate,
        daysRemainingOrOverdue: days,
        legalBasis: 'Pasal 32 Peraturan BKPM No. 5 Tahun 2021',
        actionRequired: 'Segera input realisasi investasi modal dan submit laporan pada portal oss.go.id.'
      });
    });

    setSelectedItems(generatedItems);
  }, [selectedCompanyId, permits, lkpmRecords]);

  // Handle Presets
  const applyPreset = (type: 'EXPIRED_PERMIT' | 'LKPM_OVERDUE' | 'FULL_COMPLIANCE' | 'DUAL_VIOLATION') => {
    if (type === 'DUAL_VIOLATION') {
      setLetterType('Surat Peringatan Tertulis Terpadu (Izin Kedaluwarsa & Keterlambatan LKPM)');
      setUrgency('Sangat Segera / Mendesak');
      setDeadlineDays(5);
      setSubjectTitle('SURAT PERINGATAN RESMI TERPADU: KEDALUWARSA PERIZINAN BERUSAHA DAN KETERLAMBATAN PENYAMPAIAN LKPM BKPM');
      setOpeningText('Merujuk pada hasil evaluasi komparasi kepatuhan terpadu berbasis Nomor Induk Berusaha (NIB) melalui Sistem Pengawasan Perizinan Berusaha Terintegrasi OSS-RBA, serta berdasarkan ketentuan perundang-undangan:');
      setAdditionalNotes('Kelalaian ganda dalam menindaklanjuti perpanjangan perizinan berusaha dan pelaporan LKPM dalam batas waktu 5 (lima) hari kerja akan berakibat pada penerbitan sanksi administratif berjenjang, penangguhan hak akses akun OSS, pembekuan fasilitas kepabeanan, serta penghentian sementara operasional lini produksi.');
    } else if (type === 'EXPIRED_PERMIT') {
      setLetterType('Teguran Izin Kedaluwarsa');
      setUrgency('Sangat Segera / Mendesak');
      setDeadlineDays(5);
      setSubjectTitle('SURAT TEGURAN RESMI: KEDALUWARSA DAN/ATAU MASA BERLAKU PERIZINAN BERUSAHA');
    } else if (type === 'LKPM_OVERDUE') {
      setLetterType('Surat Peringatan Tertulis I');
      setUrgency('Segera');
      setDeadlineDays(7);
      setSubjectTitle('SURAT PERINGATAN TERTULIS I: KETERLAMBATAN PENYAMPAIAN LAPORAN KEGIATAN PENANAMAN MODAL (LKPM)');
    } else {
      setLetterType('Surat Peringatan Terakhir');
      setUrgency('Sangat Segera / Mendesak');
      setDeadlineDays(3);
      setSubjectTitle('SURAT PERINGATAN TERAKHIR: PEMBEKUAN HAK AKSES PERIZINAN & KEWAJIBAN LKPM');
    }
  };

  // Add a new custom item to the violation table
  const handleAddCustomItem = () => {
    const newItem: WarningLetterItem = {
      itemType: 'PERMIT',
      itemName: 'Kewajiban Perizinan / Dokumen Baru',
      referenceNumber: `REG-${Date.now().toString().slice(-6)}`,
      deadlineOrExpiry: new Date().toISOString().split('T')[0],
      daysRemainingOrOverdue: -1,
      legalBasis: 'Peraturan Perundang-Undangan Terkait',
      actionRequired: 'Segera lakukan penyelesaian kewajiban administrasi perizinan.'
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  // Update item in table
  const handleUpdateItem = (index: number, field: keyof WarningLetterItem, value: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  // Delete item in table
  const handleDeleteItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Add legal basis
  const handleAddLegalBasis = () => {
    setLegalBases([...legalBases, 'Peraturan Terkait Kepatuhan Penyelenggaraan Perizinan Berusaha']);
  };

  // Update legal basis
  const handleUpdateLegalBasis = (idx: number, text: string) => {
    const updated = [...legalBases];
    updated[idx] = text;
    setLegalBases(updated);
  };

  // Delete legal basis
  const handleDeleteLegalBasis = (idx: number) => {
    setLegalBases(legalBases.filter((_, i) => i !== idx));
  };

  // Export Letter & Items to Excel (.xlsx)
  const handleExportLetterExcel = () => {
    const infoData = [
      ['SURAT TEGURAN RESMI KEPATUHAN PERIZINAN & LKPM'],
      ['Nomor Surat', letterNumber],
      ['Tanggal Surat', letterDate],
      ['Sifat', urgency],
      ['Perihal', subjectTitle],
      ['Perusahaan', companyName],
      ['NIB', companyNIB],
      ['Alamat', companyAddress],
      ['Penerima', `${recipientName} (${recipientRole})`],
      ['Email PIC', recipientEmail],
      ['Batas Waktu', `${deadlineDays} Hari Kerja`],
      ['Penandatangan', `${signatoryName} (${signatoryTitle})`],
      [],
      ['RINCIAN BUTIR PELANGGARAN & TINDAKAN WAJIB:']
    ];

    const tableHeaders = ['No', 'Uraian Kewajiban / Dokumen', 'Nomor Registrasi / Kode', 'Batas Waktu / Kedaluwarsa', 'Status Sisa Hari', 'Tindakan Wajib', 'Dasar Hukum'];
    const tableRows = selectedItems.map((item, idx) => [
      idx + 1,
      item.itemName,
      item.referenceNumber,
      item.deadlineOrExpiry,
      item.daysRemainingOrOverdue < 0 ? `Terlambat ${Math.abs(item.daysRemainingOrOverdue)} Hari` : `Sisa ${item.daysRemainingOrOverdue} Hari`,
      item.actionRequired,
      item.legalBasis
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...infoData, tableHeaders, ...tableRows]);
    ws['!cols'] = [
      { wch: 6 }, { wch: 35 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 45 }, { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rincian Surat Teguran');
    XLSX.writeFile(wb, `Surat_Teguran_${letterNumber.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

    setToastMessage('Rincian Surat Teguran berhasil diekspor ke Microsoft Excel (.xlsx)!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveDraft = () => {
    const newLetter: WarningLetter = {
      id: `letter-${Date.now()}`,
      letterNumber,
      letterDate,
      type: letterType,
      urgency,
      companyId: selectedCompany?.id || 'comp-custom',
      companyName,
      companyNIB,
      companyAddress,
      recipientName,
      recipientRole,
      recipientEmail,
      subject: subjectTitle,
      senderOrganization,
      signatoryName,
      signatoryTitle,
      deadlineDays,
      items: selectedItems,
      additionalNotes,
      generatedAt: new Date().toISOString(),
      status: 'Diterbitkan'
    };

    onSaveLetter(newLetter);
    setToastMessage('Surat Teguran resmi berhasil diterbitkan dan disimpan dalam arsip!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendEmail = () => {
    const currentLetter: WarningLetter = {
      id: `letter-${Date.now()}`,
      letterNumber,
      letterDate,
      type: letterType,
      urgency,
      companyId: selectedCompany.id,
      companyName,
      companyNIB,
      companyAddress,
      recipientName,
      recipientRole,
      recipientEmail,
      subject: `[RESMI] ${letterNumber} - ${letterType} Kepatuhan Perizinan & LKPM`,
      senderOrganization,
      signatoryName,
      signatoryTitle,
      deadlineDays,
      items: selectedItems,
      additionalNotes,
      generatedAt: new Date().toISOString(),
      status: 'Terkirim via Email'
    };

    onSendEmailWithLetter(currentLetter);
    setToastMessage(`Salinan resmi Surat Teguran berhasil dikirimkan ke email ${recipientEmail}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-500 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Role Notice Banner */}
      {currentUserRole === 'petugas' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900 no-print flex items-center justify-between">
          <div>
            <p className="font-bold text-xs">Otorisasi Terbatas: Akun Petugas</p>
            <p className="text-xs text-amber-700 mt-0.5">
              User Petugas bertugas untuk mengunggah dokumen Perizinan &amp; LKPM. Kewenangan mengedit, mencetak, dan mengirim Surat Teguran Resmi hanya dimiliki oleh <strong>User Koordinator</strong>.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-200 text-amber-900 text-xs font-bold shrink-0">
            Hanya Lihat Pratinjau
          </span>
        </div>
      )}

      {currentUserRole === 'monitor' && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl text-emerald-900 no-print flex items-center justify-between">
          <div>
            <p className="font-bold text-xs">Mode Pemantauan: Akun Monitor</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Anda sedang memantau arsip draf surat teguran. Pembuatan, revisi klausul, dan pengiriman surat dikelola oleh User Koordinator.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-200 text-emerald-900 text-xs font-bold shrink-0">
            Read-Only Monitor
          </span>
        </div>
      )}

      {/* Top Banner (hidden on print) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileWarning className="w-6 h-6 text-rose-600" />
              <span>Surat Teguran Resmi (Dapat Diedit Langsung)</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              Dokumen Hukum Resmi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUserRole === 'koordinator'
              ? 'Anda dapat mengedit seluruh elemen surat secara langsung (Kop, Nomor, Tanggal, Tujuan, Tabel Pelanggaran, Sanksi, Tanda Tangan, dan Tembusan).'
              : 'Pratinjau resmi surat teguran sesuai format baku perundang-undangan BKPM dan Kementerian terkait.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Toggle Edit Mode Button - Koordinator only */}
          {currentUserRole === 'koordinator' && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm border ${
                isEditMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
              title="Aktifkan/Nonaktifkan mode edit langsung pada dokumen surat"
            >
              {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span>{isEditMode ? 'Mode Edit Aktif (Klik Teks)' : 'Pratinjau Cetak Bersih'}</span>
            </button>
          )}

          {/* Export to Excel */}
          <button
            onClick={handleExportLetterExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
            title="Ekspor rincian dan butir surat teguran ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {/* Save Draft - Koordinator only */}
          {currentUserRole === 'koordinator' && (
            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Simpan Arsip</span>
            </button>
          )}

          {/* Send Email - Koordinator only */}
          {currentUserRole === 'koordinator' && (
            <button
              onClick={handleSendEmail}
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5"
            >
              <Mail className="w-4 h-4" />
              <span>Kirim Email PIC</span>
            </button>
          )}

          {/* Print / PDF - Koordinator only */}
          {currentUserRole === 'koordinator' && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Presets & Quick Selectors (hidden on print) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Pilih Preset &amp; Perusahaan:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="text-xs p-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
          >
            {companies.length === 0 ? (
              <option value="">(Belum ada perusahaan terdaftar)</option>
            ) : (
              companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Terapkan Preset:</span>
          <button
            onClick={() => applyPreset('DUAL_VIOLATION')}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-500 rounded border border-rose-700 shadow-sm transition flex items-center space-x-1"
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>🚨 SP Terpadu (Izin &amp; LKPM)</span>
          </button>
          <button
            onClick={() => applyPreset('EXPIRED_PERMIT')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition"
          >
            Izin Expired
          </button>
          <button
            onClick={() => applyPreset('LKPM_OVERDUE')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded border border-amber-200 transition"
          >
            SP1 LKPM
          </button>
          <button
            onClick={() => applyPreset('FULL_COMPLIANCE')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded border border-slate-300 transition"
          >
            Peringatan Terakhir
          </button>
        </div>
      </div>

      {/* Edit Mode Notice Banner (hidden on print) */}
      {isEditMode && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Edit Dokumen Aktif:</strong> Anda dapat langsung mengetik, mengubah nomor surat, mengedit tabel butir pelanggaran, menambah baris, atau menghapus item langsung di formulir surat di bawah.
            </span>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 ml-3"
          >
            Selesai Mengedit
          </button>
        </div>
      )}

      {/* Official Printable Indonesian Legal Document Preview / In-Place Editor */}
      <div className="bg-slate-200 p-3 sm:p-8 rounded-2xl flex justify-center shadow-inner">
        <div 
          id="surat-teguran-print"
          className="bg-white text-slate-900 shadow-2xl p-6 sm:p-12 max-w-[850px] w-full font-serif leading-relaxed text-sm relative border border-slate-300"
          style={{ minHeight: '1050px' }}
        >
          {/* Watermark in background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <span className="text-7xl font-black rotate-[-30deg] tracking-widest text-slate-900 uppercase">
              SURAT RESMI KEPATUHAN
            </span>
          </div>

          {/* Letterhead (KOP SURAT RESMI INDONESIA) */}
          <div className="text-center pb-4 relative">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center p-2 shrink-0">
                <ShieldAlert className="w-10 h-10 text-slate-900" />
              </div>
              <div className="text-center w-full max-w-xl">
                {isEditMode ? (
                  <div className="space-y-1 font-sans">
                    <input
                      type="text"
                      value={senderOrganization}
                      onChange={(e) => setSenderOrganization(e.target.value)}
                      className="w-full text-center text-sm sm:text-base font-black tracking-wider uppercase border border-dashed border-amber-400 bg-amber-50/50 rounded px-2 py-0.5"
                    />
                    <input
                      type="text"
                      value={kopSubtitle}
                      onChange={(e) => setKopSubtitle(e.target.value)}
                      className="w-full text-center text-xs font-bold uppercase border border-dashed border-amber-400 bg-amber-50/50 rounded px-2 py-0.5"
                    />
                    <input
                      type="text"
                      value={kopAddress}
                      onChange={(e) => setKopAddress(e.target.value)}
                      className="w-full text-center text-[10px] text-slate-600 border border-dashed border-slate-300 rounded px-2 py-0.5"
                    />
                    <input
                      type="text"
                      value={kopContact}
                      onChange={(e) => setKopContact(e.target.value)}
                      className="w-full text-center text-[9px] text-slate-500 border border-dashed border-slate-300 rounded px-2 py-0.5"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-base sm:text-lg font-black tracking-wider uppercase font-sans text-slate-950">
                      {senderOrganization}
                    </h2>
                    <h3 className="text-xs sm:text-sm font-bold uppercase font-sans text-slate-800 tracking-wide">
                      {kopSubtitle}
                    </h3>
                    <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                      {kopAddress}
                    </p>
                    <p className="text-[10px] font-sans text-slate-500">
                      {kopContact}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Double Border Line (Garis Ganda Khas Surat Resmi) */}
            <div className="border-b-4 border-slate-900 my-2" />
            <div className="border-b border-slate-900 -mt-1" />
          </div>

          {/* Metadata Surat: Nomor, Sifat, Lampiran, Hal, Tanggal */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start font-sans text-xs gap-3">
            <div className="space-y-1.5 w-full sm:w-2/3">
              <div className="flex items-center">
                <span className="w-20 font-semibold text-slate-700 shrink-0">Nomor</span>
                <span className="font-semibold text-slate-700 mr-1">:</span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="font-mono font-bold text-slate-900 border border-dashed border-amber-400 bg-amber-50/50 rounded px-1.5 py-0.5 text-xs w-full max-w-xs"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-900">{letterNumber}</span>
                )}
              </div>

              <div className="flex items-center">
                <span className="w-20 font-semibold text-slate-700 shrink-0">Sifat</span>
                <span className="font-semibold text-slate-700 mr-1">:</span>
                {isEditMode ? (
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="font-bold text-rose-700 border border-dashed border-amber-400 bg-amber-50/50 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="Sangat Segera / Mendesak">Sangat Segera / Mendesak</option>
                    <option value="Segera">Segera</option>
                    <option value="Biasa">Biasa</option>
                  </select>
                ) : (
                  <span className="font-bold text-rose-700">{urgency}</span>
                )}
              </div>

              <div className="flex items-center">
                <span className="w-20 font-semibold text-slate-700 shrink-0">Lampiran</span>
                <span className="font-semibold text-slate-700 mr-1">:</span>
                <span className="text-slate-800">1 (satu) Berkas Lembar Rincian Pelanggaran</span>
              </div>

              <div className="flex items-start">
                <span className="w-20 font-semibold text-slate-700 shrink-0 mt-0.5">Perihal</span>
                <span className="font-semibold text-slate-700 mr-1 mt-0.5">:</span>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    className="font-bold text-slate-950 uppercase tracking-tight border border-dashed border-amber-400 bg-amber-50/50 rounded px-1.5 py-0.5 text-xs w-full"
                  />
                ) : (
                  <span className="font-bold text-slate-950 uppercase tracking-tight">
                    {subjectTitle}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right font-sans text-xs shrink-0">
              {isEditMode ? (
                <div className="flex items-center space-x-1 sm:justify-end">
                  <input
                    type="text"
                    value={letterCity}
                    onChange={(e) => setLetterCity(e.target.value)}
                    className="w-24 text-right border border-dashed border-slate-300 rounded px-1 py-0.5 text-xs font-semibold"
                  />
                  <span>,</span>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="border border-dashed border-amber-400 bg-amber-50/50 rounded px-1 py-0.5 text-xs font-bold"
                  />
                </div>
              ) : (
                <p className="font-semibold text-slate-700">{letterCity}, {formatIndonesianDate(letterDate)}</p>
              )}
            </div>
          </div>

          {/* Tujuan Surat (Kepada Yth) */}
          <div className="mt-6 font-sans text-xs space-y-1">
            <p className="font-normal text-slate-700">Kepada Yang Terhormat,</p>
            {isEditMode ? (
              <div className="space-y-1.5 max-w-md pt-1">
                <input
                  type="text"
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  placeholder="Jabatan Penerima"
                  className="w-full font-bold text-slate-900 text-xs border border-dashed border-amber-400 bg-amber-50/50 rounded px-1.5 py-0.5"
                />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nama Perusahaan"
                  className="w-full font-bold text-slate-900 text-sm border border-dashed border-amber-400 bg-amber-50/50 rounded px-1.5 py-0.5"
                />
                <div className="flex items-center space-x-1">
                  <span className="text-slate-700 font-mono text-xs">NIB:</span>
                  <input
                    type="text"
                    value={companyNIB}
                    onChange={(e) => setCompanyNIB(e.target.value)}
                    placeholder="Nomor Induk Berusaha"
                    className="w-full font-mono text-slate-800 text-xs border border-dashed border-slate-300 rounded px-1.5 py-0.5"
                  />
                </div>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Alamat Perusahaan"
                  className="w-full text-slate-600 text-xs border border-dashed border-slate-300 rounded px-1.5 py-0.5"
                />
              </div>
            ) : (
              <>
                <p className="font-bold text-slate-900 text-sm">{recipientRole}</p>
                <p className="font-bold text-slate-900 text-sm">{companyName}</p>
                <p className="text-slate-700 font-mono">NIB: {companyNIB}</p>
                <p className="text-slate-600 max-w-md">{companyAddress}</p>
              </>
            )}
            <p className="text-slate-700 pt-0.5">Di Tempat</p>
          </div>

          {/* Isi Surat */}
          <div className="mt-6 space-y-3.5 text-justify text-xs font-sans text-slate-800 leading-relaxed">
            <p>Dengan hormat,</p>

            {isEditMode ? (
              <textarea
                rows={2}
                value={openingText}
                onChange={(e) => setOpeningText(e.target.value)}
                className="w-full border border-dashed border-amber-400 bg-amber-50/50 rounded p-1.5 text-xs leading-relaxed"
              />
            ) : (
              <p>{openingText}</p>
            )}

            {/* Dasar Hukum List (Editable) */}
            <div className="space-y-1">
              <ol className="list-decimal list-outside pl-5 space-y-1 text-[11px] text-slate-700">
                {legalBases.map((law, idx) => (
                  <li key={idx}>
                    {isEditMode ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={law}
                          onChange={(e) => handleUpdateLegalBasis(idx, e.target.value)}
                          className="w-full border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteLegalBasis(idx)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 text-xs no-print"
                          title="Hapus dasar hukum ini"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span><strong>{law}</strong>;</span>
                    )}
                  </li>
                ))}
              </ol>

              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddLegalBasis}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 mt-1 pl-5 no-print"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Dasar Hukum Lain</span>
                </button>
              )}
            </div>

            <p>
              Dengan ini disampaikan bahwa <strong>{companyName}</strong> terbukti belum memenuhi kewajiban perizinan berusaha dan/atau kepatuhan pelaporan investasi sebagaimana dirinci dalam tabel berikut:
            </p>

            {/* Table of Violations (Fully Editable in Edit Mode) */}
            <div className="my-3 border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse font-sans">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                    <th className="p-2 border-r border-slate-300">Uraian Kewajiban / Dokumen</th>
                    <th className="p-2 border-r border-slate-300">Nomor Registrasi / Kode</th>
                    <th className="p-2 border-r border-slate-300 text-center">Batas Waktu</th>
                    <th className="p-2 border-r border-slate-300">Tindakan Wajib</th>
                    {isEditMode && <th className="p-2 text-center w-12 no-print">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan={isEditMode ? 6 : 5} className="p-4 text-center text-slate-400 italic">
                        Belum ada butir pelanggaran. Klik tombol "+ Tambah Baris Pelanggaran Baru" di bawah untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item, idx) => (
                      <tr key={idx} className={item.daysRemainingOrOverdue < 0 ? 'bg-rose-50/40' : ''}>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{idx + 1}</td>

                        {/* Uraian */}
                        <td className="p-2 border-r border-slate-300">
                          {isEditMode ? (
                            <textarea
                              rows={2}
                              value={item.itemName}
                              onChange={(e) => handleUpdateItem(idx, 'itemName', e.target.value)}
                              className="w-full border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-900"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900">{item.itemName}</span>
                          )}
                        </td>

                        {/* Nomor Registrasi */}
                        <td className="p-2 border-r border-slate-300 font-mono text-[10px]">
                          {isEditMode ? (
                            <input
                              type="text"
                              value={item.referenceNumber}
                              onChange={(e) => handleUpdateItem(idx, 'referenceNumber', e.target.value)}
                              className="w-full border border-dashed border-slate-300 rounded px-1 py-0.5 text-[10px] font-mono"
                            />
                          ) : (
                            <span>{item.referenceNumber}</span>
                          )}
                        </td>

                        {/* Batas Waktu */}
                        <td className="p-2 border-r border-slate-300 text-center whitespace-nowrap">
                          {isEditMode ? (
                            <div className="space-y-1">
                              <input
                                type="date"
                                value={item.deadlineOrExpiry}
                                onChange={(e) => {
                                  const d = calculateDaysRemaining(e.target.value);
                                  handleUpdateItem(idx, 'deadlineOrExpiry', e.target.value);
                                  handleUpdateItem(idx, 'daysRemainingOrOverdue', d);
                                }}
                                className="border border-dashed border-amber-400 bg-amber-50/40 rounded px-1 py-0.5 text-[10px] font-bold text-rose-700"
                              />
                              <div className="text-[9px] text-slate-500">
                                {item.daysRemainingOrOverdue < 0 ? `(Lewat ${Math.abs(item.daysRemainingOrOverdue)}h)` : `(Sisa ${item.daysRemainingOrOverdue}h)`}
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-rose-700">
                                {formatIndonesianDate(item.deadlineOrExpiry)}
                              </span>
                              <div className="text-[10px] text-slate-500">
                                {item.daysRemainingOrOverdue < 0 ? `(Terlambat ${Math.abs(item.daysRemainingOrOverdue)} Hari)` : `(Sisa ${item.daysRemainingOrOverdue} Hari)`}
                              </div>
                            </>
                          )}
                        </td>

                        {/* Tindakan Wajib */}
                        <td className="p-2 border-r border-slate-300 text-[10px] text-slate-700">
                          {isEditMode ? (
                            <textarea
                              rows={2}
                              value={item.actionRequired}
                              onChange={(e) => handleUpdateItem(idx, 'actionRequired', e.target.value)}
                              className="w-full border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                            />
                          ) : (
                            <span>{item.actionRequired}</span>
                          )}
                        </td>

                        {/* Aksi Hapus Baris */}
                        {isEditMode && (
                          <td className="p-2 text-center no-print">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Custom Violation Row Button */}
            {isEditMode && (
              <div className="flex justify-between items-center py-1 no-print">
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Pelanggaran / Kewajiban Baru</span>
                </button>
                <span className="text-[11px] text-slate-500 italic">
                  Tabel ini dapat diekspor langsung ke Excel (.xlsx) melalui tombol di atas.
                </span>
              </div>
            )}

            {/* Paragraf Batas Waktu */}
            <p>
              Sehubungan dengan hal tersebut di atas, Saudara diminta untuk segera menyelesaikan kewajiban tersebut dan mengunggah bukti pemenuhan melalui portal resmi dalam jangka waktu paling lambat{' '}
              {isEditMode ? (
                <span className="inline-flex items-center space-x-1 mx-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Number(e.target.value))}
                    className="w-14 border border-dashed border-amber-400 bg-amber-50/50 rounded px-1 py-0.5 text-xs font-bold text-slate-900 text-center"
                  />
                  <strong>hari kerja</strong>
                </span>
              ) : (
                <strong>{deadlineDays} ({deadlineDays === 5 ? 'lima' : deadlineDays === 7 ? 'tujuh' : deadlineDays}) hari kerja</strong>
              )}{' '}
              terhitung sejak diterbitkannya surat peringatan ini.
            </p>

            {/* Box Peringatan Sanksi (Editable) */}
            <div className="p-2.5 bg-rose-50 border-l-4 border-rose-600 rounded-r text-[11px] text-rose-950 my-2">
              <strong>PERINGATAN SANKSI ADMINISTRATIF:</strong><br />
              {isEditMode ? (
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full border border-dashed border-rose-300 bg-white/80 rounded p-1.5 text-[11px] mt-1"
                />
              ) : (
                <span>{additionalNotes}</span>
              )}
            </div>

            {/* Penutup (Editable) */}
            {isEditMode ? (
              <textarea
                rows={2}
                value={closingText}
                onChange={(e) => setClosingText(e.target.value)}
                className="w-full border border-dashed border-amber-400 bg-amber-50/50 rounded p-1.5 text-xs"
              />
            ) : (
              <p>{closingText}</p>
            )}
          </div>

          {/* Tanda Tangan & Cap Stempel Resmi */}
          <div className="mt-8 flex justify-between items-end font-sans">
            {/* QR Code Verification */}
            <div className="space-y-1">
              <div className="p-2 border border-slate-300 rounded-lg inline-block bg-slate-50">
                <QrCode className="w-16 h-16 text-slate-900" />
              </div>
              <p className="text-[9px] text-slate-500 font-mono">
                Verifikasi Integritas Dokumen Elektronik<br />
                ID: {letterNumber.replace(/\//g, '-')}<br />
                Status: Resmi &amp; Tersertifikasi Digital
              </p>
            </div>

            {/* Signature & Digital Stamp */}
            <div className="text-center relative pr-4 min-w-[240px]">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Atas Nama Direktur Pengawasan Kepatuhan,
              </p>
              
              {isEditMode ? (
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full text-center text-xs font-bold text-slate-900 border border-dashed border-amber-400 bg-amber-50/50 rounded px-1 py-0.5 mb-6"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 mb-8">
                  {signatoryTitle}
                </p>
              )}

              {/* Digital Red Stamp (Stempel Basah Digital) */}
              <div className="absolute top-6 right-2 w-28 h-28 rounded-full border-2 border-rose-600 text-rose-600 flex flex-col items-center justify-center p-1.5 opacity-85 rotate-[-12deg] pointer-events-none">
                <span className="text-[8px] font-black tracking-widest uppercase text-center leading-tight">
                  REPUBLIK INDONESIA
                </span>
                <span className="text-[7px] font-bold text-center border-t border-b border-rose-600 py-0.5 my-0.5 uppercase tracking-wider">
                  ★ DIREKTORAT KEPATUHAN ★
                </span>
                <span className="text-[7px] font-black tracking-widest text-center">
                  AUDIT REGULASI
                </span>
              </div>

              {/* Signature Line */}
              <div className="relative z-10 pt-4">
                <p className="font-serif font-black italic text-lg text-slate-900 tracking-wider">
                  Danang Supriyanto
                </p>
                <div className="border-b border-slate-900 w-44 mx-auto my-1" />
                {isEditMode ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="w-full text-center text-xs font-bold text-slate-950 border border-dashed border-amber-400 bg-amber-50/50 rounded px-1 py-0.5"
                    />
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-[10px] text-slate-600 font-mono">NIP.</span>
                      <input
                        type="text"
                        value={signatoryNIP}
                        onChange={(e) => setSignatoryNIP(e.target.value)}
                        className="text-center text-[10px] text-slate-600 font-mono border border-dashed border-slate-300 rounded px-1 py-0.5 w-36"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-950">{signatoryName}</p>
                    <p className="text-[10px] text-slate-600">NIP. {signatoryNIP}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tembusan (Carbon Copy - Editable) */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-sans">
            <p className="font-bold text-slate-700 mb-0.5">Tembusan disampaikan kepada Yth.:</p>
            <ol className="list-decimal list-outside pl-4 space-y-0.5">
              {copies.map((copyItem, i) => (
                <li key={i}>
                  {isEditMode ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={copyItem}
                        onChange={(e) => {
                          const updated = [...copies];
                          updated[i] = e.target.value;
                          setCopies(updated);
                        }}
                        className="w-full border border-dashed border-slate-300 rounded px-1.5 py-0.2 text-[10px]"
                      />
                      <button
                        type="button"
                        onClick={() => setCopies(copies.filter((_, idx) => idx !== i))}
                        className="text-rose-500 hover:text-rose-700 p-0.5 no-print"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span>{copyItem}</span>
                  )}
                </li>
              ))}
            </ol>
            {isEditMode && (
              <button
                type="button"
                onClick={() => setCopies([...copies, 'Pejabat Terkait Lainnya'])}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 mt-1 pl-4 no-print"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Tembusan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  FileWarning,
  Printer,
  Mail,
  CheckCircle2,
  Edit3,
  Save,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { WarningLetter, WarningLetterItem, Permit, LKPMRecord, Company, UserRole } from '../types';
import {
  formatIndonesianDate,
  calculateDaysRemaining,
  isSameCompanyEntity,
  isSameAddress,
  normalizeAddress,
  formatCompanyOptionLabel
} from '../utils/helpers';

type LetterTemplateMode = 'SLF_RKK' | 'PBG_IPR';

interface WarningLetterGeneratorProps {
  companies: Company[];
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  savedLetters: WarningLetter[];
  currentUserRole?: UserRole;
  currentUserName?: string;
  initialItem?: { type: 'PERMIT' | 'LKPM' | 'DUAL_VIOLATION'; record: any } | null;
  onSaveLetter: (letter: WarningLetter) => void;
  onSendEmailWithLetter: (letter: WarningLetter) => void;
}

const TEMPLATE_PRESETS: Record<
  LetterTemplateMode,
  {
    subjectTitle: string;
    recipientPlaceholderOwner: string;
    recipientPlaceholderObject: string;
    openingText: string;
    reminderLeadText: string;
    bullet1Bold: string;
    bullet1Rest: string;
    bullet2Bold: string;
    bullet2Rest: string;
    bullet3Bold: string;
    bullet3Rest: string;
    supportText: string;
    contactScope: string;
    primaryDocLabel: string;
    primaryDateLabel: string;
    primaryExpiryLabel: string;
    secondaryDocLabel: string;
    secondaryExpiryLabel: string;
    attachmentDefault: string;
  }
> = {
  SLF_RKK: {
    subjectTitle: 'Pemberitahuan dan Pengingat Perpanjangan SLF',
    recipientPlaceholderOwner: '[NAMA PEMILIK/PENGELOLA BANGUNAN]',
    recipientPlaceholderObject: '[NAMA BANGUNAN]',
    openingText:
      'Dalam rangka mendukung tertib penyelenggaraan bangunan gedung serta pemenuhan aspek kelayakan fungsi dan keselamatan bangunan gedung di wilayah Kota Administrasi Jakarta Selatan sesuai Peraturan Pemerintah Nomor 16 Tahun 2021, bersama ini disampaikan pemberitahuan kepada Saudara terkait masa berlaku Sertifikat Laik Fungsi (SLF) bangunan gedung yang Saudara miliki/kelola.',
    reminderLeadText:
      'Sehubungan dengan masa berlaku dokumen tersebut, kami mengingatkan Saudara untuk memperhatikan masa berlaku SLF dan/atau dokumen keselamatan kebakaran serta melakukan persiapan pengurusan perpanjangan sesuai ketentuan yang berlaku, khususnya apabila masa berlakunya akan segera berakhir. Untuk itu, Saudara diharapkan dapat:',
    bullet1Bold: 'Memeriksa masa berlaku Sertifikat Laik Fungsi (SLF)',
    bullet1Rest: ' dan/atau dokumen keselamatan kebakaran (RKK/SKK) bangunan gedung;',
    bullet2Bold: 'Melakukan pengurusan perpanjangan/pembaruan',
    bullet2Rest: ' apabila masa berlaku dokumen telah berakhir atau akan berakhir;',
    bullet3Bold: 'Memastikan dokumen administrasi dan teknis',
    bullet3Rest:
      ' yang diperlukan telah tersedia dan sesuai dengan kondisi bangunan gedung; dan mengikuti mekanisme serta persyaratan pelayanan yang berlaku pada Pemerintah Provinsi DKI Jakarta.',
    supportText:
      'Langkah tersebut diharapkan dapat mendukung pemenuhan persyaratan kelayakan fungsi, keselamatan penghuni/pengguna bangunan, serta tertib administrasi penyelenggaraan bangunan gedung.',
    contactScope: 'SLF dan/atau dokumen keselamatan kebakaran',
    primaryDocLabel: 'Nomor SLF',
    primaryDateLabel: 'Tanggal SLF',
    primaryExpiryLabel: 'Masa Berlaku SLF s.d.',
    secondaryDocLabel: 'Nomor/Tanggal RKK/SKK',
    secondaryExpiryLabel: 'Masa Berlaku RKK/SKK s.d.',
    attachmentDefault: ''
  },
  PBG_IPR: {
    subjectTitle: 'Pemberitahuan dan Pengingat Perpanjangan PBG/IPR',
    recipientPlaceholderOwner: '[NAMA PEMILIK/PENGELOLA REKLAME]',
    recipientPlaceholderObject: '[NAMA REKLAME]',
    openingText:
      'Dalam rangka mendukung tertib penyelenggaraan bangunan gedung serta pemenuhan aspek kelayakan fungsi dan keselamatan bangunan gedung di wilayah Kota Administrasi Jakarta Selatan sesuai Peraturan Pemerintah Nomor 16 Tahun 2021, bersama ini disampaikan pemberitahuan kepada Saudara terkait masa berlaku Persetujuan Bangunan Gedung (PBG BR)/ IPR bangunan reklame yang Saudara miliki/kelola.',
    reminderLeadText:
      'Sehubungan dengan masa berlaku dokumen tersebut, kami mengingatkan Saudara untuk memperhatikan masa berlaku PBG BR dan/atau Izin Penyelenggaraan Reklame (IPR) serta melakukan persiapan pengurusan perpanjangan sesuai ketentuan yang berlaku, khususnya apabila masa berlakunya akan segera berakhir. Untuk itu, Saudara diharapkan dapat:',
    bullet1Bold: 'Memeriksa masa berlaku Persetujuan Bangunan Gedung Bangunan Reklame (PBG BR)',
    bullet1Rest: ' dan/atau Izin Penyelenggaraan Reklame (IPR);',
    bullet2Bold: 'Melakukan pengurusan perpanjangan/pembaruan',
    bullet2Rest: ' apabila masa berlaku dokumen telah berakhir atau akan berakhir;',
    bullet3Bold: 'Memastikan dokumen administrasi dan teknis',
    bullet3Rest:
      ' yang diperlukan telah tersedia dan sesuai dengan kondisi bangunan reklame; dan mengikuti mekanisme serta persyaratan pelayanan yang berlaku pada Pemerintah Provinsi DKI Jakarta.',
    supportText:
      'Langkah tersebut diharapkan dapat mendukung pemenuhan persyaratan perizinan reklame, penataan reklame sesuai ketentuan tata ruang, serta tertib administrasi penyelenggaraan bangunan reklame.',
    contactScope: 'PBG BR dan/atau Izin Penyelenggaraan Reklame (IPR)',
    primaryDocLabel: 'Nomor PBG BR',
    primaryDateLabel: 'Tanggal PBG BR',
    primaryExpiryLabel: 'Masa Berlaku PBG BR s.d.',
    secondaryDocLabel: 'Nomor/Tanggal IPR',
    secondaryExpiryLabel: 'Masa Berlaku IPR s.d.',
    attachmentDefault: '-'
  }
};

export const WarningLetterGenerator: React.FC<WarningLetterGeneratorProps> = ({
  companies,
  permits,
  lkpmRecords: _lkpmRecords,
  savedLetters: _savedLetters,
  currentUserRole = 'koordinator',
  currentUserName = '',
  initialItem,
  onSaveLetter,
  onSendEmailWithLetter
}) => {
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [templateMode, setTemplateMode] = useState<LetterTemplateMode>('SLF_RKK');

  // Core Company & Metadata
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [letterNumber, setLetterNumber] = useState<string>('[NOMOR SURAT]');
  const [letterSifat, setLetterSifat] = useState<string>('Penting');
  const [letterAttachment, setLetterAttachment] = useState<string>('');
  const [letterCity, setLetterCity] = useState<string>('Jakarta');
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Kop Surat Resmi Pemprov DKI Jakarta / UP. PMPTSP Jakarta Selatan
  const [senderOrganization, setSenderOrganization] = useState<string>(
    'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA'
  );
  const [kopSubtitle, setKopSubtitle] = useState<string>(
    'UNIT PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU'
  );
  const [kopUnitCity, setKopUnitCity] = useState<string>(
    'KOTA ADMINISTRASI JAKARTA SELATAN'
  );
  const [kopAddress, setKopAddress] = useState<string>(
    'Jalan Prapanca Raya No.9, Telepon 72789159'
  );
  const [kopPostalCode, setKopPostalCode] = useState<string>('Kode Pos : 12170');

  // Tujuan Surat
  const [recipientOwnerName, setRecipientOwnerName] = useState<string>(
    TEMPLATE_PRESETS.SLF_RKK.recipientPlaceholderOwner
  );
  const [recipientObjectName, setRecipientObjectName] = useState<string>(
    TEMPLATE_PRESETS.SLF_RKK.recipientPlaceholderObject
  );
  const [recipientEmail, setRecipientEmail] = useState<string>('andri.cimb@gmail.com');
  const [recipientLocation, setRecipientLocation] = useState<string>('Jakarta');

  // Isi & Tabel Data Dokumen (8 baris)
  const [subjectTitle, setSubjectTitle] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.subjectTitle);
  const [openingText, setOpeningText] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.openingText);

  const [docOwner, setDocOwner] = useState<string>('');
  const [docBuildingName, setDocBuildingName] = useState<string>('');
  const [docAddress, setDocAddress] = useState<string>('');
  const [docPrimaryNumber, setDocPrimaryNumber] = useState<string>('');
  const [docPrimaryDate, setDocPrimaryDate] = useState<string>('');
  const [docPrimaryExpiry, setDocPrimaryExpiry] = useState<string>('');
  const [docSecondaryNumberDate, setDocSecondaryNumberDate] = useState<string>('');
  const [docSecondaryExpiry, setDocSecondaryExpiry] = useState<string>('');

  // Paragraf Pengingat & Poin Harapan
  const [reminderLeadText, setReminderLeadText] = useState<string>(
    TEMPLATE_PRESETS.SLF_RKK.reminderLeadText
  );
  const [bullet1Bold, setBullet1Bold] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.bullet1Bold);
  const [bullet1Rest, setBullet1Rest] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.bullet1Rest);
  const [bullet2Bold, setBullet2Bold] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.bullet2Bold);
  const [bullet2Rest, setBullet2Rest] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.bullet2Rest);
  const [bullet3Bold, setBullet3Bold] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.bullet3Bold);
  const [bullet3Rest, setBullet3Rest] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.bullet3Rest);
  const [supportText, setSupportText] = useState<string>(TEMPLATE_PRESETS.SLF_RKK.supportText);
  const [picOfficerName, setPicOfficerName] = useState<string>(currentUserName || 'Petugas PTSP');
  const [closingText, setClosingText] = useState<string>(
    'Demikian pemberitahuan ini disampaikan untuk menjadi perhatian dan dapat ditindaklanjuti. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.'
  );

  // Tanda Tangan Kepala Unit Pengelola PMPTSP
  const [signatoryLine1, setSignatoryLine1] = useState<string>('KEPALA UNIT PENGELOLA PMPTSP');
  const [signatoryLine2, setSignatoryLine2] = useState<string>('KOTA ADMINISTRASI JAKARTA SELATAN');
  const [signatoryName, setSignatoryName] = useState<string>('MARIO WIBOWO');
  const [signatoryNip, setSignatoryNip] = useState<string>('NIP 198703252006021001');

  useEffect(() => {
    if (currentUserName) {
      setPicOfficerName(currentUserName);
    }
  }, [currentUserName]);

  // Tembusan
  const [copies, setCopies] = useState<string[]>([
    'Kepala DPMPTSP Provinsi DKI Jakarta;',
    'Inspektorat Pembantu Kota Adm Jaksel'
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const preset = TEMPLATE_PRESETS[templateMode];

  // Switch template texts cleanly
  const applyTemplateMode = (mode: LetterTemplateMode) => {
    const p = TEMPLATE_PRESETS[mode];
    setTemplateMode(mode);
    setSubjectTitle(p.subjectTitle);
    setLetterAttachment(p.attachmentDefault);
    setOpeningText(p.openingText);
    setReminderLeadText(p.reminderLeadText);
    setBullet1Bold(p.bullet1Bold);
    setBullet1Rest(p.bullet1Rest);
    setBullet2Bold(p.bullet2Bold);
    setBullet2Rest(p.bullet2Rest);
    setBullet3Bold(p.bullet3Bold);
    setBullet3Rest(p.bullet3Rest);
    setSupportText(p.supportText);

    if (!selectedCompany) {
      setRecipientOwnerName(p.recipientPlaceholderOwner);
      setRecipientObjectName(p.recipientPlaceholderObject);
    }
  };

  // Detect template automatically if initialItem is passed
  useEffect(() => {
    if (!initialItem) return;
    const rec = initialItem.record;
    const compId = rec?.company?.id || rec?.companyId;
    if (compId) {
      setSelectedCompanyId(compId);
    }
    const titleStr = `${rec?.permitName || ''} ${rec?.category || ''} ${rec?.usage || ''}`.toLowerCase();
    if (
      titleStr.includes('reklame') ||
      titleStr.includes('ipr') ||
      titleStr.includes('pbg br')
    ) {
      applyTemplateMode('PBG_IPR');
    } else {
      applyTemplateMode('SLF_RKK');
    }
  }, [initialItem]);

  // Populate fields from selected company & permits
  useEffect(() => {
    const p = TEMPLATE_PRESETS[templateMode];

    if (!selectedCompany) {
      setRecipientOwnerName(p.recipientPlaceholderOwner);
      setRecipientObjectName(p.recipientPlaceholderObject);
      setDocOwner('');
      setDocBuildingName('');
      setDocAddress('');
      setDocPrimaryNumber('');
      setDocPrimaryDate('');
      setDocPrimaryExpiry('');
      setDocSecondaryNumberDate('');
      setDocSecondaryExpiry('');
      return;
    }

    const compPermits = permits.filter(
      (item) =>
        (item.companyId === selectedCompany.id &&
          (!normalizeAddress(item.address) || isSameAddress(item.address, selectedCompany.address))) ||
        isSameCompanyEntity(
          { name: item.companyName, address: item.address, nib: item.nib },
          selectedCompany
        )
    );

    const firstWithAddress = compPermits.find((item) => item.address);
    const firstWithUsage = compPermits.find((item) => item.usage);

    setRecipientOwnerName(selectedCompany.name);
    setRecipientObjectName(firstWithUsage?.usage || selectedCompany.sector || p.recipientPlaceholderObject);
    setRecipientEmail(selectedCompany.picEmail || 'andri.cimb@gmail.com');

    setDocOwner(selectedCompany.name);
    setDocBuildingName(firstWithUsage?.usage || selectedCompany.sector || '');
    setDocAddress(firstWithAddress?.address || selectedCompany.address || '');

    if (templateMode === 'SLF_RKK') {
      const slfPermit = compPermits.find((item) =>
        /slf|laik fungsi/i.test(`${item.permitName} ${item.category}`)
      );
      const rkkPermit = compPermits.find((item) =>
        /rkk|skk|kebakaran|damkar/i.test(`${item.permitName} ${item.category}`)
      );
      setDocPrimaryNumber(slfPermit?.documentNumber || '');
      setDocPrimaryDate(slfPermit?.issuedDate ? formatIndonesianDate(slfPermit.issuedDate) : '');
      setDocPrimaryExpiry(slfPermit?.expiryDate ? formatIndonesianDate(slfPermit.expiryDate) : '');
      setDocSecondaryNumberDate(
        rkkPermit
          ? [
              rkkPermit.documentNumber,
              rkkPermit.issuedDate ? formatIndonesianDate(rkkPermit.issuedDate) : ''
            ]
              .filter(Boolean)
              .join(' / ')
          : ''
      );
      setDocSecondaryExpiry(rkkPermit?.expiryDate ? formatIndonesianDate(rkkPermit.expiryDate) : '');
    } else {
      const pbgPermit = compPermits.find((item) =>
        /pbg|persetujuan bangunan/i.test(`${item.permitName} ${item.category}`)
      );
      const iprPermit = compPermits.find((item) =>
        /ipr|reklame/i.test(`${item.permitName} ${item.category}`)
      );
      setDocPrimaryNumber(pbgPermit?.documentNumber || '');
      setDocPrimaryDate(pbgPermit?.issuedDate ? formatIndonesianDate(pbgPermit.issuedDate) : '');
      setDocPrimaryExpiry(pbgPermit?.expiryDate ? formatIndonesianDate(pbgPermit.expiryDate) : '');
      setDocSecondaryNumberDate(
        iprPermit
          ? [
              iprPermit.documentNumber,
              iprPermit.issuedDate ? formatIndonesianDate(iprPermit.issuedDate) : ''
            ]
              .filter(Boolean)
              .join(' / ')
          : ''
      );
      setDocSecondaryExpiry(iprPermit?.expiryDate ? formatIndonesianDate(iprPermit.expiryDate) : '');
    }
  }, [selectedCompanyId, templateMode, permits, companies]);

  const formatDateDdMmYyyy = (isoDate: string): string => {
    const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return isoDate;
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const buildDocumentRows = () => [
    { label: 'Nama Pemilik/Pengelola', value: docOwner, setter: setDocOwner },
    { label: 'Nama Bangunan', value: docBuildingName, setter: setDocBuildingName },
    { label: 'Alamat Bangunan', value: docAddress, setter: setDocAddress },
    { label: preset.primaryDocLabel, value: docPrimaryNumber, setter: setDocPrimaryNumber },
    { label: preset.primaryDateLabel, value: docPrimaryDate, setter: setDocPrimaryDate },
    { label: preset.primaryExpiryLabel, value: docPrimaryExpiry, setter: setDocPrimaryExpiry },
    { label: preset.secondaryDocLabel, value: docSecondaryNumberDate, setter: setDocSecondaryNumberDate },
    { label: preset.secondaryExpiryLabel, value: docSecondaryExpiry, setter: setDocSecondaryExpiry }
  ];

  const handleExportLetterExcel = () => {
    const rows = buildDocumentRows();
    const infoData = [
      ['SURAT PEMBERITAHUAN DAN PENGINGAT PERPANJANGAN PERIZINAN'],
      ['Instansi', `${senderOrganization} - ${kopSubtitle} ${kopUnitCity}`],
      ['Nomor Surat', letterNumber],
      ['Tanggal Surat', `${letterCity}, ${formatDateDdMmYyyy(letterDate)}`],
      ['Sifat', letterSifat],
      ['Lampiran', letterAttachment || '-'],
      ['Hal', subjectTitle],
      ['Kepada Yth.', recipientOwnerName],
      ['Objek Bangunan / Reklame', recipientObjectName],
      [],
      ['DATA DOKUMEN TERCATAT', 'KETERANGAN'],
      ...rows.map((r) => [r.label, r.value || '-'])
    ];

    const ws = XLSX.utils.aoa_to_sheet(infoData);
    ws['!cols'] = [{ wch: 32 }, { wch: 52 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Surat Pemberitahuan');
    XLSX.writeFile(
      wb,
      `Surat_${templateMode}_${(letterNumber || 'Draft').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    );

    setToastMessage('Surat berhasil diekspor ke Microsoft Excel (.xlsx)!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const buildArchivePayload = (status: WarningLetter['status']): WarningLetter => {
    const items: WarningLetterItem[] = [
      {
        itemType: 'PERMIT',
        itemName: subjectTitle,
        referenceNumber: docPrimaryNumber || docSecondaryNumberDate || letterNumber,
        deadlineOrExpiry: letterDate,
        daysRemainingOrOverdue: calculateDaysRemaining(letterDate),
        legalBasis: 'Peraturan Pemerintah Nomor 16 Tahun 2021',
        actionRequired: 'Pengurusan perpanjangan/pembaruan dokumen sebelum masa berlaku berakhir.'
      }
    ];

    return {
      id: `letter-${Date.now()}`,
      letterNumber,
      letterDate,
      type: 'Teguran Izin Kedaluwarsa',
      urgency: letterSifat === 'Biasa' ? 'Biasa' : 'Sangat Segera / Mendesak',
      companyId: selectedCompany?.id || 'comp-custom',
      companyName: docOwner || recipientOwnerName,
      companyNIB: selectedCompany?.nib || '-',
      companyAddress: docAddress || selectedCompany?.address || 'Jakarta Selatan',
      recipientName: recipientOwnerName,
      recipientRole: recipientObjectName,
      recipientEmail,
      subject: subjectTitle,
      senderOrganization: `${kopSubtitle} ${kopUnitCity}`,
      signatoryName: `${signatoryName} (${signatoryNip})`,
      signatoryTitle: `${signatoryLine1} ${signatoryLine2}`,
      deadlineDays: 7,
      items,
      additionalNotes: openingText,
      generatedAt: new Date().toISOString(),
      status
    };
  };

  const handleSaveDraft = () => {
    onSaveLetter(buildArchivePayload('Diterbitkan'));
    setToastMessage('Surat berhasil diterbitkan dan disimpan dalam arsip!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendEmail = () => {
    onSendEmailWithLetter(buildArchivePayload('Terkirim via Email'));
    setToastMessage(`Salinan resmi surat berhasil dikirimkan ke email ${recipientEmail}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const documentRows = buildDocumentRows();

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-500 animate-slide-in no-print">
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
              Kewenangan mengedit, mencetak, dan mengirim Surat Resmi dimiliki oleh <strong>User Koordinator / Super Admin</strong>.
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
              Anda sedang memantau pratinjau surat resmi UP. PMPTSP Kota Administrasi Jakarta Selatan.
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
              <span>Surat Pemberitahuan &amp; Pengingat Perpanjangan</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              Template Resmi UP. PMPTSP Jaksel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUserRole === 'koordinator'
              ? 'Format resmi Pemprov DKI Jakarta (SLF & RKK/SKK maupun PBG BR/IPR Reklame). Seluruh isi surat dan tabel dokumen dapat diedit langsung.'
              : 'Pratinjau resmi surat pemberitahuan dan pengingat perpanjangan dokumen UP. PMPTSP Kota Administrasi Jakarta Selatan.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
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

          <button
            onClick={handleExportLetterExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
            title="Ekspor rincian surat ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {currentUserRole === 'koordinator' && (
            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Simpan Arsip</span>
            </button>
          )}

          {currentUserRole === 'koordinator' && (
            <button
              onClick={handleSendEmail}
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5"
            >
              <Mail className="w-4 h-4" />
              <span>Kirim Email PIC</span>
            </button>
          )}

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

      {/* Template & Company Selector Bar (hidden on print) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Pilih Entitas / Pemilik:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="text-xs p-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white max-w-xs"
          >
            {companies.length === 0 ? (
              <option value="">(Gunakan Template Kosong / Isi Manual)</option>
            ) : (
              companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCompanyOptionLabel(c)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1 font-medium">Jenis Template Surat:</span>
          <button
            type="button"
            onClick={() => applyTemplateMode('SLF_RKK')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              templateMode === 'SLF_RKK'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            1. Pengingat SLF &amp; RKK/SKK
          </button>
          <button
            type="button"
            onClick={() => applyTemplateMode('PBG_IPR')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              templateMode === 'PBG_IPR'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            2. Pengingat PBG BR / IPR Reklame
          </button>
        </div>
      </div>

      {/* Edit Mode Notice Banner (hidden on print) */}
      {isEditMode && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Edit Dokumen Aktif:</strong> Klik teks atau kolom tabel pada surat di bawah untuk mengubah nomor surat, tanggal, data pemilik/bangunan, nomor SLF/RKK/PBG/IPR, dan nama PIC.
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

      {/* Official Printable Letter Paper (#surat-teguran-print) */}
      <div className="bg-slate-200 p-3 sm:p-8 rounded-2xl flex justify-center shadow-inner">
        <div
          id="surat-teguran-print"
          className="bg-white text-slate-950 shadow-2xl px-8 py-8 sm:px-14 sm:py-10 max-w-[820px] w-full font-sans text-[12.5px] leading-[1.45] relative border border-slate-300"
          style={{ minHeight: '1050px' }}
        >
          {/* KOP SURAT RESMI PEMPROV DKI JAKARTA */}
          <div className="relative pb-1">
            <div className="flex items-center gap-4">
              <img
                src="/assets/aistudio/download-removebg-preview_688696e1.png"
                alt="Logo Pemprov DKI Jakarta"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain shrink-0"
              />
              <div className="flex-1 text-center">
                {isEditMode ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={senderOrganization}
                      onChange={(e) => setSenderOrganization(e.target.value)}
                      className="w-full text-center text-[13px] sm:text-[14px] font-bold uppercase tracking-tight border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5"
                    />
                    <input
                      type="text"
                      value={kopSubtitle}
                      onChange={(e) => setKopSubtitle(e.target.value)}
                      className="w-full text-center text-[13px] sm:text-[14px] font-bold uppercase tracking-tight border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5"
                    />
                    <input
                      type="text"
                      value={kopUnitCity}
                      onChange={(e) => setKopUnitCity(e.target.value)}
                      className="w-full text-center text-[13px] sm:text-[14px] font-bold uppercase tracking-tight border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5"
                    />
                    <input
                      type="text"
                      value={kopAddress}
                      onChange={(e) => setKopAddress(e.target.value)}
                      className="w-full text-center text-[11.5px] border border-dashed border-slate-300 rounded px-1.5 py-0.5"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-[13px] sm:text-[14.5px] font-bold uppercase leading-snug text-slate-950">
                      {senderOrganization}
                    </h2>
                    <h3 className="text-[13px] sm:text-[14.5px] font-bold uppercase leading-snug text-slate-950">
                      {kopSubtitle}
                    </h3>
                    <h3 className="text-[13px] sm:text-[14.5px] font-bold uppercase leading-snug text-slate-950">
                      {kopUnitCity}
                    </h3>
                    <p className="text-[11.5px] text-slate-900 mt-0.5">{kopAddress}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-1">
              {isEditMode ? (
                <input
                  type="text"
                  value={kopPostalCode}
                  onChange={(e) => setKopPostalCode(e.target.value)}
                  className="text-right text-[11px] font-medium border border-dashed border-slate-300 rounded px-1.5 py-0.5 w-36"
                />
              ) : (
                <span className="text-[11px] font-medium text-slate-900">{kopPostalCode}</span>
              )}
            </div>

            {/* Garis Ganda Kop Surat */}
            <div className="border-b-[3px] border-slate-950 mt-1" />
            <div className="border-b border-slate-950 mt-[2px]" />
          </div>

          {/* Metadata Surat: Nomor, Sifat, Lampiran, Hal & Tanggal */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-3">
            <table className="text-[12px] border-collapse">
              <tbody>
                <tr>
                  <td className="pr-4 py-0.5 align-top w-20">Nomor</td>
                  <td className="pr-2 py-0.5 align-top">:</td>
                  <td className="py-0.5 align-top">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={letterNumber}
                        onChange={(e) => setLetterNumber(e.target.value)}
                        className="border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px] w-60"
                      />
                    ) : (
                      <span>{letterNumber}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 py-0.5 align-top">Sifat</td>
                  <td className="pr-2 py-0.5 align-top">:</td>
                  <td className="py-0.5 align-top">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={letterSifat}
                        onChange={(e) => setLetterSifat(e.target.value)}
                        className="border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px] w-40"
                      />
                    ) : (
                      <span>{letterSifat}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 py-0.5 align-top">Lampiran</td>
                  <td className="pr-2 py-0.5 align-top">:</td>
                  <td className="py-0.5 align-top">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={letterAttachment}
                        onChange={(e) => setLetterAttachment(e.target.value)}
                        placeholder="-"
                        className="border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[12px] w-40"
                      />
                    ) : (
                      <span>{letterAttachment}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 py-0.5 align-top">Hal</td>
                  <td className="pr-2 py-0.5 align-top">:</td>
                  <td className="py-0.5 align-top font-bold">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={subjectTitle}
                        onChange={(e) => setSubjectTitle(e.target.value)}
                        className="font-bold border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px] w-80"
                      />
                    ) : (
                      <span>{subjectTitle}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-[12px] shrink-0 sm:pr-4">
              {isEditMode ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={letterCity}
                    onChange={(e) => setLetterCity(e.target.value)}
                    className="w-20 text-right border border-dashed border-slate-300 rounded px-1 py-0.5 text-[12px]"
                  />
                  <span>,</span>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px]"
                  />
                </div>
              ) : (
                <span>
                  {letterCity}, {formatIndonesianDate(letterDate)}
                </span>
              )}
            </div>
          </div>

          {/* Tujuan Surat (Yth.) */}
          <div className="mt-5 text-[12px] space-y-0.5">
            <p>Yth.</p>
            {isEditMode ? (
              <div className="space-y-1 max-w-md pt-0.5">
                <input
                  type="text"
                  value={recipientOwnerName}
                  onChange={(e) => setRecipientOwnerName(e.target.value)}
                  placeholder={preset.recipientPlaceholderOwner}
                  className="w-full font-bold border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px]"
                />
                <input
                  type="text"
                  value={recipientObjectName}
                  onChange={(e) => setRecipientObjectName(e.target.value)}
                  placeholder={preset.recipientPlaceholderObject}
                  className="w-full border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px]"
                />
                <p>di</p>
                <input
                  type="text"
                  value={recipientLocation}
                  onChange={(e) => setRecipientLocation(e.target.value)}
                  className="w-44 border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[12px]"
                />
              </div>
            ) : (
              <>
                <p className="font-bold">{recipientOwnerName}</p>
                <p>{recipientObjectName}</p>
                <p>di</p>
                <p>{recipientLocation}</p>
              </>
            )}
          </div>

          {/* Paragraf Pembuka */}
          <div className="mt-4 text-justify text-[12px] leading-[1.5]">
            {isEditMode ? (
              <textarea
                rows={4}
                value={openingText}
                onChange={(e) => setOpeningText(e.target.value)}
                className="w-full indent-8 border border-dashed border-amber-400 bg-amber-50/40 rounded p-1.5 text-[12px] leading-[1.5]"
              />
            ) : (
              <p className="indent-8">{openingText}</p>
            )}
          </div>

          {/* Tabel Data Dokumen Tercatat */}
          <div className="mt-3 text-[12px]">
            <p className="mb-1.5">Data dokumen yang tercatat adalah sebagai berikut:</p>
            <table className="w-full border-collapse border border-slate-900 text-[11.5px]">
              <tbody>
                {documentRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-900 px-2.5 py-1 font-bold w-[42%] align-middle">
                      {row.label}
                    </td>
                    <td className="border border-slate-900 px-2.5 py-1 align-middle">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => row.setter(e.target.value)}
                          placeholder="[................................................]"
                          className="w-full border border-dashed border-amber-400/80 bg-amber-50/30 rounded px-1.5 py-0.5 text-[11.5px]"
                        />
                      ) : (
                        <span>{row.value || '[................................................]'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paragraf Pengingat & Poin-Poin */}
          <div className="mt-4 space-y-2.5 text-justify text-[12px] leading-[1.5]">
            {isEditMode ? (
              <textarea
                rows={3}
                value={reminderLeadText}
                onChange={(e) => setReminderLeadText(e.target.value)}
                className="w-full border border-dashed border-amber-400 bg-amber-50/40 rounded p-1.5 text-[12px] leading-[1.5]"
              />
            ) : (
              <p>{reminderLeadText}</p>
            )}

            <ul className="list-disc pl-8 space-y-1.5">
              <li>
                {isEditMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={bullet1Bold}
                      onChange={(e) => setBullet1Bold(e.target.value)}
                      className="font-bold border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                    <input
                      type="text"
                      value={bullet1Rest}
                      onChange={(e) => setBullet1Rest(e.target.value)}
                      className="border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                  </div>
                ) : (
                  <>
                    <strong>{bullet1Bold}</strong>
                    {bullet1Rest}
                  </>
                )}
              </li>
              <li>
                {isEditMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={bullet2Bold}
                      onChange={(e) => setBullet2Bold(e.target.value)}
                      className="font-bold border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                    <input
                      type="text"
                      value={bullet2Rest}
                      onChange={(e) => setBullet2Rest(e.target.value)}
                      className="border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                  </div>
                ) : (
                  <>
                    <strong>{bullet2Bold}</strong>
                    {bullet2Rest}
                  </>
                )}
              </li>
              <li>
                {isEditMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={bullet3Bold}
                      onChange={(e) => setBullet3Bold(e.target.value)}
                      className="font-bold border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                    <input
                      type="text"
                      value={bullet3Rest}
                      onChange={(e) => setBullet3Rest(e.target.value)}
                      className="border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                  </div>
                ) : (
                  <>
                    <strong>{bullet3Bold}</strong>
                    {bullet3Rest}
                  </>
                )}
              </li>
            </ul>

            {isEditMode ? (
              <textarea
                rows={2}
                value={supportText}
                onChange={(e) => setSupportText(e.target.value)}
                className="w-full border border-dashed border-slate-300 rounded p-1.5 text-[12px] leading-[1.5]"
              />
            ) : (
              <p>{supportText}</p>
            )}

            <p>
              Untuk informasi lebih lanjut mengenai persyaratan dan mekanisme pengurusan {preset.contactScope}, Saudara dapat memanfaatkan kanal pelayanan DPMPTSP Provinsi DKI Jakarta atau PIC pada UP. PMPTSP Kota Administrasi Jakarta Selatan Sdr.{' '}
              {isEditMode ? (
                <input
                  type="text"
                  value={picOfficerName}
                  onChange={(e) => setPicOfficerName(e.target.value)}
                  className="inline-block w-48 border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px] font-semibold"
                />
              ) : (
                <span className="font-semibold">{picOfficerName}</span>
              )}
              {' '}atau dapat mengajukan permohonan pendampingan dengan mengunjungi website{' '}
              <a
                href="https://asistara.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-sky-700 print:text-slate-950 font-medium"
              >
                https://asistara.online/
              </a>
              .
            </p>

            {isEditMode ? (
              <textarea
                rows={2}
                value={closingText}
                onChange={(e) => setClosingText(e.target.value)}
                className="w-full border border-dashed border-amber-400 bg-amber-50/40 rounded p-1.5 text-[12px] leading-[1.5]"
              />
            ) : (
              <p>{closingText}</p>
            )}
          </div>

          {/* Blok TTD Kepala Unit Pengelola PMPTSP */}
          <div className="mt-7 flex justify-end text-[12px]">
            <div className="text-center min-w-[270px]">
              {isEditMode ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={signatoryLine1}
                    onChange={(e) => setSignatoryLine1(e.target.value)}
                    className="w-full text-center font-bold uppercase border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px]"
                  />
                  <input
                    type="text"
                    value={signatoryLine2}
                    onChange={(e) => setSignatoryLine2(e.target.value)}
                    className="w-full text-center font-bold uppercase border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px]"
                  />
                </div>
              ) : (
                <>
                  <p className="font-bold uppercase leading-snug">{signatoryLine1}</p>
                  <p className="font-bold uppercase leading-snug">{signatoryLine2}</p>
                </>
              )}

              <div className="mt-16 pt-2 text-center space-y-0.5">
                {isEditMode ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="w-full text-center font-bold border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px]"
                    />
                    <input
                      type="text"
                      value={signatoryNip}
                      onChange={(e) => setSignatoryNip(e.target.value)}
                      className="w-full text-center border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-bold leading-snug">{signatoryName}</p>
                    <p className="text-[11.5px] leading-snug">{signatoryNip}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tembusan */}
          <div className="mt-4 text-[11.5px]">
            <p className="mb-0.5">Tembusan:</p>
            <ol className="list-decimal list-outside pl-5 space-y-0.5">
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
                        className="w-full max-w-md border border-dashed border-slate-300 rounded px-1.5 py-0.5 text-[11.5px]"
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
                onClick={() => setCopies([...copies, 'Instansi Terkait Lainnya'])}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 mt-1 pl-5 no-print"
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

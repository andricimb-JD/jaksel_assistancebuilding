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
  Check,
  Database,
  Clock,
  Trash2,
  FolderOpen,
  FilePlus2,
  Search,
  X
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
  currentUserPhone?: string;
  onUpdateUserPhone?: (phone: string) => void;
  initialItem?: { type: 'PERMIT' | 'LKPM' | 'DUAL_VIOLATION'; record: any } | null;
  onUpsertLetter?: (letter: WarningLetter) => void;
  onDeleteLetter?: (letterId: string) => void;
  onSyncPermitFromLetter?: (payload: {
    companyId?: string;
    companyName: string;
    buildingName?: string;
    address: string;
    picEmail?: string;
    docKind: 'PRIMARY' | 'SECONDARY';
    templateMode: 'SLF_RKK' | 'PBG_IPR';
    documentNumber: string;
    issuedDateRaw?: string;
    expiryDateRaw?: string;
    rawIssuedText?: string;
    rawExpiryText?: string;
  }) => void;
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
  savedLetters,
  currentUserRole = 'koordinator',
  currentUserName = '',
  currentUserPhone = '',
  onUpdateUserPhone,
  initialItem,
  onUpsertLetter,
  onDeleteLetter,
  onSyncPermitFromLetter,
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
  const [picOfficerPhone, setPicOfficerPhone] = useState<string>(currentUserPhone || '');
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

  useEffect(() => {
    setPicOfficerPhone(currentUserPhone || '');
  }, [currentUserPhone]);

  // Tembusan
  const [copies, setCopies] = useState<string[]>([
    'Kepala DPMPTSP Provinsi DKI Jakarta;',
    'Inspektorat Pembantu Kota Adm Jaksel'
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeLetterId, setActiveLetterId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kp_active_letter_id') || '';
    }
    return '';
  });
  const [companySearchQuery, setCompanySearchQuery] = useState<string>('');
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const hasUserEditedRef = React.useRef<boolean>(false);
  const lastAppliedCompanyKeyRef = React.useRef<string>('');
  const skipNextCompanySyncRef = React.useRef<boolean>(false);
  const canEditDatabase = currentUserRole === 'koordinator' || currentUserRole === 'superadmin';
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [editRowForm, setEditRowForm] = useState<{
    letterNumber: string;
    companyName: string;
    docBuildingName: string;
    docPrimaryNumber: string;
    docPrimaryExpiry: string;
    docSecondaryNumberDate: string;
    docSecondaryExpiry: string;
    status: WarningLetter['status'];
  } | null>(null);

  const filteredCompanies = companies.filter((c) => {
    const q = companySearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.nib || '').toLowerCase().includes(q) ||
      (c.sector || '').toLowerCase().includes(q)
    );
  });

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const preset = TEMPLATE_PRESETS[templateMode];

  const markEdited = () => {
    hasUserEditedRef.current = true;
    if (!hasUserEdited) setHasUserEdited(true);
  };

  // Restore last active letter from database on initial mount (when no explicit initialItem)
  useEffect(() => {
    if (initialItem || !activeLetterId || savedLetters.length === 0) return;
    const found = savedLetters.find((l) => l.id === activeLetterId);
    if (!found) return;

    skipNextCompanySyncRef.current = true;
    const restoredMode: LetterTemplateMode = found.templateMode || 'SLF_RKK';
    lastAppliedCompanyKeyRef.current = `${found.companyId && found.companyId !== 'comp-custom' ? found.companyId : ''}::${restoredMode}`;

    setTemplateMode(restoredMode);
    if (found.companyId && found.companyId !== 'comp-custom' && companies.some((c) => c.id === found.companyId)) {
      setSelectedCompanyId(found.companyId);
    }
    setLetterNumber(found.letterNumber || '[NOMOR SURAT]');
    setLetterDate(found.letterDate || new Date().toISOString().split('T')[0]);
    if (found.letterSifat) setLetterSifat(found.letterSifat);
    if (found.letterAttachment !== undefined) setLetterAttachment(found.letterAttachment);
    if (found.letterCity) setLetterCity(found.letterCity);
    if (found.subject) setSubjectTitle(found.subject);
    if (found.recipientName) setRecipientOwnerName(found.recipientName);
    if (found.recipientRole) setRecipientObjectName(found.recipientRole);
    if (found.recipientEmail) setRecipientEmail(found.recipientEmail);
    if (found.recipientLocation) setRecipientLocation(found.recipientLocation);
    if (found.additionalNotes) setOpeningText(found.additionalNotes);
    if (found.companyName) setDocOwner(found.companyName);
    if (found.docBuildingName !== undefined) setDocBuildingName(found.docBuildingName);
    if (found.companyAddress) setDocAddress(found.companyAddress);
    if (found.docPrimaryNumber !== undefined) setDocPrimaryNumber(found.docPrimaryNumber);
    if (found.docPrimaryDate !== undefined) setDocPrimaryDate(found.docPrimaryDate);
    if (found.docPrimaryExpiry !== undefined) setDocPrimaryExpiry(found.docPrimaryExpiry);
    if (found.docSecondaryNumberDate !== undefined) setDocSecondaryNumberDate(found.docSecondaryNumberDate);
    if (found.docSecondaryExpiry !== undefined) setDocSecondaryExpiry(found.docSecondaryExpiry);
    if (found.picOfficerName) setPicOfficerName(found.picOfficerName);
    if (found.picOfficerPhone !== undefined) setPicOfficerPhone(found.picOfficerPhone);
  }, []);

  // Switch template texts cleanly
  const applyTemplateMode = (mode: LetterTemplateMode) => {
    if (hasUserEditedRef.current) {
      syncAllToDatabase();
    }
    hasUserEditedRef.current = false;
    setHasUserEdited(false);
    setActiveLetterId('');
    localStorage.removeItem('kp_active_letter_id');
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
    setActiveLetterId('');
    localStorage.removeItem('kp_active_letter_id');
    setHasUserEdited(false);
    lastAppliedCompanyKeyRef.current = '';
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

  // Populate fields from selected company (checking recorded savedLetters first, then permits) ONLY when entity or template changes
  useEffect(() => {
    if (skipNextCompanySyncRef.current) {
      skipNextCompanySyncRef.current = false;
      return;
    }

    const effectiveCompanyId = selectedCompany?.id || '';
    const companyKey = `${effectiveCompanyId}::${templateMode}`;
    if (lastAppliedCompanyKeyRef.current === companyKey) return;
    lastAppliedCompanyKeyRef.current = companyKey;

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

    const compPermits = permits.filter((item) => {
      const bothHaveAddr = Boolean(normalizeAddress(item.address) && normalizeAddress(selectedCompany.address));
      return (
        (item.companyId === selectedCompany.id && (!bothHaveAddr || isSameAddress(item.address, selectedCompany.address))) ||
        isSameCompanyEntity(
          { name: item.companyName, address: item.address, nib: item.nib },
          selectedCompany
        )
      );
    });

    const firstWithAddress = compPermits.find((item) => item.address);
    const firstWithUsage = compPermits.find((item) => item.usage);

    const primaryPermit =
      templateMode === 'SLF_RKK'
        ? compPermits.find((item) => /slf|laik fungsi/i.test(`${item.permitName} ${item.category}`))
        : compPermits.find((item) => /pbg|persetujuan bangunan/i.test(`${item.permitName} ${item.category}`));

    const secondaryPermit =
      templateMode === 'SLF_RKK'
        ? compPermits.find((item) => /rkk|skk|kebakaran|damkar/i.test(`${item.permitName} ${item.category}`))
        : compPermits.find((item) => /ipr|reklame/i.test(`${item.permitName} ${item.category}`));

    const permitPrimaryNumber = primaryPermit?.documentNumber || '';
    const permitPrimaryDate = primaryPermit
      ? primaryPermit.rawIssuedText ?? (primaryPermit.issuedDate ? formatIndonesianDate(primaryPermit.issuedDate) : '')
      : '';
    const permitPrimaryExpiry = primaryPermit
      ? primaryPermit.rawExpiryText ?? (primaryPermit.expiryDate ? formatIndonesianDate(primaryPermit.expiryDate) : '')
      : '';
    const permitSecondaryNumberDate = secondaryPermit
      ? secondaryPermit.rawIssuedText ??
        [
          secondaryPermit.documentNumber,
          secondaryPermit.issuedDate ? formatIndonesianDate(secondaryPermit.issuedDate) : ''
        ]
          .filter(Boolean)
          .join(' / ')
      : '';
    const permitSecondaryExpiry = secondaryPermit
      ? secondaryPermit.rawExpiryText ?? (secondaryPermit.expiryDate ? formatIndonesianDate(secondaryPermit.expiryDate) : '')
      : '';

    // Check if there is already a recorded letter in database for this company + templateMode
    const recordedLetter = savedLetters.find((l) => {
      const sameMode = (l.templateMode || 'SLF_RKK') === templateMode;
      if (!sameMode) return false;
      if (l.companyId === selectedCompany.id) return true;
      return isSameCompanyEntity({ name: l.companyName, address: l.companyAddress }, selectedCompany);
    });

    if (recordedLetter) {
      setActiveLetterId(recordedLetter.id);
      localStorage.setItem('kp_active_letter_id', recordedLetter.id);
      setLetterNumber(recordedLetter.letterNumber || '[NOMOR SURAT]');
      setLetterDate(recordedLetter.letterDate || new Date().toISOString().split('T')[0]);
      if (recordedLetter.letterSifat) setLetterSifat(recordedLetter.letterSifat);
      if (recordedLetter.letterAttachment !== undefined) setLetterAttachment(recordedLetter.letterAttachment);
      if (recordedLetter.letterCity) setLetterCity(recordedLetter.letterCity);
      if (recordedLetter.subject) setSubjectTitle(recordedLetter.subject);
      setRecipientOwnerName(recordedLetter.recipientName || selectedCompany.name);
      setRecipientObjectName(recordedLetter.recipientRole || firstWithUsage?.usage || selectedCompany.sector || p.recipientPlaceholderObject);
      setRecipientEmail(recordedLetter.recipientEmail || selectedCompany.picEmail || 'andri.cimb@gmail.com');
      if (recordedLetter.recipientLocation) setRecipientLocation(recordedLetter.recipientLocation);
      if (recordedLetter.additionalNotes) setOpeningText(recordedLetter.additionalNotes);

      setDocOwner(recordedLetter.companyName || selectedCompany.name);
      setDocBuildingName(recordedLetter.docBuildingName ?? (firstWithUsage?.usage || selectedCompany.sector || ''));
      setDocAddress(recordedLetter.companyAddress || firstWithAddress?.address || selectedCompany.address || '');
      setDocPrimaryNumber(recordedLetter.docPrimaryNumber !== undefined ? recordedLetter.docPrimaryNumber : permitPrimaryNumber);
      setDocPrimaryDate(recordedLetter.docPrimaryDate !== undefined ? recordedLetter.docPrimaryDate : permitPrimaryDate);
      setDocPrimaryExpiry(recordedLetter.docPrimaryExpiry !== undefined ? recordedLetter.docPrimaryExpiry : permitPrimaryExpiry);
      setDocSecondaryNumberDate(recordedLetter.docSecondaryNumberDate !== undefined ? recordedLetter.docSecondaryNumberDate : permitSecondaryNumberDate);
      setDocSecondaryExpiry(recordedLetter.docSecondaryExpiry !== undefined ? recordedLetter.docSecondaryExpiry : permitSecondaryExpiry);
      return;
    }

    setLetterNumber('[NOMOR SURAT]');
    setRecipientOwnerName(selectedCompany.name);
    setRecipientObjectName(firstWithUsage?.usage || selectedCompany.sector || p.recipientPlaceholderObject);
    setRecipientEmail(selectedCompany.picEmail || 'andri.cimb@gmail.com');

    setDocOwner(selectedCompany.name);
    setDocBuildingName(firstWithUsage?.usage || selectedCompany.sector || '');
    setDocAddress(firstWithAddress?.address || selectedCompany.address || '');
    setDocPrimaryNumber(permitPrimaryNumber);
    setDocPrimaryDate(permitPrimaryDate);
    setDocPrimaryExpiry(permitPrimaryExpiry);
    setDocSecondaryNumberDate(permitSecondaryNumberDate);
    setDocSecondaryExpiry(permitSecondaryExpiry);
  }, [selectedCompanyId, templateMode, permits, companies, savedLetters]);

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

  const parseSecondaryInput = (raw: string): { documentNumber: string; issuedDateRaw: string } => {
    const trimmed = raw.trim();
    if (!trimmed) return { documentNumber: '', issuedDateRaw: '' };
    const slashSplit = trimmed.split(/\s+\/\s+/);
    if (slashSplit.length >= 2) {
      return {
        documentNumber: slashSplit[0].trim(),
        issuedDateRaw: slashSplit.slice(1).join(' / ').trim()
      };
    }
    return { documentNumber: trimmed, issuedDateRaw: '' };
  };

  const buildArchivePayload = (status: WarningLetter['status'], explicitId?: string): WarningLetter => {
    const existingRecord = explicitId ? savedLetters.find((l) => l.id === explicitId) : undefined;
    const resolvedId = explicitId || activeLetterId || `letter-${Date.now()}`;

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

    if (docSecondaryNumberDate.trim() || docSecondaryExpiry.trim()) {
      items.push({
        itemType: 'PERMIT',
        itemName: preset.secondaryDocLabel,
        referenceNumber: docSecondaryNumberDate || '-',
        deadlineOrExpiry: docSecondaryExpiry || letterDate,
        daysRemainingOrOverdue: 0,
        legalBasis: 'Peraturan Pemerintah Nomor 16 Tahun 2021',
        actionRequired: `Pembaruan ${preset.secondaryDocLabel}`
      });
    }

    return {
      id: resolvedId,
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
      generatedAt: existingRecord?.generatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status,
      templateMode,
      letterSifat,
      letterAttachment,
      letterCity,
      recipientLocation,
      docBuildingName,
      docPrimaryNumber,
      docPrimaryDate,
      docPrimaryExpiry,
      docSecondaryNumberDate,
      docSecondaryExpiry,
      picOfficerName,
      picOfficerPhone
    };
  };

  const syncAllToDatabase = (forcedStatus?: WarningLetter['status']) => {
    const hasMeaningfulInput =
      (letterNumber.trim() && letterNumber.trim() !== '[NOMOR SURAT]') ||
      Boolean(docSecondaryNumberDate.trim()) ||
      Boolean(docSecondaryExpiry.trim()) ||
      Boolean(docPrimaryNumber.trim()) ||
      Boolean(docPrimaryDate.trim()) ||
      Boolean(docPrimaryExpiry.trim()) ||
      Boolean(docOwner.trim() && !docOwner.trim().startsWith('[')) ||
      Boolean(docBuildingName.trim()) ||
      Boolean(docAddress.trim());

    if (!forcedStatus && !hasMeaningfulInput) return;

    const currentId = activeLetterId || `letter-${Date.now()}`;
    if (currentId !== activeLetterId) {
      setActiveLetterId(currentId);
      localStorage.setItem('kp_active_letter_id', currentId);
    }

    const existing = savedLetters.find((l) => l.id === currentId);
    const resolvedStatus: WarningLetter['status'] =
      forcedStatus || existing?.status || 'Draf';

    const payload = buildArchivePayload(resolvedStatus, currentId);
    if (onUpsertLetter) {
      onUpsertLetter(payload);
    }

    // Sync entered document data (RKK/SKK or IPR, and SLF/PBG BR) into kp_permits & kp_companies
    const targetCompanyName =
      (docOwner && !docOwner.startsWith('[') ? docOwner : '') ||
      (recipientOwnerName && !recipientOwnerName.startsWith('[') ? recipientOwnerName : '') ||
      selectedCompany?.name ||
      '';

    if (onSyncPermitFromLetter && targetCompanyName) {
      if (docPrimaryNumber.trim() || docPrimaryDate.trim() || docPrimaryExpiry.trim()) {
        onSyncPermitFromLetter({
          companyId: selectedCompany?.id,
          companyName: targetCompanyName,
          buildingName: docBuildingName || recipientObjectName,
          address: docAddress || selectedCompany?.address || 'Jakarta Selatan',
          picEmail: recipientEmail,
          docKind: 'PRIMARY',
          templateMode,
          documentNumber: docPrimaryNumber.trim(),
          issuedDateRaw: docPrimaryDate.trim(),
          expiryDateRaw: docPrimaryExpiry.trim(),
          rawIssuedText: docPrimaryDate.trim(),
          rawExpiryText: docPrimaryExpiry.trim()
        });
      }

      if (docSecondaryNumberDate.trim() || docSecondaryExpiry.trim()) {
        const parsedSec = parseSecondaryInput(docSecondaryNumberDate);
        onSyncPermitFromLetter({
          companyId: selectedCompany?.id,
          companyName: targetCompanyName,
          buildingName: docBuildingName || recipientObjectName,
          address: docAddress || selectedCompany?.address || 'Jakarta Selatan',
          picEmail: recipientEmail,
          docKind: 'SECONDARY',
          templateMode,
          documentNumber: parsedSec.documentNumber,
          issuedDateRaw: parsedSec.issuedDateRaw,
          expiryDateRaw: docSecondaryExpiry.trim(),
          rawIssuedText: docSecondaryNumberDate.trim(),
          rawExpiryText: docSecondaryExpiry.trim()
        });
      }
    }

    setLastSavedAt(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );

    return payload;
  };

  const syncAllToDatabaseRef = React.useRef(syncAllToDatabase);
  syncAllToDatabaseRef.current = syncAllToDatabase;

  // Flush any pending edits automatically if component unmounts (e.g. tab switch)
  useEffect(() => {
    return () => {
      if (hasUserEditedRef.current) {
        syncAllToDatabaseRef.current();
      }
    };
  }, []);

  // Debounced auto-record every edit to database (kp_letters & kp_permits)
  useEffect(() => {
    if (!hasUserEdited) return;
    const timer = setTimeout(() => {
      syncAllToDatabase();
    }, 350);
    return () => clearTimeout(timer);
  }, [
    hasUserEdited,
    letterNumber,
    letterSifat,
    letterAttachment,
    letterCity,
    letterDate,
    subjectTitle,
    recipientOwnerName,
    recipientObjectName,
    recipientLocation,
    recipientEmail,
    openingText,
    docOwner,
    docBuildingName,
    docAddress,
    docPrimaryNumber,
    docPrimaryDate,
    docPrimaryExpiry,
    docSecondaryNumberDate,
    docSecondaryExpiry,
    picOfficerName,
    picOfficerPhone,
    templateMode
  ]);

  const handleSelectCompanyChange = (newCompanyId: string) => {
    if (hasUserEditedRef.current) {
      syncAllToDatabase();
    }
    hasUserEditedRef.current = false;
    setHasUserEdited(false);
    setActiveLetterId('');
    localStorage.removeItem('kp_active_letter_id');
    lastAppliedCompanyKeyRef.current = '';
    setSelectedCompanyId(newCompanyId);
  };

  const handleCreateNewLetter = () => {
    setActiveLetterId('');
    localStorage.removeItem('kp_active_letter_id');
    hasUserEditedRef.current = false;
    setHasUserEdited(false);
    setLetterNumber('[NOMOR SURAT]');
    setLetterDate(new Date().toISOString().split('T')[0]);
    lastAppliedCompanyKeyRef.current = '';
    setToastMessage('Siap membuat draf surat baru. Setiap input tetap otomatis terekam ke database.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoadSavedLetter = (letter: WarningLetter) => {
    skipNextCompanySyncRef.current = true;
    const mode: LetterTemplateMode = letter.templateMode || 'SLF_RKK';
    lastAppliedCompanyKeyRef.current = `${letter.companyId && letter.companyId !== 'comp-custom' ? letter.companyId : ''}::${mode}`;
    setActiveLetterId(letter.id);
    localStorage.setItem('kp_active_letter_id', letter.id);
    setHasUserEdited(false);

    setTemplateMode(mode);
    if (letter.companyId && letter.companyId !== 'comp-custom' && companies.some((c) => c.id === letter.companyId)) {
      setSelectedCompanyId(letter.companyId);
    }
    setLetterNumber(letter.letterNumber || '[NOMOR SURAT]');
    setLetterDate(letter.letterDate || new Date().toISOString().split('T')[0]);
    if (letter.letterSifat) setLetterSifat(letter.letterSifat);
    if (letter.letterAttachment !== undefined) setLetterAttachment(letter.letterAttachment);
    if (letter.letterCity) setLetterCity(letter.letterCity);
    if (letter.subject) setSubjectTitle(letter.subject);
    if (letter.recipientName) setRecipientOwnerName(letter.recipientName);
    if (letter.recipientRole) setRecipientObjectName(letter.recipientRole);
    if (letter.recipientEmail) setRecipientEmail(letter.recipientEmail);
    if (letter.recipientLocation) setRecipientLocation(letter.recipientLocation);
    if (letter.additionalNotes) setOpeningText(letter.additionalNotes);
    setDocOwner(letter.companyName || '');
    setDocBuildingName(letter.docBuildingName || letter.recipientRole || '');
    setDocAddress(letter.companyAddress || '');
    setDocPrimaryNumber(letter.docPrimaryNumber || '');
    setDocPrimaryDate(letter.docPrimaryDate || '');
    setDocPrimaryExpiry(letter.docPrimaryExpiry || '');
    setDocSecondaryNumberDate(letter.docSecondaryNumberDate || '');
    setDocSecondaryExpiry(letter.docSecondaryExpiry || '');
    if (letter.picOfficerName) setPicOfficerName(letter.picOfficerName);
    if (letter.picOfficerPhone !== undefined) setPicOfficerPhone(letter.picOfficerPhone);

    setToastMessage(`Data surat "${letter.letterNumber}" dimuat dari database.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrint = () => {
    const payload = syncAllToDatabase('Diterbitkan');
    if (payload) {
      onSaveLetter(payload);
    }
    hasUserEditedRef.current = false;
    setHasUserEdited(false);
    window.print();
  };

  const handleSaveDraft = () => {
    const currentId = activeLetterId || `letter-${Date.now()}`;
    setActiveLetterId(currentId);
    localStorage.setItem('kp_active_letter_id', currentId);
    const payload = syncAllToDatabase('Diterbitkan') || buildArchivePayload('Diterbitkan', currentId);
    onSaveLetter(payload);
    hasUserEditedRef.current = false;
    setHasUserEdited(false);
    setToastMessage('Surat & seluruh data terinput berhasil disimpan ke database!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendEmail = () => {
    const currentId = activeLetterId || `letter-${Date.now()}`;
    setActiveLetterId(currentId);
    localStorage.setItem('kp_active_letter_id', currentId);
    const payload = syncAllToDatabase('Terkirim via Email') || buildArchivePayload('Terkirim via Email', currentId);
    onSendEmailWithLetter(payload);
    hasUserEditedRef.current = false;
    setHasUserEdited(false);
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
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Pilih Entitas / Pemilik:</span>
          {companies.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={companySearchQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setCompanySearchQuery(q);
                  const lower = q.trim().toLowerCase();
                  if (lower) {
                    const matched = companies.filter(
                      (c) =>
                        c.name.toLowerCase().includes(lower) ||
                        (c.address || '').toLowerCase().includes(lower) ||
                        (c.nib || '').toLowerCase().includes(lower)
                    );
                    if (matched.length > 0 && matched[0].id !== selectedCompanyId) {
                      handleSelectCompanyChange(matched[0].id);
                    }
                  }
                }}
                placeholder="Cari nama PT / alamat..."
                className="text-xs pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white w-48"
              />
            </div>
          )}
          <select
            value={selectedCompanyId}
            onChange={(e) => handleSelectCompanyChange(e.target.value)}
            className="text-xs p-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white max-w-xs"
          >
            {companies.length === 0 ? (
              <option value="">(Gunakan Template Kosong / Isi Manual)</option>
            ) : filteredCompanies.length === 0 ? (
              <option value={selectedCompanyId}>Tidak ada PT cocok dengan "{companySearchQuery}"</option>
            ) : (
              filteredCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCompanyOptionLabel(c)}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={handleCreateNewLetter}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center space-x-1 transition"
            title="Buat surat baru tanpa menimpa arsip sebelumnya"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Surat Baru</span>
          </button>

          {lastSavedAt && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Terekam di Database ({lastSavedAt})</span>
            </span>
          )}
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
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 no-print shadow-sm">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Edit Dokumen Aktif:</strong> Klik teks atau kolom tabel pada surat di bawah untuk mengubah data surat. Nama PIC &amp; No. HP otomatis diambil dari <strong>Profil User</strong> aktif{currentUserPhone ? ` (${currentUserPhone})` : ' (belum diisi pada Profil User)'}.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-auto">
            {onUpdateUserPhone && picOfficerPhone.trim() !== (currentUserPhone || '').trim() && (
              <button
                type="button"
                onClick={() => onUpdateUserPhone(picOfficerPhone.trim())}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 transition"
                title="Simpan No. HP ini ke data Profil User aktif"
              >
                <Save className="w-3 h-3" />
                <span>Simpan No. HP ke Profil</span>
              </button>
            )}
            <button
              onClick={() => {
                if (hasUserEditedRef.current) {
                  syncAllToDatabase();
                }
                setIsEditMode(false);
              }}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px]"
            >
              Selesai Mengedit
            </button>
          </div>
        </div>
      )}

      {/* Official Printable Letter Paper (#surat-teguran-print) */}
      <div className="bg-slate-200 p-3 sm:p-8 rounded-2xl flex justify-center shadow-inner print:bg-white print:p-0 print:rounded-none print:shadow-none print:block">
        <div
          id="surat-teguran-print"
          className="bg-white text-slate-950 shadow-2xl px-8 py-8 sm:px-14 sm:py-10 max-w-[820px] w-full font-sans text-[12.5px] leading-[1.45] relative border border-slate-300 print:max-w-none print:w-full print:px-0 print:py-0 print:border-0 print:shadow-none"
          style={{ minHeight: '1240px' }}
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
                        onChange={(e) => {
                          markEdited();
                          setLetterNumber(e.target.value);
                        }}
                        onBlur={() => syncAllToDatabase()}
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
                          onChange={(e) => {
                            markEdited();
                            row.setter(e.target.value);
                          }}
                          onBlur={() => syncAllToDatabase()}
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
                <>
                  <input
                    type="text"
                    value={picOfficerName}
                    onChange={(e) => setPicOfficerName(e.target.value)}
                    className="inline-block w-48 border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px] font-semibold"
                  />
                  {' '}(No. HP:{' '}
                  <input
                    type="tel"
                    value={picOfficerPhone}
                    onChange={(e) => setPicOfficerPhone(e.target.value)}
                    placeholder={currentUserPhone ? currentUserPhone : 'Isi No. HP di Profil User'}
                    title="Otomatis mengambil No. HP dari data Profil User aktif"
                    className="inline-block w-40 border border-dashed border-amber-400 bg-amber-50/40 rounded px-1.5 py-0.5 text-[12px] font-mono"
                  />
                  )
                </>
              ) : (
                <>
                  <span className="font-semibold">{picOfficerName}</span>
                  {picOfficerPhone.trim() ? ` (No. HP: ${picOfficerPhone.trim()})` : ''}
                </>
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

      {/* Database Recorded Letters & Document Inputs History (hidden on print) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Surat &amp; Data Terinput di Database ({savedLetters.length})
              </h3>
              <p className="text-xs text-slate-500">
                {canEditDatabase
                  ? 'Setiap input otomatis terekam ke database. User Koordinator dapat mengubah langsung data pada baris tabel di bawah.'
                  : 'Setiap input Nomor Surat, data RKK/SKK atau IPR, dan kelengkapan dokumen otomatis terekam ke database surat & perizinan.'}
              </p>
            </div>
          </div>
        </div>

        {savedLetters.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Belum ada data surat terekam. Mulai ketik Nomor Surat atau data dokumen pada surat di atas untuk merekam otomatis ke database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-bold">Nomor Surat</th>
                  <th className="py-2.5 px-3 font-bold">Pemilik / Bangunan</th>
                  <th className="py-2.5 px-3 font-bold">Dokumen Utama (SLF / PBG BR)</th>
                  <th className="py-2.5 px-3 font-bold">RKK/SKK atau IPR</th>
                  <th className="py-2.5 px-3 font-bold">Masa Berlaku RKK/SKK / IPR</th>
                  <th className="py-2.5 px-3 font-bold">Status &amp; Waktu</th>
                  <th className="py-2.5 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedLetters.map((letter) => {
                  const isActiveRow = letter.id === activeLetterId;
                  const isRowEditing = canEditDatabase && editingLetterId === letter.id && editRowForm !== null;

                  const startRowEdit = () => {
                    if (!canEditDatabase) return;
                    setEditingLetterId(letter.id);
                    setEditRowForm({
                      letterNumber: letter.letterNumber || '',
                      companyName: letter.companyName || '',
                      docBuildingName: letter.docBuildingName || letter.recipientRole || '',
                      docPrimaryNumber: letter.docPrimaryNumber || '',
                      docPrimaryExpiry: letter.docPrimaryExpiry || '',
                      docSecondaryNumberDate: letter.docSecondaryNumberDate || '',
                      docSecondaryExpiry: letter.docSecondaryExpiry || '',
                      status: letter.status
                    });
                  };

                  const saveRowEdit = () => {
                    if (!canEditDatabase || !editRowForm) return;
                    const updatedLetter: WarningLetter = {
                      ...letter,
                      letterNumber: editRowForm.letterNumber.trim() || letter.letterNumber,
                      companyName: editRowForm.companyName.trim() || letter.companyName,
                      recipientName: editRowForm.companyName.trim() || letter.recipientName,
                      docBuildingName: editRowForm.docBuildingName.trim(),
                      recipientRole: editRowForm.docBuildingName.trim() || letter.recipientRole,
                      docPrimaryNumber: editRowForm.docPrimaryNumber.trim(),
                      docPrimaryExpiry: editRowForm.docPrimaryExpiry.trim(),
                      docSecondaryNumberDate: editRowForm.docSecondaryNumberDate.trim(),
                      docSecondaryExpiry: editRowForm.docSecondaryExpiry.trim(),
                      status: editRowForm.status,
                      updatedAt: new Date().toISOString()
                    };

                    if (onUpsertLetter) {
                      onUpsertLetter(updatedLetter);
                    }

                    const targetMode: LetterTemplateMode = updatedLetter.templateMode || 'SLF_RKK';
                    if (onSyncPermitFromLetter && updatedLetter.companyName && !updatedLetter.companyName.startsWith('[')) {
                      if (updatedLetter.docPrimaryNumber?.trim() || updatedLetter.docPrimaryExpiry?.trim()) {
                        onSyncPermitFromLetter({
                          companyId: updatedLetter.companyId !== 'comp-custom' ? updatedLetter.companyId : undefined,
                          companyName: updatedLetter.companyName,
                          buildingName: updatedLetter.docBuildingName || updatedLetter.recipientRole,
                          address: updatedLetter.companyAddress || 'Jakarta Selatan',
                          picEmail: updatedLetter.recipientEmail,
                          docKind: 'PRIMARY',
                          templateMode: targetMode,
                          documentNumber: (updatedLetter.docPrimaryNumber || '').trim(),
                          issuedDateRaw: (updatedLetter.docPrimaryDate || '').trim(),
                          expiryDateRaw: (updatedLetter.docPrimaryExpiry || '').trim(),
                          rawIssuedText: (updatedLetter.docPrimaryDate || '').trim(),
                          rawExpiryText: (updatedLetter.docPrimaryExpiry || '').trim()
                        });
                      }

                      if (updatedLetter.docSecondaryNumberDate?.trim() || updatedLetter.docSecondaryExpiry?.trim()) {
                        const parsedSec = parseSecondaryInput(updatedLetter.docSecondaryNumberDate || '');
                        onSyncPermitFromLetter({
                          companyId: updatedLetter.companyId !== 'comp-custom' ? updatedLetter.companyId : undefined,
                          companyName: updatedLetter.companyName,
                          buildingName: updatedLetter.docBuildingName || updatedLetter.recipientRole,
                          address: updatedLetter.companyAddress || 'Jakarta Selatan',
                          picEmail: updatedLetter.recipientEmail,
                          docKind: 'SECONDARY',
                          templateMode: targetMode,
                          documentNumber: parsedSec.documentNumber,
                          issuedDateRaw: parsedSec.issuedDateRaw,
                          expiryDateRaw: (updatedLetter.docSecondaryExpiry || '').trim(),
                          rawIssuedText: (updatedLetter.docSecondaryNumberDate || '').trim(),
                          rawExpiryText: (updatedLetter.docSecondaryExpiry || '').trim()
                        });
                      }
                    }

                    if (letter.id === activeLetterId) {
                      setLetterNumber(updatedLetter.letterNumber);
                      setDocOwner(updatedLetter.companyName);
                      setRecipientOwnerName(updatedLetter.recipientName);
                      setDocBuildingName(updatedLetter.docBuildingName || '');
                      setRecipientObjectName(updatedLetter.recipientRole);
                      setDocPrimaryNumber(updatedLetter.docPrimaryNumber || '');
                      setDocPrimaryExpiry(updatedLetter.docPrimaryExpiry || '');
                      setDocSecondaryNumberDate(updatedLetter.docSecondaryNumberDate || '');
                      setDocSecondaryExpiry(updatedLetter.docSecondaryExpiry || '');
                    }

                    setLastSavedAt(
                      new Date().toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    );
                    setEditingLetterId(null);
                    setEditRowForm(null);
                    setToastMessage(`Data database "${updatedLetter.letterNumber}" berhasil diperbarui!`);
                    setTimeout(() => setToastMessage(null), 3500);
                  };

                  return (
                    <tr
                      key={letter.id}
                      className={
                        isRowEditing
                          ? 'bg-sky-50/80'
                          : isActiveRow
                          ? 'bg-amber-50/70'
                          : 'hover:bg-slate-50/80'
                      }
                    >
                      <td
                        className={`py-2.5 px-3 font-mono font-semibold text-slate-900 ${
                          canEditDatabase && !isRowEditing ? 'cursor-pointer hover:text-indigo-700' : ''
                        }`}
                        onClick={() => {
                          if (canEditDatabase && !isRowEditing) startRowEdit();
                        }}
                        title={canEditDatabase && !isRowEditing ? 'Klik untuk mengubah data di database' : undefined}
                      >
                        {isRowEditing && editRowForm ? (
                          <input
                            type="text"
                            value={editRowForm.letterNumber}
                            onChange={(e) => setEditRowForm({ ...editRowForm, letterNumber: e.target.value })}
                            className="w-full min-w-[140px] px-2 py-1 text-xs font-mono border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          letter.letterNumber || '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isRowEditing && editRowForm ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editRowForm.companyName}
                              onChange={(e) => setEditRowForm({ ...editRowForm, companyName: e.target.value })}
                              placeholder="Nama Pemilik / PT"
                              className="w-full min-w-[150px] px-2 py-1 text-xs font-semibold border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={editRowForm.docBuildingName}
                              onChange={(e) => setEditRowForm({ ...editRowForm, docBuildingName: e.target.value })}
                              placeholder="Nama Bangunan"
                              className="w-full min-w-[150px] px-2 py-1 text-[11px] border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-900">{letter.companyName || '-'}</div>
                            <div className="text-[11px] text-slate-500">{letter.docBuildingName || letter.recipientRole || '-'}</div>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {isRowEditing && editRowForm ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editRowForm.docPrimaryNumber}
                              onChange={(e) => setEditRowForm({ ...editRowForm, docPrimaryNumber: e.target.value })}
                              placeholder="Nomor SLF / PBG BR"
                              className="w-full min-w-[140px] px-2 py-1 text-xs border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={editRowForm.docPrimaryExpiry}
                              onChange={(e) => setEditRowForm({ ...editRowForm, docPrimaryExpiry: e.target.value })}
                              placeholder="Masa Berlaku s.d."
                              className="w-full min-w-[140px] px-2 py-1 text-[11px] border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ) : (
                          <>
                            <div>{letter.docPrimaryNumber || '-'}</div>
                            {letter.docPrimaryExpiry && (
                              <div className="text-[11px] text-slate-500">s.d. {letter.docPrimaryExpiry}</div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {isRowEditing && editRowForm ? (
                          <input
                            type="text"
                            value={editRowForm.docSecondaryNumberDate}
                            onChange={(e) => setEditRowForm({ ...editRowForm, docSecondaryNumberDate: e.target.value })}
                            placeholder="Nomor/Tgl RKK/SKK atau IPR"
                            className="w-full min-w-[140px] px-2 py-1 text-xs border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          letter.docSecondaryNumberDate || '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {isRowEditing && editRowForm ? (
                          <input
                            type="text"
                            value={editRowForm.docSecondaryExpiry}
                            onChange={(e) => setEditRowForm({ ...editRowForm, docSecondaryExpiry: e.target.value })}
                            placeholder="Masa Berlaku RKK/SKK / IPR"
                            className="w-full min-w-[130px] px-2 py-1 text-xs border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          letter.docSecondaryExpiry || '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isRowEditing && editRowForm ? (
                          <select
                            value={editRowForm.status}
                            onChange={(e) =>
                              setEditRowForm({
                                ...editRowForm,
                                status: e.target.value as WarningLetter['status']
                              })
                            }
                            className="px-2 py-1 text-[11px] font-semibold border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="Draf">Draf</option>
                            <option value="Diterbitkan">Diterbitkan</option>
                            <option value="Terkirim via Email">Terkirim via Email</option>
                            <option value="Ditindaklanjuti">Ditindaklanjuti</option>
                          </select>
                        ) : (
                          <>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                letter.status === 'Terkirim via Email'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : letter.status === 'Diterbitkan'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {letter.status}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{(letter.updatedAt || letter.generatedAt || '').replace('T', ' ').slice(0, 16)}</span>
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {isRowEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={saveRowEdit}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center space-x-1 transition"
                                title="Simpan perubahan ke database"
                              >
                                <Save className="w-3 h-3" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLetterId(null);
                                  setEditRowForm(null);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition"
                                title="Batal ubah"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              {canEditDatabase && (
                                <button
                                  type="button"
                                  onClick={startRowEdit}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200 inline-flex items-center space-x-1 transition"
                                  title="Ubah langsung data database ini"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Ubah</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleLoadSavedLetter(letter)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 inline-flex items-center space-x-1 transition"
                              >
                                <FolderOpen className="w-3 h-3" />
                                <span>{isActiveRow ? 'Aktif' : 'Buka'}</span>
                              </button>
                              {canEditDatabase && onDeleteLetter && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (letter.id === activeLetterId) {
                                      setActiveLetterId('');
                                      localStorage.removeItem('kp_active_letter_id');
                                    }
                                    onDeleteLetter(letter.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                                  title="Hapus rekaman surat dari database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

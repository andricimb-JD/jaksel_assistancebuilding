import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PermitsManager } from './components/PermitsManager';
import { LKPMManager } from './components/LKPMManager';
import { BulkUploadLKPM } from './components/BulkUploadLKPM';
import { WarningLetterGenerator } from './components/WarningLetterGenerator';
import { EmailNotificationCenter } from './components/EmailNotificationCenter';
import { RealTimeTracker } from './components/RealTimeTracker';
import { NIBComparisonView } from './components/NIBComparisonView';
import { UnifiedUploadView } from './components/UnifiedUploadView';
import { LoginView } from './components/LoginView';
import { UserManagementView } from './components/UserManagementView';
import { BuildingControlView } from './components/BuildingControlView';

import { 
  Permit, 
  LKPMRecord, 
  WarningLetter, 
  EmailLog, 
  Company, 
  ComplianceLogEvent,
  UserAccount,
  FollowUpStatus,
  ConsultationApplication,
  ConsultationStatus
} from './types';

import { 
  INITIAL_COMPANIES, 
  INITIAL_PERMITS, 
  INITIAL_LKPM_RECORDS, 
  INITIAL_WARNING_LETTERS, 
  INITIAL_EMAIL_LOGS, 
  INITIAL_COMPLIANCE_EVENTS,
  DEFAULT_USERS,
  INITIAL_CONSULTATIONS
} from './data/mockData';

import { 
  calculateDaysRemaining, 
  generateEmailNotificationTemplate, 
  formatIndonesianDate 
} from './utils/helpers';

export default function App() {
  // Authentication State (Enforces username and password login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('kp_isAuthenticated') === 'true';
  });

  // Users List with Persistence - Clean legacy sample users
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('kp_users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove old sample users except superadmin and newly registered users
          const sampleIdsToDelete = ['user-koordinator', 'user-petugas', 'user-monitor', 'user-usaha'];
          const filtered = parsed.filter(u => !sampleIdsToDelete.includes(u.id));
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_USERS;
  });

  useEffect(() => {
    localStorage.setItem('kp_users_list', JSON.stringify(users));
  }, [users]);

  // Active User Account (RBAC)
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('kp_currentUser');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sampleIdsToDelete = ['user-koordinator', 'user-petugas', 'user-monitor', 'user-usaha'];
        if (parsed && !sampleIdsToDelete.includes(parsed.id)) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_USERS[0]; // Default Super Admin
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (currentUser.role === 'superadmin') return 'users';
    if (currentUser.role === 'pelaku_usaha') return 'building_control';
    if (currentUser.role === 'petugas') return 'upload';
    if (currentUser.role === 'monitor') return 'dashboard';
    return 'dashboard';
  });

  // Clean empty slate key to guarantee empty datasets
  const CLEAN_SLATE_KEY = 'kp_clean_empty_slate_v4';

  // Application State with LocalStorage Persistence (defaults to clean empty state)
  const [companies, setCompanies] = useState<Company[]>(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) return [];
    const saved = localStorage.getItem('kp_companies');
    return saved ? JSON.parse(saved) : [];
  });

  const [permits, setPermits] = useState<Permit[]>(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) return [];
    const saved = localStorage.getItem('kp_permits');
    return saved ? JSON.parse(saved) : [];
  });

  const [lkpmRecords, setLkpmRecords] = useState<LKPMRecord[]>(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) return [];
    const saved = localStorage.getItem('kp_lkpm');
    return saved ? JSON.parse(saved) : [];
  });

  const [warningLetters, setWarningLetters] = useState<WarningLetter[]>(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) return [];
    const saved = localStorage.getItem('kp_letters');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) return [];
    const saved = localStorage.getItem('kp_emails');
    return saved ? JSON.parse(saved) : [];
  });

  const [complianceEvents, setComplianceEvents] = useState<ComplianceLogEvent[]>(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) return [];
    const saved = localStorage.getItem('kp_events');
    return saved ? JSON.parse(saved) : [];
  });

  // Automatically wipe any legacy cached data once to ensure complete clean slate
  useEffect(() => {
    if (!localStorage.getItem(CLEAN_SLATE_KEY)) {
      localStorage.setItem(CLEAN_SLATE_KEY, 'true');
      localStorage.setItem('kp_companies', JSON.stringify([]));
      localStorage.setItem('kp_permits', JSON.stringify([]));
      localStorage.setItem('kp_lkpm', JSON.stringify([]));
      localStorage.setItem('kp_letters', JSON.stringify([]));
      localStorage.setItem('kp_emails', JSON.stringify([]));
      localStorage.setItem('kp_events', JSON.stringify([]));
      setCompanies([]);
      setPermits([]);
      setLkpmRecords([]);
      setWarningLetters([]);
      setEmailLogs([]);
      setComplianceEvents([]);
    }
  }, []);

  // Letter generator prefill state
  const [activeLetterItem, setActiveLetterItem] = useState<{ type: 'PERMIT' | 'LKPM' | 'DUAL_VIOLATION'; record: any } | null>(null);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'info' | 'danger' } | null>(null);

  useEffect(() => {
    localStorage.setItem('kp_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('kp_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('kp_permits', JSON.stringify(permits));
  }, [permits]);

  useEffect(() => {
    localStorage.setItem('kp_lkpm', JSON.stringify(lkpmRecords));
  }, [lkpmRecords]);

  useEffect(() => {
    localStorage.setItem('kp_letters', JSON.stringify(warningLetters));
  }, [warningLetters]);

  useEffect(() => {
    localStorage.setItem('kp_emails', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem('kp_events', JSON.stringify(complianceEvents));
  }, [complianceEvents]);

  // Permohonan Pendampingan Pelaku Usaha (Consultation Applications) State
  const [consultations, setConsultations] = useState<ConsultationApplication[]>(() => {
    const saved = localStorage.getItem('kp_consultations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(c => c.id !== 'cs-sample-1' && c.userId !== 'user-usaha');
          return filtered;
        }
      } catch (e) {}
    }
    return INITIAL_CONSULTATIONS;
  });

  useEffect(() => {
    localStorage.setItem('kp_consultations', JSON.stringify(consultations));
  }, [consultations]);

  // Submit consultation application from Pelaku Usaha
  const handleSubmitConsultation = (newApp: ConsultationApplication) => {
    setConsultations((prev) => [newApp, ...prev]);
    addComplianceEvent(
      'STATUS_UPDATED',
      'Permohonan Pendampingan Baru Masuk',
      `Permohonan pendampingan gedung ${newApp.buildingName} (${newApp.companyName}) dengan No. Reg ${newApp.refNumber} diteruskan ke data User Monitoring untuk diverifikasi.`,
      'info',
      newApp.buildingName
    );
    showToast(`Permohonan ${newApp.refNumber} berhasil diajukan dan masuk ke data User Monitoring untuk diverifikasi!`, 'success');
  };

  // Verify / update consultation status from User Monitoring or Admin
  const handleUpdateConsultationStatus = (id: string, newStatus: ConsultationStatus, officerNotes?: string) => {
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: newStatus,
              officerNotes: officerNotes !== undefined ? officerNotes : c.officerNotes,
              verifiedBy: currentUser.name,
              verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
            }
          : c
      )
    );
    const target = consultations.find((c) => c.id === id);
    addComplianceEvent(
      'STATUS_UPDATED',
      'Verifikasi Permohonan Pendampingan Selesai',
      `Permohonan ${target?.refNumber || id} (${target?.buildingName || 'Gedung'}) diverifikasi oleh ${currentUser.name} dengan status "${newStatus}".`,
      newStatus === 'Diverifikasi & Dijadwalkan' || newStatus === 'Selesai' ? 'success' : 'warning',
      target?.buildingName || 'User Monitoring'
    );
    showToast(`Status permohonan ${target?.refNumber || ''} berhasil diperbarui: "${newStatus}"!`, 'success');
  };

  // Reschedule consultation date & method (specifically for Koordinator role & admins)
  const handleRescheduleConsultation = (
    id: string,
    newDate: string,
    newMethod?: string,
    rescheduleReason?: string
  ) => {
    const target = consultations.find((c) => c.id === id);
    if (!target) return;
    const oldDate = target.consultationDate;

    setConsultations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              previousDate: oldDate,
              consultationDate: newDate,
              method: newMethod || c.method,
              rescheduledBy: currentUser.name,
              rescheduledAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              rescheduleReason: rescheduleReason || 'Penyesuaian jadwal oleh Koordinator PTSP',
              status: c.status === 'Menunggu Verifikasi' ? 'Diverifikasi & Dijadwalkan' : c.status,
              officerNotes: rescheduleReason 
                ? `[Jadwal Diubah oleh Koordinator ${currentUser.name}]: ${rescheduleReason}` 
                : c.officerNotes
            }
          : c
      )
    );

    addComplianceEvent(
      'STATUS_UPDATED',
      'Jadwal Pendampingan Diubah Koordinator',
      `Jadwal pendampingan gedung ${target.buildingName} (No. Reg: ${target.refNumber}) diubah oleh Koordinator ${currentUser.name} dari ${oldDate} menjadi ${newDate}.`,
      'info',
      target.buildingName
    );

    showToast(`Jadwal pendampingan untuk ${target.buildingName} berhasil diubah ke ${newDate} oleh Koordinator!`, 'success');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'danger' = 'success') => {
    setGlobalToast({ message, type });
    setTimeout(() => setGlobalToast(null), 4000);
  };

  // Log a compliance event
  const addComplianceEvent = (
    type: ComplianceLogEvent['type'],
    title: string,
    description: string,
    severity: ComplianceLogEvent['severity'],
    entityName: string
  ) => {
    const newEvent: ComplianceLogEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type,
      title,
      description,
      severity,
      entityName
    };
    setComplianceEvents((prev) => [newEvent, ...prev]);
  };

  // Add new permit
  const handleAddPermit = (newPermitData: Omit<Permit, 'id'>) => {
    const newPermit: Permit = {
      ...newPermitData,
      id: `prm-${Date.now()}`
    };
    setPermits((prev) => [newPermit, ...prev]);
    addComplianceEvent(
      'STATUS_UPDATED',
      'Perizinan Baru Didaftarkan',
      `Dokumen "${newPermit.permitName}" (No: ${newPermit.documentNumber}) berhasil didaftarkan ke sistem.`,
      'info',
      newPermit.companyName
    );
    showToast(`Perizinan "${newPermit.permitName}" berhasil ditambahkan!`);
  };

  // Bulk Import Permits via Excel / CSV (auto-registers company profiles)
  const handleBulkImportPermits = (imported: Permit[]) => {
    setPermits((prev) => [...imported, ...prev]);

    // Auto-register companies from permit spreadsheet rows
    setCompanies((prev) => {
      const existingNames = new Set(prev.map((c) => c.name.toLowerCase()));
      const toAdd: Company[] = [];
      imported.forEach((p) => {
        const nameLower = p.companyName.trim().toLowerCase();
        if (p.companyName && !existingNames.has(nameLower) && !toAdd.some((c) => c.name.toLowerCase() === nameLower)) {
          toAdd.push({
            id: p.companyId || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: p.companyName,
            nib: p.nib || '0000000000000',
            npwp: '-',
            address: 'Indonesia',
            city: '-',
            province: '-',
            picName: p.picName || 'Penanggung Jawab',
            picEmail: p.picEmail || 'andri.cimb@gmail.com',
            picPhone: '-',
            scale: 'Besar',
            sector: p.category || 'Umum'
          });
        }
      });
      return [...prev, ...toAdd];
    });

    addComplianceEvent(
      'DATA_IMPORTED',
      'Bulk Upload Perizinan Selesai',
      `Berhasil mengimpor massal ${imported.length} dokumen perizinan dari berkas spreadsheet.`,
      'success',
      'Sistem Terpadu'
    );
    showToast(`Berhasil mengimpor ${imported.length} data perizinan!`, 'success');
  };

  const handleUpdatePermit = (updated: Permit) => {
    setPermits((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    addComplianceEvent(
      'STATUS_UPDATED',
      'Dokumen Perizinan Diperbarui',
      `Masa berlaku atau data "${updated.permitName}" diperbarui (Kedaluwarsa: ${formatIndonesianDate(updated.expiryDate)}).`,
      'info',
      updated.companyName
    );
    showToast('Data perizinan berhasil diperbarui!');
  };

  const handleDeletePermit = (id: string) => {
    const permit = permits.find((p) => p.id === id);
    if (!confirm(`Hapus perizinan "${permit?.permitName || id}"?`)) return;
    setPermits((prev) => prev.filter((p) => p.id !== id));
    showToast('Perizinan berhasil dihapus.');
  };

  // Add LKPM
  const handleAddLKPM = (recordData: Omit<LKPMRecord, 'id'>) => {
    const newRecord: LKPMRecord = {
      ...recordData,
      id: `lkpm-${Date.now()}`
    };
    setLkpmRecords((prev) => [newRecord, ...prev]);
    addComplianceEvent(
      'DATA_IMPORTED',
      'Kewajiban LKPM Ditambahkan',
      `Proyek KBLI ${newRecord.kbliCode} (${newRecord.period} ${newRecord.year}) didaftarkan untuk pengawasan.`,
      newRecord.status === 'Belum Lapor' ? 'warning' : 'info',
      newRecord.companyName
    );
    showToast('Data LKPM berhasil ditambahkan!');
  };

  const handleUpdateLKPM = (updated: LKPMRecord) => {
    setLkpmRecords((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    addComplianceEvent(
      'STATUS_UPDATED',
      'Status LKPM Diperbarui',
      `Status pelaporan LKPM ${updated.period} ${updated.year} (KBLI ${updated.kbliCode}) diubah menjadi "${updated.status}".`,
      updated.status === 'Disetujui' ? 'success' : 'info',
      updated.companyName
    );
    showToast(`Status LKPM diubah menjadi ${updated.status}`);
  };

  const handleDeleteLKPM = (id: string) => {
    const item = lkpmRecords.find((l) => l.id === id);
    if (!confirm(`Hapus data LKPM ${item?.companyName} (${item?.period})?`)) return;
    setLkpmRecords((prev) => prev.filter((l) => l.id !== id));
    showToast('Data LKPM berhasil dihapus.');
  };

  // Bulk Import LKPM (auto-registers company profiles)
  const handleBulkImportLKPM = (imported: LKPMRecord[]) => {
    setLkpmRecords((prev) => [...imported, ...prev]);

    // Auto-register companies from LKPM spreadsheet rows
    setCompanies((prev) => {
      const existingNames = new Set(prev.map((c) => c.name.toLowerCase()));
      const toAdd: Company[] = [];
      imported.forEach((l) => {
        const nameLower = l.companyName.trim().toLowerCase();
        if (l.companyName && !existingNames.has(nameLower) && !toAdd.some((c) => c.name.toLowerCase() === nameLower)) {
          toAdd.push({
            id: l.companyId || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: l.companyName,
            nib: l.nib || '0000000000000',
            npwp: '-',
            address: l.projectLocation || 'Indonesia',
            city: '-',
            province: '-',
            picName: l.picName || 'Penanggung Jawab',
            picEmail: l.picEmail || 'andri.cimb@gmail.com',
            picPhone: '-',
            scale: l.scale || 'Besar',
            sector: l.kbliTitle || 'Umum'
          });
        }
      });
      return [...prev, ...toAdd];
    });

    addComplianceEvent(
      'DATA_IMPORTED',
      'Bulk Upload LKPM Selesai',
      `Berhasil mengimpor massal ${imported.length} data LKPM dari file spreadsheet.`,
      'success',
      'Sistem Terpadu'
    );
    showToast(`Berhasil mengimpor ${imported.length} data LKPM!`, 'success');
  };

  // Wipe / Empty all Data (Perizinan OSS & LKPM)
  const handleClearAllData = () => {
    setCompanies([]);
    setPermits([]);
    setLkpmRecords([]);
    setWarningLetters([]);
    setEmailLogs([]);
    setComplianceEvents([]);
    localStorage.setItem('kp_companies', JSON.stringify([]));
    localStorage.setItem('kp_permits', JSON.stringify([]));
    localStorage.setItem('kp_lkpm', JSON.stringify([]));
    localStorage.setItem('kp_letters', JSON.stringify([]));
    localStorage.setItem('kp_emails', JSON.stringify([]));
    localStorage.setItem('kp_events', JSON.stringify([]));
    addComplianceEvent(
      'STATUS_UPDATED',
      'Data Perizinan & LKPM Direset',
      `Super Admin ${currentUser.name} telah mereset dan mengosongkan seluruh data Perizinan OSS dan LKPM.`,
      'warning',
      'Seluruh Entitas'
    );
    showToast('Seluruh data Perizinan (OSS) dan LKPM berhasil dikosongkan!', 'info');
  };

  // Clear Permits data only
  const handleClearPermitsOnly = () => {
    setPermits([]);
    localStorage.setItem('kp_permits', JSON.stringify([]));
    addComplianceEvent(
      'STATUS_UPDATED',
      'Data Perizinan Direset',
      `Super Admin ${currentUser.name} telah mengosongkan seluruh data dokumen Perizinan OSS.`,
      'warning',
      'Perizinan OSS'
    );
    showToast('Seluruh data Perizinan (OSS) berhasil dikosongkan!', 'info');
  };

  // Clear LKPM data only
  const handleClearLKPMOnly = () => {
    setLkpmRecords([]);
    localStorage.setItem('kp_lkpm', JSON.stringify([]));
    addComplianceEvent(
      'STATUS_UPDATED',
      'Data LKPM Direset',
      `Super Admin ${currentUser.name} telah mengosongkan seluruh data pelaporan LKPM.`,
      'warning',
      'Pelaporan LKPM'
    );
    showToast('Seluruh data Pelaporan LKPM berhasil dikosongkan!', 'info');
  };

  // Clear Companies data only
  const handleClearCompaniesOnly = () => {
    setCompanies([]);
    localStorage.setItem('kp_companies', JSON.stringify([]));
    addComplianceEvent(
      'STATUS_UPDATED',
      'Data Perusahaan Direset',
      `Super Admin ${currentUser.name} telah mengosongkan seluruh data master profil perusahaan.`,
      'warning',
      'Data Perusahaan'
    );
    showToast('Seluruh data Perusahaan berhasil dikosongkan!', 'info');
  };

  // Warning Letter Save
  const handleSaveLetter = (letter: WarningLetter) => {
    setWarningLetters((prev) => [letter, ...prev]);
    addComplianceEvent(
      'LETTER_GENERATED',
      'Surat Teguran Resmi Diterbitkan',
      `Surat No. ${letter.letterNumber} (${letter.type}) diterbitkan untuk ${letter.companyName}.`,
      'warning',
      letter.companyName
    );
    showToast(`Surat Teguran No. ${letter.letterNumber} berhasil disimpan dalam arsip.`);
  };

  // Email sending
  const handleSendEmail = (log: Omit<EmailLog, 'id'>) => {
    const newLog: EmailLog = {
      ...log,
      id: `em-${Date.now()}`
    };
    setEmailLogs((prev) => [newLog, ...prev]);
    addComplianceEvent(
      'EMAIL_SENT',
      'Email Notifikasi Terkirim',
      `Email peringatan dikirimkan ke ${log.recipientEmail} (${log.subject}).`,
      'info',
      log.companyName
    );
    showToast(`Notifikasi email berhasil dikirim ke ${log.recipientEmail}!`, 'success');
  };

  // Direct 1-click email trigger from table
  const handleDirectSendEmail = (type: 'PERMIT' | 'LKPM', record: any) => {
    let days = 0;
    let title = '';
    let email = record.picEmail || 'andri.cimb@gmail.com';
    let pic = record.picName || 'Penanggung Jawab';
    let comp = record.companyName;

    if (type === 'PERMIT') {
      days = calculateDaysRemaining(record.expiryDate);
      title = record.permitName;
    } else {
      days = calculateDaysRemaining(record.deadlineDate);
      title = `LKPM ${record.period} ${record.year} (KBLI ${record.kbliCode})`;
    }

    const html = generateEmailNotificationTemplate(type, pic, comp, title, days);

    handleSendEmail({
      recipientEmail: email,
      recipientName: pic,
      companyName: comp,
      category: type === 'PERMIT' ? 'Pengingat Perizinan' : 'Teguran LKPM',
      subject: `[PERINGATAN RESMI] Pengingat Kepatuhan: ${title}`,
      bodyPreview: `Pemberitahuan resmi mengenai ${title} untuk ${comp}.`,
      fullHtml: html,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'Berhasil Terkirim',
      triggerType: 'Manual Admin'
    });
  };

  // Open Letter Generator with preselected item
  const handleOpenLetterWithItem = (item: { type: 'PERMIT' | 'LKPM' | 'DUAL_VIOLATION'; record: any }) => {
    setActiveLetterItem(item);
    setActiveTab('letters');
  };

  // Open Letter Generator with Combined Dual-Violation items
  const handleOpenCombinedLetter = (company: Company, compPermits: Permit[], compLKPM: LKPMRecord[]) => {
    setActiveLetterItem({
      type: 'DUAL_VIOLATION',
      record: { company, permits: compPermits, lkpm: compLKPM }
    });
    setActiveTab('letters');
    showToast(`Membuka form Surat Teguran Terpadu untuk ${company.name} (NIB: ${company.nib})`, 'info');
  };

  // Direct 1-click combined email trigger from NIB comparison
  const handleSendCombinedEmail = (company: Company, compPermits: Permit[], compLKPM: LKPMRecord[]) => {
    const expiredPermits = compPermits.filter((p) => calculateDaysRemaining(p.expiryDate) <= 30);
    const unfiledLKPM = compLKPM.filter((l) => l.status === 'Belum Lapor' || l.status === 'Perlu Perbaikan');

    const permitDetails = expiredPermits.map((p) => `• <strong>${p.permitName}</strong> (No: ${p.documentNumber}, Kedaluwarsa: ${formatIndonesianDate(p.expiryDate)})`).join('<br/>');
    const lkpmDetails = unfiledLKPM.map((l) => `• <strong>LKPM ${l.period} ${l.year}</strong> (KBLI ${l.kbliCode}, Batas Lapor: ${formatIndonesianDate(l.deadlineDate)})`).join('<br/>');

    const detailsHtml = `
      <div style="margin-bottom: 12px; padding: 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px;">
        <strong style="color: #991b1b; font-size: 13px;">1. Dokumen Perizinan Kedaluwarsa / Kritis:</strong><br/>
        <div style="margin-top: 4px; font-size: 12px; color: #4c0519;">${permitDetails || 'Menunggu perpanjangan izin'}</div>
      </div>
      <div style="padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
        <strong style="color: #166534; font-size: 13px;">2. Kewajiban Pelaporan LKPM yang Belum Disampaikan:</strong><br/>
        <div style="margin-top: 4px; font-size: 12px; color: #14532d;">${lkpmDetails || 'Tunggakan laporan investasi'}</div>
      </div>
    `;

    const html = generateEmailNotificationTemplate(
      'DUAL_VIOLATION',
      company.picName,
      company.name,
      `Pelanggaran Terpadu (${company.name})`,
      -1,
      detailsHtml,
      company.nib
    );

    handleSendEmail({
      recipientEmail: company.picEmail,
      recipientName: company.picName,
      companyName: company.name,
      category: 'Teguran Terpadu NIB',
      subject: `[PERINGATAN RESMI TERPADU] Pelanggaran Ganda Perizinan & LKPM: ${company.name} (NIB: ${company.nib})`,
      bodyPreview: `Pemberitahuan resmi pelanggaran ganda perizinan dan kewajiban pelaporan LKPM untuk NIB ${company.nib}.`,
      fullHtml: html,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'Berhasil Terkirim',
      triggerType: 'Peringatan Darurat'
    });
  };

  // Batch Auto-Check & Scheduler Run
  const handleRunBatchScheduler = () => {
    const sentMessages: string[] = [];
    let count = 0;

    // Scan permits
    permits.forEach((p) => {
      const days = calculateDaysRemaining(p.expiryDate);
      // If expiring soon (H-90, H-30, H-14, H-7, or expired)
      if (days <= 30 || days < 0) {
        const html = generateEmailNotificationTemplate('PERMIT', p.picName, p.companyName, p.permitName, days);
        handleSendEmail({
          recipientEmail: p.picEmail,
          recipientName: p.picName,
          companyName: p.companyName,
          category: 'Pengingat Perizinan',
          subject: `[JADWAL OTOMATIS] Peringatan Masa Berlaku: ${p.permitName}`,
          bodyPreview: `Masa berlaku tersisa ${days} hari lagi.`,
          fullHtml: html,
          sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: 'Berhasil Terkirim',
          triggerType: days < 0 ? 'Peringatan Darurat' : 'Otomatis (Jadwal H-30)'
        });
        sentMessages.push(`Terkirim ke ${p.picEmail} (${p.permitName})`);
        count++;
      }
    });

    // Scan LKPM
    lkpmRecords.forEach((l) => {
      if (l.status === 'Belum Lapor') {
        const days = calculateDaysRemaining(l.deadlineDate);
        const html = generateEmailNotificationTemplate('LKPM', l.picName, l.companyName, `${l.period} ${l.year}`, days);
        handleSendEmail({
          recipientEmail: l.picEmail,
          recipientName: l.picName,
          companyName: l.companyName,
          category: 'Teguran LKPM',
          subject: `[JADWAL OTOMATIS] Teguran Pelaporan LKPM: ${l.companyName} (${l.period})`,
          bodyPreview: `Kewajiban LKPM belum disampaikan. Batas akhir: ${formatIndonesianDate(l.deadlineDate)}.`,
          fullHtml: html,
          sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: 'Berhasil Terkirim',
          triggerType: 'Peringatan Darurat'
        });
        sentMessages.push(`Terkirim ke ${l.picEmail} (LKPM ${l.period})`);
        count++;
      }
    });

    return { sentCount: count, messages: sentMessages };
  };

  // Real-Time Audit Sync simulation
  const handleForceRefreshAudit = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addComplianceEvent(
        'STATUS_UPDATED',
        'Audit Kepatuhan Real-Time Sinkron',
        'Sistem telah memverifikasi seluruh tanggal kedaluwarsa dokumen dan status LKPM terkini.',
        'info',
        'Seluruh Entitas'
      );
      showToast('Sinkronisasi dan audit real-time berhasil diperbarui!', 'success');
    }, 800);
  };

  // Login handler
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('kp_isAuthenticated', 'true');
    localStorage.setItem('kp_currentUser', JSON.stringify(user));

    if (user.role === 'superadmin') {
      setActiveTab('users');
    } else if (user.role === 'pelaku_usaha') {
      setActiveTab('building_control');
    } else if (user.role === 'petugas') {
      setActiveTab('upload');
    } else if (user.role === 'monitor') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }

    addComplianceEvent(
      'STATUS_UPDATED',
      'Pengguna Berhasil Masuk',
      `Sesi login aktif untuk ${user.name} (${user.roleTitle}) dengan verifikasi kata sandi.`,
      'info',
      user.name
    );
    showToast(`Selamat datang, ${user.name}! Anda masuk sebagai ${user.roleTitle}.`, 'success');
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('kp_isAuthenticated');
    addComplianceEvent(
      'STATUS_UPDATED',
      'Sesi Pengguna Berakhir',
      `Pengguna ${currentUser.name} telah keluar dari sistem.`,
      'info',
      currentUser.name
    );
    showToast('Anda telah keluar dari sistem. Silakan masuk kembali.', 'info');
  };

  // Switch User Account (Super Admin only capability)
  const handleSwitchUser = (selectedUser: UserAccount) => {
    if (currentUser.role !== 'superadmin') {
      showToast('Akses ditolak: Hanya Super Admin yang berwenang beralih akun.', 'danger');
      return;
    }

    setCurrentUser(selectedUser);
    showToast(`Beralih akun ke: ${selectedUser.name} (${selectedUser.roleTitle})`, 'info');
    if (selectedUser.role === 'superadmin') {
      setActiveTab('users');
    } else if (selectedUser.role === 'pelaku_usaha') {
      setActiveTab('building_control');
    } else if (selectedUser.role === 'petugas') {
      setActiveTab('upload');
    } else if (selectedUser.role === 'monitor') {
      setActiveTab('dashboard');
    } else if (selectedUser.role === 'koordinator') {
      if (activeTab === 'upload' || activeTab === 'permits' || activeTab === 'lkpm' || activeTab === 'users' || activeTab === 'building_control') {
        setActiveTab('dashboard');
      }
    }
  };

  // User Management Handlers (Super Admin)
  const handleAddUser = (newUser: Omit<UserAccount, 'id'>): { success: boolean; message: string } => {
    const isUsernameTaken = users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (isUsernameTaken) {
      return { success: false, message: `Username "@${newUser.username}" sudah digunakan akun lain.` };
    }

    const isEmailTaken = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (isEmailTaken) {
      return { success: false, message: `Email "${newUser.email}" sudah terdaftar pada akun lain.` };
    }

    const createdUser: UserAccount = {
      ...newUser,
      id: `user-${Date.now()}`
    };

    setUsers(prev => [...prev, createdUser]);
    addComplianceEvent(
      'STATUS_UPDATED',
      'Akun Pengguna Baru Terdaftar',
      `Super Admin mendaftarkan pengguna baru: ${createdUser.name} (@${createdUser.username}) dengan peran ${createdUser.roleTitle}.`,
      'success',
      currentUser.name
    );

    return { success: true, message: `Akun "${createdUser.name}" (@${createdUser.username}) berhasil ditambahkan ke sistem!` };
  };

  const handleUpdateUser = (updatedUser: UserAccount): { success: boolean; message: string } => {
    const isUsernameTaken = users.some(u => u.id !== updatedUser.id && u.username.toLowerCase() === updatedUser.username.toLowerCase());
    if (isUsernameTaken) {
      return { success: false, message: `Username "@${updatedUser.username}" sudah digunakan akun lain.` };
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    if (updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }

    addComplianceEvent(
      'STATUS_UPDATED',
      'Data Pengguna Diperbarui',
      `Kredensial dan data pengguna ${updatedUser.name} (@${updatedUser.username}) berhasil diperbarui oleh Super Admin.`,
      'info',
      currentUser.name
    );

    return { success: true, message: `Data akun "${updatedUser.name}" berhasil diperbarui.` };
  };

  const handleDeleteUser = (userId: string): { success: boolean; message: string } => {
    if (userId === currentUser.id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' };
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (targetUser.role === 'superadmin') {
      const superAdminCount = users.filter(u => u.role === 'superadmin').length;
      if (superAdminCount <= 1) {
        return { success: false, message: 'Tidak dapat menghapus Super Admin terakhir pada sistem.' };
      }
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    addComplianceEvent(
      'STATUS_UPDATED',
      'Pengguna Dihapus dari Sistem',
      `Super Admin menghapus akun ${targetUser.name} (@${targetUser.username}) dengan peran ${targetUser.roleTitle}.`,
      'warning',
      currentUser.name
    );

    return { success: true, message: `Akun "${targetUser.name}" (@${targetUser.username}) telah berhasil dihapus.` };
  };

  const handleResetUsersToDefault = () => {
    setUsers(DEFAULT_USERS);
    addComplianceEvent(
      'STATUS_UPDATED',
      'Daftar Pengguna Direset',
      'Super Admin mengembalikan seluruh akun ke konfigurasi bawaan sistem.',
      'info',
      currentUser.name
    );
  };

  // Self-registration for Pelaku Usaha
  const handleRegisterUser = (newUserData: Omit<UserAccount, 'id'>): { success: boolean; message: string; user?: UserAccount } => {
    const isUsernameTaken = users.some(u => u.username.toLowerCase() === newUserData.username.toLowerCase());
    if (isUsernameTaken) {
      return { success: false, message: `Username "@${newUserData.username}" sudah digunakan. Silakan gunakan username lain.` };
    }

    const isEmailTaken = users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase());
    if (isEmailTaken) {
      return { success: false, message: `Email "${newUserData.email}" sudah terdaftar dalam sistem.` };
    }

    const createdUser: UserAccount = {
      ...newUserData,
      id: `user-usaha-${Date.now()}`
    };

    setUsers(prev => [...prev, createdUser]);

    // Automatically sync company database if building info provided
    if (createdUser.companyName) {
      setCompanies(prev => {
        const exists = prev.some(c => c.name.toLowerCase() === createdUser.companyName?.toLowerCase());
        if (exists) return prev;
        return [
          ...prev,
          {
            id: `comp-${Date.now()}`,
            name: createdUser.companyName || 'Perusahaan',
            nib: createdUser.nib || '0000000000000',
            npwp: '-',
            address: createdUser.address || 'Jakarta Selatan',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            picName: createdUser.name,
            picEmail: createdUser.email,
            picPhone: createdUser.phone || '-',
            scale: 'Besar',
            sector: createdUser.buildingType || 'Gedung Komersial'
          }
        ];
      });
    }

    addComplianceEvent(
      'DATA_IMPORTED',
      'Pendaftaran Akun Pelaku Usaha Berhasil',
      `Akun pelaku usaha gedung ${createdUser.buildingName || createdUser.name} (${createdUser.companyName || '-'}) terdaftar di Jaksel Building Assistance.`,
      'success',
      createdUser.name
    );

    return { 
      success: true, 
      message: `Pendaftaran berhasil! Akun untuk "${createdUser.buildingName || createdUser.name}" berhasil dibuat.`,
      user: createdUser 
    };
  };

  // Enforce strict role-based tab boundaries
  // - Pelaku Usaha: strictly building_control
  // - Monitor: strictly dashboard
  // - Petugas: strictly upload
  // - Koordinator: dashboard, compare, letters, notifications, tracking (no permits, lkpm, upload, users, or building_control)
  // - Superadmin: users, building_control, dashboard, compare, upload, letters, notifications, tracking
  useEffect(() => {
    if (currentUser.role === 'pelaku_usaha' && activeTab !== 'building_control') {
      setActiveTab('building_control');
    } else if (currentUser.role === 'monitor' && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    } else if (currentUser.role === 'petugas' && activeTab !== 'upload') {
      setActiveTab('upload');
    } else if (currentUser.role === 'koordinator' && (activeTab === 'permits' || activeTab === 'lkpm' || activeTab === 'upload' || activeTab === 'users' || activeTab === 'building_control')) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab]);

  // Follow Up Status Updates
  const handleUpdatePermitFollowUp = (permitId: string, status: FollowUpStatus) => {
    setPermits((prev) =>
      prev.map((p) =>
        p.id === permitId
          ? {
              ...p,
              followUpStatus: status,
              followUpDate: status === 'Sudah Ditindaklanjuti' ? new Date().toISOString().split('T')[0] : p.followUpDate,
            }
          : p
      )
    );
    addComplianceEvent(
      'STATUS_UPDATED',
      'Status Tindak Lanjut Perizinan Berubah',
      `Perizinan ID ${permitId} ditandai sebagai "${status}".`,
      status === 'Sudah Ditindaklanjuti' ? 'success' : 'warning',
      'Admin Monitoring'
    );
    showToast(`Status tindak lanjut perizinan diubah: "${status}"!`);
  };

  const handleUpdateLKPMFollowUp = (lkpmId: string, status: FollowUpStatus) => {
    setLkpmRecords((prev) =>
      prev.map((l) =>
        l.id === lkpmId
          ? {
              ...l,
              followUpStatus: status,
              followUpDate: status === 'Sudah Ditindaklanjuti' ? new Date().toISOString().split('T')[0] : l.followUpDate,
            }
          : l
      )
    );
    addComplianceEvent(
      'STATUS_UPDATED',
      'Status Tindak Lanjut LKPM Berubah',
      `Kewajiban LKPM ID ${lkpmId} ditandai sebagai "${status}".`,
      status === 'Sudah Ditindaklanjuti' ? 'success' : 'warning',
      'Admin Monitoring'
    );
    showToast(`Status tindak lanjut LKPM diubah: "${status}"!`);
  };

  if (!isAuthenticated) {
    return (
      <>
        {globalToast && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 no-print animate-slide-in">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold">{globalToast.message}</span>
          </div>
        )}
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onRegisterUser={handleRegisterUser} 
          users={users} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Global Notification Toast */}
      {globalToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 no-print animate-slide-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold">{globalToast.message}</span>
        </div>
      )}

      {/* Header and Nav */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        permits={permits}
        lkpmRecords={lkpmRecords}
        companies={companies}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onClearAllData={handleClearAllData}
        onQuickAddPermit={() => setActiveTab('upload')}
        onQuickUploadLKPM={() => setActiveTab('upload')}
        onOpenLetterGenerator={() => setActiveTab('letters')}
        onRunAutoCheck={handleForceRefreshAudit}
        isChecking={isSyncing}
      />

      {/* Main Body Content */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'users' && (
          <UserManagementView
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetUsersToDefault={handleResetUsersToDefault}
            onSwitchUser={handleSwitchUser}
            onClearAllData={handleClearAllData}
            onClearCompaniesOnly={handleClearCompaniesOnly}
            onClearPermitsOnly={handleClearPermitsOnly}
            onClearLKPMOnly={handleClearLKPMOnly}
            permitsCount={permits.length}
            lkpmCount={lkpmRecords.length}
            companiesCount={companies.length}
          />
        )}

        {activeTab === 'building_control' && (
          <BuildingControlView
            currentUser={currentUser}
            consultations={consultations}
            onSubmitConsultation={handleSubmitConsultation}
            onLogout={handleLogout}
            onNavigateSuperAdmin={currentUser.role === 'superadmin' ? () => setActiveTab('users') : undefined}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            permits={permits}
            lkpmRecords={lkpmRecords}
            warningLetters={warningLetters}
            companies={companies}
            currentUser={currentUser}
            consultations={consultations}
            onUpdateConsultationStatus={handleUpdateConsultationStatus}
            onRescheduleConsultation={handleRescheduleConsultation}
            onNavigateTab={setActiveTab}
            onOpenLetterWithItem={handleOpenLetterWithItem}
            onSendDirectEmail={handleDirectSendEmail}
            onAddNewPermit={() => setActiveTab('permits')}
          />
        )}

        {activeTab === 'compare' && (
          <NIBComparisonView
            companies={companies}
            permits={permits}
            lkpmRecords={lkpmRecords}
            currentUserRole={currentUser.role}
            onOpenCombinedLetter={handleOpenCombinedLetter}
            onSendCombinedEmail={handleSendCombinedEmail}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'permits' && (
          <PermitsManager
            permits={permits}
            companies={companies}
            currentUserRole={currentUser.role}
            onAddPermit={handleAddPermit}
            onBulkImportPermits={handleBulkImportPermits}
            onUpdatePermit={handleUpdatePermit}
            onDeletePermit={handleDeletePermit}
            onUpdateFollowUp={handleUpdatePermitFollowUp}
            onSendEmailPrompt={(p) => handleDirectSendEmail('PERMIT', p)}
            onOpenLetterGenerator={(p) => handleOpenLetterWithItem({ type: 'PERMIT', record: p })}
          />
        )}

        {activeTab === 'lkpm' && (
          <LKPMManager
            lkpmRecords={lkpmRecords}
            companies={companies}
            currentUserRole={currentUser.role}
            onAddLKPM={handleAddLKPM}
            onUpdateLKPM={handleUpdateLKPM}
            onDeleteLKPM={handleDeleteLKPM}
            onUpdateFollowUp={handleUpdateLKPMFollowUp}
            onSendEmailPrompt={(l) => handleDirectSendEmail('LKPM', l)}
            onOpenLetterGenerator={(l) => handleOpenLetterWithItem({ type: 'LKPM', record: l })}
            onNavigateBulkUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'upload' && (
          <UnifiedUploadView
            companies={companies}
            permits={permits}
            lkpmRecords={lkpmRecords}
            currentUser={currentUser}
            onBulkImportPermits={handleBulkImportPermits}
            onBulkImportLKPM={handleBulkImportLKPM}
            onDeletePermit={handleDeletePermit}
            onDeleteLKPM={handleDeleteLKPM}
          />
        )}

        {activeTab === 'letters' && (
          <WarningLetterGenerator
            companies={companies}
            permits={permits}
            lkpmRecords={lkpmRecords}
            savedLetters={warningLetters}
            currentUserRole={currentUser.role}
            initialItem={activeLetterItem}
            onSaveLetter={handleSaveLetter}
            onSendEmailWithLetter={(letter) => {
              handleSaveLetter(letter);
              handleSendEmail({
                recipientEmail: letter.recipientEmail,
                recipientName: letter.recipientName,
                companyName: letter.companyName,
                category: 'Surat Resmi Terbit',
                subject: `[RESMI] ${letter.letterNumber} - ${letter.type}`,
                bodyPreview: `Penerbitan surat teguran resmi untuk ${letter.companyName}.`,
                fullHtml: generateEmailNotificationTemplate(
                  'WARNING_LETTER',
                  letter.recipientName,
                  letter.companyName,
                  letter.letterNumber,
                  letter.deadlineDays,
                  `Surat No: ${letter.letterNumber} | Batas Waktu Tindak Lanjut: ${letter.deadlineDays} Hari Kerja.`
                ),
                sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                status: 'Berhasil Terkirim',
                triggerType: 'Manual Admin'
              });
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <EmailNotificationCenter
            emailLogs={emailLogs}
            permits={permits}
            lkpmRecords={lkpmRecords}
            companies={companies}
            currentUserRole={currentUser.role}
            onSendEmail={handleSendEmail}
            onRunBatchScheduler={handleRunBatchScheduler}
          />
        )}

        {activeTab === 'tracking' && (
          <RealTimeTracker
            companies={companies}
            permits={permits}
            lkpmRecords={lkpmRecords}
            events={complianceEvents}
            onForceRefresh={handleForceRefreshAudit}
            isSyncing={isSyncing}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-500 text-xs no-print">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">KepatuhanPlus</span>
            <span>•</span>
            <span>Sistem Pengawasan Perizinan &amp; LKPM Berbasis OSS-RBA</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Sesuai PP No. 5/2021 &amp; Perka BKPM No. 5/2021</span>
            <span>•</span>
            <span>Notifikasi Email: andri.cimb@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

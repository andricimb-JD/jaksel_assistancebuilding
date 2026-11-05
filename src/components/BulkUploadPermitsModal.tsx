import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Trash2, 
  X,
  Info,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Permit, PermitCategory, Company } from '../types';
import { generateSampleCsvPermits, formatCurrencyIDR } from '../utils/helpers';

interface BulkUploadPermitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onImportSuccess: (importedPermits: Permit[]) => void;
}

export const BulkUploadPermitsModal: React.FC<BulkUploadPermitsModalProps> = ({
  isOpen,
  onClose,
  companies,
  onImportSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<Permit[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteCsvText, setPasteCsvText] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download official CSV template
  const handleDownloadCsvTemplate = () => {
    const csvContent = generateSampleCsvPermits();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Upload_Perizinan_Sertifikat.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download official XLSX template
  const handleDownloadXlsxTemplate = () => {
    const ws_data = [
      [
        'Nama Perusahaan',
        'Nama Perizinan',
        'Kategori',
        'Nomor Dokumen',
        'Instansi Penerbit',
        'Tanggal Terbit (YYYY-MM-DD)',
        'Tanggal Kedaluwarsa (YYYY-MM-DD)',
        'Nama PIC',
        'Email PIC',
        'Catatan Teknis'
      ],
      [
        'PT Nusantara Petrokimia Raya',
        'Izin Lingkungan Hidup (Persetujuan Lingkungan / AMDAL)',
        'Lingkungan Hidup',
        'SK.520/MENLHK/SETJEN/PLA.4/2021',
        'Kementerian Lingkungan Hidup dan Kehutanan RI',
        '2023-11-05',
        '2026-11-05',
        'Andri Wicaksono',
        'andri.cimb@gmail.com',
        'Kajian teknis addendum AMDAL dan persetujuan air limbah'
      ],
      [
        'PT Cipta Pangan Lestari',
        'Sertifikat Halal BPJPH (Bahan Baku & Lini Produksi)',
        'Kesehatan & Pangan',
        'ID00410000189420921',
        'BPJPH Kementerian Agama RI',
        '2022-11-15',
        '2026-11-15',
        'Hendra Gunawan',
        'andri.cimb@gmail.com',
        'Audit internal SJPH telah siap'
      ],
      [
        'PT Indo Prima Manufaktur Tbk',
        'Sertifikat Laik Fungsi (SLF) Gedung Pabrik & Gudang A',
        'Bangunan & Konstruksi',
        '640/SLF-DPMPTSP/BKS/2021',
        'Dinas Penanaman Modal & PTSP Kab. Bekasi',
        '2021-10-15',
        '2026-10-15',
        'Budi Santoso',
        'legal.indoprima@corp.co.id',
        'Dokumen perpanjangan SLF struktur baja'
      ],
      [
        'CV Berkah Energi Mandiri',
        'Surat Izin Laik Operasi (SLO) Genset Pembangkit Darurat 500 kVA',
        'Operasional & Teknis',
        'SLO-DJE/ESDM/2024/771',
        'Direktorat Jenderal Ketenagalistrikan ESDM',
        '2024-12-20',
        '2026-12-20',
        'Rahmat Hidayat',
        'rahmat.energi@gmail.com',
        'Jadwal inspeksi teknis dari LIT'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Perizinan Usaha');
    XLSX.writeFile(wb, `Template_Upload_Perizinan_Sertifikat.xlsx`);
  };

  // Normalize Category string
  const normalizeCategory = (catStr: string): PermitCategory => {
    const s = catStr.toLowerCase();
    if (s.includes('lingkungan') || s.includes('amdal') || s.includes('sppl') || s.includes('ukl')) return 'Lingkungan Hidup';
    if (s.includes('bangunan') || s.includes('slf') || s.includes('pbg') || s.includes('imb')) return 'Bangunan & Konstruksi';
    if (s.includes('halal') || s.includes('pangan') || s.includes('bpom') || s.includes('kesehatan') || s.includes('obat')) return 'Kesehatan & Pangan';
    if (s.includes('k3') || s.includes('smk3') || s.includes('tenaga') || s.includes('disnaker')) return 'K3 & Ketenagakerjaan';
    if (s.includes('operasi') || s.includes('slo') || s.includes('sipa') || s.includes('teknis')) return 'Operasional & Teknis';
    if (s.includes('iso') || s.includes('sni') || s.includes('mutu') || s.includes('standar')) return 'Mutu & Standar Industri';
    return 'Legalitas Dasar';
  };

  const processRawData = (rows: any[]) => {
    const validated: Permit[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              return row[rowKey];
            }
          }
        }
        return '';
      };

      const companyName = String(getVal('Nama Perusahaan', 'Perusahaan', 'NamaPT', 'Nama') || '').trim();
      const permitName = String(getVal('Nama Perizinan', 'Perizinan', 'Nama Sertifikat', 'Dokumen') || '').trim();
      const categoryRaw = String(getVal('Kategori', 'Sektor', 'Jenis Izin') || 'Legalitas Dasar').trim();
      const documentNumber = String(getVal('Nomor Dokumen', 'No Dokumen', 'No Registrasi', 'SK') || `REG-${Date.now().toString().slice(-6)}-${idx}`).trim();
      const issuingAuthority = String(getVal('Instansi Penerbit', 'Penerbit', 'Instansi', 'Kementerian') || 'Kementerian Investasi / BKPM').trim();
      const issuedDate = String(getVal('Tanggal Terbit', 'Tgl Terbit', 'Diterbitkan') || new Date().toISOString().split('T')[0]).trim();
      const expiryDate = String(getVal('Tanggal Kedaluwarsa', 'Tgl Kedaluwarsa', 'Tanggal Berakhir', 'Expiry') || '').trim();
      const picName = String(getVal('Nama PIC', 'PIC', 'Penanggung Jawab') || 'Andri Wicaksono').trim();
      const picEmail = String(getVal('Email PIC', 'Email', 'Surel') || 'andri.cimb@gmail.com').trim();
      const notes = String(getVal('Catatan Teknis', 'Catatan', 'Notes') || '').trim();

      if (!permitName) {
        errors.push(`Baris ${idx + 1}: Nama Perizinan kosong`);
        return;
      }
      if (!expiryDate) {
        errors.push(`Baris ${idx + 1}: Tanggal Kedaluwarsa kosong untuk "${permitName}"`);
        return;
      }

      // Match or assign company
      const matchedComp = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase()) || companies[0];

      validated.push({
        id: `prm-bulk-${Date.now().toString().slice(-6)}-${idx}`,
        companyId: matchedComp ? matchedComp.id : 'comp-1',
        companyName: companyName || (matchedComp ? matchedComp.name : 'PT Nusantara Petrokimia Raya'),
        permitName,
        category: normalizeCategory(categoryRaw),
        documentNumber,
        issuingAuthority,
        issuedDate: issuedDate || new Date().toISOString().split('T')[0],
        expiryDate,
        picName,
        picEmail,
        reminderIntervals: [90, 60, 30, 14, 7, 0],
        notes,
        followUpStatus: 'Belum Ditindaklanjuti'
      });
    });

    setValidatedData(validated);
    setErrorMessages(errors);
  };

  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        processRawData(json);
      } catch (err: any) {
        setErrorMessages([`Gagal memproses file: ${err.message || 'Format tidak valid'}`]);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteProcess = () => {
    if (!pasteCsvText.trim()) return;
    try {
      const workbook = XLSX.read(pasteCsvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      processRawData(json);
      setFileName('Manual_CSV_Paste.csv');
    } catch (err: any) {
      setErrorMessages([`Gagal mengurai teks CSV: ${err.message}`]);
    }
  };

  const handleCommit = () => {
    if (validatedData.length === 0) return;
    onImportSuccess(validatedData);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFileName(null);
    setValidatedData([]);
    setErrorMessages([]);
    setPasteCsvText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Tambah Perizinan via Upload Excel / CSV
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sesuai ketentuan sistem, pendaftaran perizinan &amp; sertifikat usaha dilakukan secara bulk menggunakan berkas Excel atau CSV untuk memastikan validitas data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Download Templates */}
        <div className="my-3 p-3 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-sky-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Gunakan format template resmi agar kolom terbaca dengan tepat:</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadXlsxTemplate}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleDownloadCsvTemplate}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-sky-800 border border-sky-300 text-xs font-semibold transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template CSV</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2 mb-3">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'upload'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unggah Berkas File (.xlsx, .xls, .csv)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'paste'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Salin &amp; Tempel (Copy-Paste CSV)
          </button>
        </div>

        {/* Body Upload / Paste */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {activeTab === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                dragActive
                  ? 'border-sky-500 bg-sky-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-bold text-slate-800">
                Pilih atau Geser File Excel/CSV Perizinan ke Sini
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Mendukung daftar perizinan NIB, AMDAL, SLF, Halal, BPOM, K3, SIPA, ISO, dsb.
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center space-x-1.5 mx-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Jelajahi Berkas Komputer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Tempelkan Teks Tabel CSV dari Excel / Google Sheet:
              </label>
              <textarea
                rows={5}
                value={pasteCsvText}
                onChange={(e) => setPasteCsvText(e.target.value)}
                placeholder={`Nama Perusahaan,Nama Perizinan,Kategori,Nomor Dokumen,Instansi Penerbit,Tanggal Terbit,Tanggal Kedaluwarsa,Nama PIC,Email PIC,Catatan Teknis\nPT Nusantara Petrokimia Raya,Izin Lingkungan Hidup (AMDAL),Lingkungan Hidup,SK.520/MENLHK,Kementerian LHK,2023-11-05,2026-11-05,Andri Wicaksono,andri.cimb@gmail.com,Kajian teknis addendum`}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteProcess}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Urai &amp; Validasi
                </button>
              </div>
            </div>
          )}

          {/* Error messages if any */}
          {errorMessages.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Peringatan Pembacaan Baris:</span>
              </div>
              {errorMessages.slice(0, 3).map((err, i) => (
                <p key={i} className="pl-5 text-[11px]">• {err}</p>
              ))}
            </div>
          )}

          {/* Validated preview table */}
          {validatedData.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-2 p-3 bg-slate-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Pratinjau ({validatedData.length} Dokumen Perizinan Siap Diimpor)
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-rose-600 hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Bersihkan</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-52 border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">No</th>
                      <th className="py-2 px-2.5">Nama Perizinan</th>
                      <th className="py-2 px-2.5">Perusahaan</th>
                      <th className="py-2 px-2.5">Kategori</th>
                      <th className="py-2 px-2.5">No Dokumen</th>
                      <th className="py-2 px-2.5">Kedaluwarsa</th>
                      <th className="py-2 px-2.5">PIC Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validatedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{item.permitName}</td>
                        <td className="py-1.5 px-2.5 text-slate-700">{item.companyName}</td>
                        <td className="py-1.5 px-2.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-500">{item.documentNumber}</td>
                        <td className="py-1.5 px-2.5 font-bold text-rose-700">{item.expiryDate}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-500">{item.picEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={validatedData.length === 0}
            onClick={handleCommit}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow ${
              validatedData.length > 0
                ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-sky-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Impor {validatedData.length} Dokumen Perizinan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

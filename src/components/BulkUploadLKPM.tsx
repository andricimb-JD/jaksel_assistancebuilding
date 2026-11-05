import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Trash2, 
  ArrowRight,
  Info,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LKPMRecord, LKPMStatus, LKPMPeriod, LKPMSanction, Company } from '../types';
import { generateSampleCsvLKPM, formatCurrencyIDR } from '../utils/helpers';

interface BulkUploadLKPMProps {
  companies: Company[];
  onBulkImportSuccess: (importedRecords: LKPMRecord[]) => void;
  onNavigateLKPM: () => void;
}

export const BulkUploadLKPM: React.FC<BulkUploadLKPMProps> = ({
  companies,
  onBulkImportSuccess,
  onNavigateLKPM
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validatedData, setValidatedData] = useState<LKPMRecord[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteCsvText, setPasteCsvText] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download official sample Excel template
  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCsvLKPM();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Bulk_Upload_LKPM_BKPM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download XLSX template
  const handleDownloadXlsxTemplate = () => {
    const ws_data = [
      [
        'Nama Perusahaan',
        'NIB',
        'Kode KBLI',
        'Judul KBLI',
        'Lokasi Proyek',
        'Skala Usaha',
        'Periode LKPM',
        'Tahun',
        'Batas Waktu (YYYY-MM-DD)',
        'Nilai Investasi (IDR)',
        'Status Pelaporan',
        'Tingkat Sanksi',
        'Nama PIC',
        'Email PIC',
        'Catatan Petugas'
      ],
      [
        'PT Nusantara Petrokimia Raya',
        '1289000452109',
        '20111',
        'Industri Kimia Dasar Anorganik Khlor dan Alkali',
        'Kawasan Industri Cilegon Kav. B-12 Banten',
        'Besar',
        'Triwulan III',
        2026,
        '2026-10-15',
        24500000000,
        'Belum Lapor',
        'Peringatan Tertulis I',
        'Andri Wicaksono',
        'andri.cimb@gmail.com',
        'Melewati batas pelaporan triwulanan'
      ],
      [
        'PT Indo Prima Manufaktur Tbk',
        '9120008471923',
        '29300',
        'Industri Suku Cadang Otomotif',
        'Kawasan MM2100 Cikarang Barat',
        'Besar',
        'Triwulan III',
        2026,
        '2026-10-15',
        15200000000,
        'Belum Lapor',
        'Peringatan Tertulis II',
        'Budi Santoso',
        'legal.indoprima@corp.co.id',
        'Terancam sanksi SP2'
      ],
      [
        'CV Berkah Energi Mandiri',
        '9120401122334',
        '35101',
        'Pembangkitan Tenaga Listrik Biomassa',
        'Jl. Ahmad Yani No. 88 Banjarbaru',
        'Kecil',
        'Semester I',
        2026,
        '2026-11-30',
        1200000000,
        'Draf',
        'Aman',
        'Rahmat Hidayat',
        'rahmat.energi@gmail.com',
        'Draf internal disiapkan'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template LKPM BKPM');
    XLSX.writeFile(wb, `Template_Bulk_Upload_LKPM_BKPM.xlsx`);
  };

  // Process rows into typed LKPMRecord objects
  const processRawData = (rows: any[]) => {
    const validated: LKPMRecord[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      // Find matching keys flexibly
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
      const nib = String(getVal('NIB', 'Nomor Induk Berusaha') || '0000000000000').trim();
      const kbliCode = String(getVal('Kode KBLI', 'KBLI', 'Kode') || '00000').trim();
      const kbliTitle = String(getVal('Judul KBLI', 'KBLI Description', 'Nama KBLI') || 'Kegiatan Usaha Berbasis Risiko').trim();
      const projectLocation = String(getVal('Lokasi Proyek', 'Lokasi', 'Alamat Proyek') || 'Indonesia').trim();
      const scale = (String(getVal('Skala Usaha', 'Skala') || 'Besar').trim()) as any;
      const period = (String(getVal('Periode LKPM', 'Periode', 'Triwulan') || 'Triwulan III').trim()) as LKPMPeriod;
      const year = Number(getVal('Tahun', 'Year')) || 2026;
      const deadlineDate = String(getVal('Batas Waktu', 'Batas Lapor', 'Deadline') || '2026-10-15').trim();
      const investmentRealization = Number(String(getVal('Nilai Investasi', 'Realisasi Investasi', 'Investasi') || '0').replace(/[^0-9]/g, '')) || 0;
      const statusRaw = String(getVal('Status Pelaporan', 'Status', 'Status LKPM') || 'Belum Lapor').trim();
      const sanctionRaw = String(getVal('Tingkat Sanksi', 'Sanksi') || 'Aman').trim();
      const picName = String(getVal('Nama PIC', 'PIC', 'Penanggung Jawab') || 'Admin Kepatuhan').trim();
      const picEmail = String(getVal('Email PIC', 'Email', 'Surel') || 'andri.cimb@gmail.com').trim();
      const officerNotes = String(getVal('Catatan Petugas', 'Catatan', 'Notes') || '').trim();

      if (!companyName) {
        errors.push(`Baris ${idx + 1}: Nama Perusahaan kosong`);
        return;
      }

      // Match or create company ID
      const matchedCompany = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
      const companyId = matchedCompany ? matchedCompany.id : `comp-auto-${Date.now().toString().slice(-4)}-${idx}`;

      let status: LKPMStatus = 'Belum Lapor';
      if (statusRaw.toLowerCase().includes('setuju')) status = 'Disetujui';
      else if (statusRaw.toLowerCase().includes('kirim')) status = 'Terkirim';
      else if (statusRaw.toLowerCase().includes('perbaikan') || statusRaw.toLowerCase().includes('revisi')) status = 'Perlu Perbaikan';
      else if (statusRaw.toLowerCase().includes('draf') || statusRaw.toLowerCase().includes('draft')) status = 'Draf';
      else status = 'Belum Lapor';

      let sanction: LKPMSanction = 'Aman';
      if (sanctionRaw.toLowerCase().includes('ii') || sanctionRaw.toLowerCase().includes('2')) sanction = 'Peringatan Tertulis II';
      else if (sanctionRaw.toLowerCase().includes('i') || sanctionRaw.toLowerCase().includes('1')) sanction = 'Peringatan Tertulis I';
      else if (sanctionRaw.toLowerCase().includes('beku')) sanction = 'Pembekuan Izin Sementara';

      validated.push({
        id: `lkpm-bulk-${Date.now().toString().slice(-6)}-${idx}`,
        companyId,
        companyName,
        nib: nib || (matchedCompany ? matchedCompany.nib : '1289000123456'),
        kbliCode,
        kbliTitle,
        projectLocation,
        scale: scale || 'Besar',
        period: period || 'Triwulan III',
        year,
        deadlineDate,
        investmentRealization,
        status,
        sanctionLevel: sanction,
        picName,
        picEmail,
        officerNotes
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

        setParsedRows(json);
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
      setParsedRows(json);
      processRawData(json);
      setFileName('Manual_CSV_Paste.csv');
    } catch (err: any) {
      setErrorMessages([`Gagal mengurai teks CSV: ${err.message}`]);
    }
  };

  const handleCommitImport = () => {
    if (validatedData.length === 0) return;
    onBulkImportSuccess(validatedData);
    onNavigateLKPM();
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    setValidatedData([]);
    setErrorMessages([]);
    setPasteCsvText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UploadCloud className="w-6 h-6 text-indigo-600" />
            <span>Bulk Upload &amp; Impor Massal Data LKPM</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Unggah file Excel (.xlsx / .xls) atau CSV untuk memasukkan puluhan hingga ratusan data kepatuhan LKPM proyek sekaligus dalam hitungan detik.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadXlsxTemplate}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300 transition flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Template Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs for Upload vs Paste */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unggah Berkas File (.xlsx, .xls, .csv)
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'paste'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Salin &amp; Tempel (Copy-Paste Teks CSV)
        </button>
      </div>

      {/* Upload Box / Drag & Drop */}
      {activeTab === 'upload' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-slate-400'
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

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-800">
            Tarik &amp; Lepaskan File Excel atau CSV Anda ke Sini
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV berkoma/berpemisah titik koma standar BKPM OSS-RBA.
          </p>

          <div className="mt-5 flex items-center justify-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Pilih Berkas dari Komputer</span>
            </button>
          </div>

          <div className="mt-4 text-[11px] text-slate-400">
            Ukuran maksimal 25 MB • Data langsung diproses di peramban Anda dengan aman
          </div>
        </div>
      ) : (
        /* Copy Paste Box */
        <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Tempelkan Data Tabel CSV / Excel (Pemisah Koma atau Tab):
          </label>
          <textarea
            rows={6}
            value={pasteCsvText}
            onChange={(e) => setPasteCsvText(e.target.value)}
            placeholder={`Nama Perusahaan,NIB,Kode KBLI,Judul KBLI,Lokasi Proyek,Skala Usaha,Periode LKPM,Tahun,Batas Waktu,Nilai Investasi,Status Pelaporan,Tingkat Sanksi,Nama PIC,Email PIC\nPT Nusantara Petrokimia Raya,1289000452109,20111,Industri Kimia,Cilegon,Besar,Triwulan III,2026,2026-10-15,24500000000,Belum Lapor,Peringatan Tertulis I,Andri Wicaksono,andri.cimb@gmail.com`}
            className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handlePasteProcess}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              Urai &amp; Validasi Teks
            </button>
          </div>
        </div>
      )}

      {/* Parsing Status & Preview Area */}
      {validatedData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-md p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Pratinjau Hasil Pembacaan: {fileName || 'Data Terurai'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Terdeteksi <strong className="text-emerald-700">{validatedData.length} baris valid</strong> siap diimpor ke sistem monitoring.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Batal / Bersihkan</span>
              </button>
              <button
                onClick={handleCommitImport}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Impor {validatedData.length} Data LKPM Sekarang</span>
              </button>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {errorMessages.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Catatan Validasi Baris ({errorMessages.length}):</span>
              </div>
              {errorMessages.slice(0, 3).map((err, i) => (
                <p key={i} className="pl-5 text-[11px]">• {err}</p>
              ))}
            </div>
          )}

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Perusahaan</th>
                  <th className="py-2.5 px-3">NIB</th>
                  <th className="py-2.5 px-3">KBLI</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Nilai Investasi</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sanksi</th>
                  <th className="py-2.5 px-3">PIC Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{item.companyName}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.nib}</td>
                    <td className="py-2 px-3 text-slate-700">{item.kbliCode}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{item.period} {item.year}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{formatCurrencyIDR(item.investmentRealization)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Belum Lapor' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-600">{item.sanctionLevel}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{item.picEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guide & Help Card */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Panduan Format Kolom Bulk Upload LKPM BKPM</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Nama Perusahaan:</strong> Wajib diisi sesuai nama entitas PT/CV terdaftar di OSS.</li>
            <li><strong>NIB:</strong> 13 digit Nomor Induk Berusaha.</li>
            <li><strong>Kode KBLI:</strong> 5 digit Klasifikasi Baku Lapangan Usaha Indonesia (contoh: 20111).</li>
            <li><strong>Periode LKPM:</strong> Triwulan I, Triwulan II, Triwulan III, Triwulan IV, atau Semester I/II.</li>
          </ul>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>Nilai Investasi:</strong> Angka numerik dalam Rupiah (tanpa titik atau simbol Rp).</li>
            <li><strong>Status Pelaporan:</strong> "Belum Lapor", "Draf", "Perlu Perbaikan", "Terkirim", "Disetujui".</li>
            <li><strong>Email PIC:</strong> Alamat email aktif untuk menerima notifikasi otomatis (contoh: andri.cimb@gmail.com).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

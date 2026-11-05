import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building2, 
  RefreshCw,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Company, Permit, LKPMRecord, ComplianceLogEvent } from '../types';
import { calculateDaysRemaining, calculateComplianceScore } from '../utils/helpers';

interface RealTimeTrackerProps {
  companies: Company[];
  permits: Permit[];
  lkpmRecords: LKPMRecord[];
  events: ComplianceLogEvent[];
  onForceRefresh: () => void;
  isSyncing: boolean;
  onNavigateTab: (tab: string) => void;
}

export const RealTimeTracker: React.FC<RealTimeTrackerProps> = ({
  companies,
  permits,
  lkpmRecords,
  events,
  onForceRefresh,
  isSyncing,
  onNavigateTab
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              <span>Pelacakan Real-Time Kepatuhan Perusahaan</span>
            </h2>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Engine Aktif</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit terus-menerus terhadap legalitas berusaha, tanggal kedaluwarsa, dan kepatuhan kewajiban pelaporan LKPM seluruh grup perusahaan secara real-time.
          </p>
        </div>

        <button
          onClick={onForceRefresh}
          disabled={isSyncing}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sinkronisasi Sistem...' : 'Paksa Audit Ulang Sekarang'}</span>
        </button>
      </div>

      {/* Real-time Status Card per Company */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>Matriks Kepatuhan Entitas &amp; Unit Usaha Terdaftar</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => {
            const compPermits = permits.filter((p) => p.companyId === company.id);
            const compLKPM = lkpmRecords.filter((l) => l.companyId === company.id);
            const score = calculateComplianceScore(compPermits, compLKPM);

            const expiredCount = compPermits.filter((p) => calculateDaysRemaining(p.expiryDate) < 0).length;
            const criticalCount = compPermits.filter((p) => {
              const d = calculateDaysRemaining(p.expiryDate);
              return d >= 0 && d <= 30;
            }).length;
            const pendingLKPMCount = compLKPM.filter((l) => l.status === 'Belum Lapor').length;

            let scoreBadge = 'bg-emerald-500 text-white';
            if (score < 60) scoreBadge = 'bg-rose-600 text-white';
            else if (score < 80) scoreBadge = 'bg-amber-500 text-white';

            return (
              <div 
                key={company.id} 
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Skala: {company.scale}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {company.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        NIB: {company.nib}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg font-black text-sm ${scoreBadge} shadow-sm`}>
                      {score}%
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{company.city}, {company.province}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 text-center mt-3 pt-3 border-t border-slate-100">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-xs font-bold text-slate-800">{compPermits.length}</div>
                      <div className="text-[10px] text-slate-500">Total Izin</div>
                    </div>
                    <div className={`p-2 rounded-lg ${expiredCount + criticalCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-800'}`}>
                      <div className="text-xs font-bold">{expiredCount + criticalCount}</div>
                      <div className="text-[10px]">Kritis/Expired</div>
                    </div>
                    <div className={`p-2 rounded-lg ${pendingLKPMCount > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-800'}`}>
                      <div className="text-xs font-bold">{pendingLKPMCount}</div>
                      <div className="text-[10px]">LKPM Pending</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">PIC: {company.picName}</span>
                  <button
                    onClick={() => onNavigateTab('permits')}
                    className="text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Detail Legalitas →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Activity Stream */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Linimasa Audit &amp; Aktivitas Sistem Kepatuhan Terkini</span>
            </h3>
            <p className="text-xs text-slate-500">Pemberitahuan perubahan status perizinan, deteksi sanksi LKPM, dan pengiriman notifikasi</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time Stream</span>
        </div>

        <div className="space-y-3">
          {events.map((ev) => {
            let icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            let borderColor = 'border-l-emerald-500 bg-emerald-50/30';
            if (ev.severity === 'danger') {
              icon = <AlertOctagon className="w-4 h-4 text-rose-600" />;
              borderColor = 'border-l-rose-500 bg-rose-50/40';
            } else if (ev.severity === 'warning') {
              icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
              borderColor = 'border-l-amber-500 bg-amber-50/30';
            } else if (ev.severity === 'info') {
              icon = <Mail className="w-4 h-4 text-sky-600" />;
              borderColor = 'border-l-sky-500 bg-sky-50/30';
            }

            return (
              <div 
                key={ev.id}
                className={`p-3.5 rounded-r-xl border border-slate-200/80 border-l-4 ${borderColor} transition flex items-start justify-between gap-3`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">{icon}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                      <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.2 bg-white rounded border border-slate-200">
                        {ev.entityName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ev.description}</p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {ev.timestamp}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

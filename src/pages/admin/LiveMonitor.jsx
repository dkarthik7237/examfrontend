import { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, Shield, RefreshCw, Users } from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';

const StrikeBar = ({ count, max }) => {
  const pct = Math.min((count / max) * 100, 100);
  const color = pct >= 100 ? 'bg-red-500' : pct >= 66 ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor = pct >= 100 ? 'text-red-600' : pct >= 66 ? 'text-amber-600' : 'text-emerald-600';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{count}/{max}</span>
    </div>
  );
};

const SessionRow = ({ session }) => {
  const minutes = Math.floor(session.remainingSeconds / 60);
  const seconds = session.remainingSeconds % 60;
  const isDanger = session.remainingSeconds <= 60;
  const isWarning = session.remainingSeconds <= 300 && !isDanger;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${
      session.status === 'Debarred'
        ? 'bg-red-50 border-red-200'
        : 'bg-white border-surface-200 hover:border-surface-300 hover:shadow-sm'
    }`}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          session.status === 'Debarred'
            ? 'bg-red-100 text-red-600'
            : 'bg-gradient-to-br from-brand-500 to-violet-600 text-white'
        }`}>
          {session.student?.name?.[0]?.toUpperCase() ?? '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-surface-900 truncate">{session.student?.name}</p>
            <StatusBadge status={session.status} />
          </div>
          <p className="text-xs text-surface-500 truncate">{session.exam?.title}</p>
          <div className="mt-1.5">
            <StrikeBar count={session.strikeCount} max={session.maxStrikes} />
          </div>
        </div>

        {/* Timer */}
        <div className={`text-right flex-shrink-0 font-mono font-bold text-lg tabular-nums px-3 py-1.5 rounded-lg ${
          isDanger
            ? 'text-red-600 bg-red-100'
            : isWarning
            ? 'text-amber-700 bg-amber-100'
            : 'text-surface-800 bg-surface-100'
        }`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          <p className="text-xs text-surface-500 font-sans font-normal">{session.answeredCount} answered</p>
        </div>
      </div>
    </div>
  );
};

const LiveMonitor = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/monitor');
      setSessions(data.sessions);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const poll = setInterval(fetchSessions, 5000);
    return () => clearInterval(poll);
  }, [fetchSessions]);

  const activeCount   = sessions.filter((s) => s.status === 'Pending').length;
  const debarredCount = sessions.filter((s) => s.status === 'Debarred').length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">
                Live <span className="text-gradient">Monitor</span>
              </h1>
              <p className="text-surface-500 mt-1">Real-time exam session tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                <RefreshCw size={12} className="animate-spin" />
                Auto-polling
              </div>
              <button className="btn-secondary btn-sm" onClick={fetchSessions}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center py-4">
              <Users size={20} className="text-brand-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-surface-900">{sessions.length}</p>
              <p className="text-xs text-surface-500">Total active</p>
            </div>
            <div className="card text-center py-4">
              <Activity size={20} className="text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-surface-900">{activeCount}</p>
              <p className="text-xs text-surface-500">In progress</p>
            </div>
            <div className="card text-center py-4">
              <Shield size={20} className="text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-surface-900">{debarredCount}</p>
              <p className="text-xs text-surface-500">Debarred</p>
            </div>
          </div>

          {/* Session list */}
          {loading ? (
            <div className="text-center py-16 text-surface-400">Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="card text-center py-16">
              <Activity size={40} className="text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600 font-medium">No active exam sessions</p>
              <p className="text-surface-400 text-sm mt-1">This panel updates automatically when students start exams</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionRow key={session.submissionId} session={session} />
              ))}
            </div>
          )}

          {sessions.length > 0 && (
            <p className="text-xs text-surface-400 text-right mt-4">
              Last updated: {lastUpdate.toLocaleTimeString()} · Auto-refreshes every 5s
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveMonitor;

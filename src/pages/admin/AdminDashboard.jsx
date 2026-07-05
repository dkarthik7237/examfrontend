import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, Activity, TrendingUp, CheckCircle, Clock, UserPlus, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/common/Sidebar';

const StatCard = ({ icon: Icon, label, value, color, sublabel }) => (
  <div className="stat-card">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-bold text-surface-900">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
      {sublabel && <p className="text-xs text-surface-400 mt-0.5">{sublabel}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-900">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-surface-500 mt-1">Overview of your ExamSpace platform</p>
          </div>

          {loading ? <LoadingSpinner text="Loading stats…" /> : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard icon={BookOpen} label="Total Courses" value={stats.courses} color="bg-brand-100 text-brand-600" />
                <StatCard icon={FileText} label="Total Exams" value={stats.exams} color="bg-violet-100 text-violet-600" />
                <StatCard icon={Users} label="Registered Students" value={stats.students} color="bg-cyan-100 text-cyan-600" />
                <StatCard icon={Activity} label="Active Sessions" value={stats.activeExams} color="bg-green-100 text-green-600" sublabel="Currently taking exams" />
                <StatCard icon={TrendingUp} label="Total Submissions" value={stats.submissions} color="bg-amber-100 text-amber-600" />
                <StatCard icon={CheckCircle} label="Graded" value={stats.gradedSubmissions} color="bg-emerald-100 text-emerald-600" sublabel="Results published" />
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { to: '/admin/courses', icon: BookOpen, color: 'text-brand-600 bg-brand-100', title: 'Manage Courses', sub: 'Create exams & questions' },
                    { to: '/admin/students', icon: UserPlus, color: 'text-violet-600 bg-violet-100', title: 'Manage Students', sub: 'Edit accounts & credentials' },
                    { to: '/admin/monitor', icon: Activity, color: 'text-green-600 bg-green-100', title: 'Live Monitor', sub: `${stats.activeExams} active session(s)` },
                    { to: '/admin/submissions', icon: Clock, color: 'text-amber-600 bg-amber-100', title: 'Grade Submissions', sub: 'Review & finalize results' },
                  ].map(({ to, icon: Icon, color, title, sub }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group flex items-center gap-3 p-4 bg-surface-100 hover:bg-surface-200 border border-surface-200 hover:border-surface-300 rounded-xl transition-all duration-200"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-surface-900 text-sm">{title}</p>
                        <p className="text-xs text-surface-500 truncate">{sub}</p>
                      </div>
                      <ArrowRight size={14} className="text-surface-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

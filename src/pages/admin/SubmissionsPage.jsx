import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Search, Filter, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/common/Sidebar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/admin/submissions?${params}`)
      .then(({ data }) => setSubmissions(data.submissions))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = submissions.filter((s) =>
    !search ||
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.exam?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const pct = (s) => s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-900">
              Submissions
            </h1>
            <p className="text-surface-500 mt-1">Review, grade, and finalize student exam results</p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                className="input pl-10"
                placeholder="Search student or exam…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <select
                className="input pl-10 pr-8 appearance-none bg-white cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Debarred">Debarred</option>
                <option value="Graded">Graded</option>
              </select>
            </div>
          </div>

          {loading ? <LoadingSpinner text="Loading submissions…" /> : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Strikes</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-surface-400">
                        <ClipboardList size={32} className="mx-auto mb-2 text-surface-300" />
                        No submissions found
                      </td>
                    </tr>
                  )}
                  {filtered.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {s.student?.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-surface-900">{s.student?.name}</p>
                            <p className="text-xs text-surface-500">{s.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm font-medium text-surface-900">{s.exam?.title}</p>
                        <p className="text-xs text-surface-500">{s.exam?.duration} min</p>
                      </td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        {s.status !== 'Pending' ? (
                          <div>
                            <p className="text-sm font-bold text-surface-900">{s.score}/{s.totalMarks}</p>
                            <p className={`text-xs font-medium ${s.isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
                              {pct(s)}% · {s.isPassed ? 'Passed' : 'Failed'}
                            </p>
                          </div>
                        ) : <span className="text-surface-400 text-sm">—</span>}
                      </td>
                      <td>
                        <span className={`text-sm font-semibold ${s.strikeCount > 0 ? 'text-amber-600' : 'text-surface-400'}`}>
                          {s.strikeCount}
                        </span>
                      </td>
                      <td className="text-xs text-surface-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          to={`/admin/submissions/${s._id}`}
                          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-semibold"
                        >
                          {s.status === 'Graded' ? 'View' : 'Grade'} <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubmissionsPage;

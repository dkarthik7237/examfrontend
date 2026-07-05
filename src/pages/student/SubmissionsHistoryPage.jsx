import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Trophy, XCircle, Clock, AlertTriangle,
  ChevronRight, ArrowUpRight, TrendingUp, CheckCircle, Loader
} from 'lucide-react';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

const statusMeta = {
  Graded:    { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Graded' },
  Submitted: { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-100',   label: 'Awaiting Review' },
  Pending:   { icon: Loader,      color: 'text-brand-600',   bg: 'bg-brand-100',   label: 'In Progress' },
  Debarred:  { icon: AlertTriangle, color: 'text-red-600',  bg: 'bg-red-100',     label: 'Debarred' },
};

const SubmissionCard = ({ submission }) => {
  const meta = statusMeta[submission.status] ?? statusMeta.Submitted;
  const Icon = meta.icon;

  const isGraded = submission.status === 'Graded';
  const pct = isGraded && submission.totalMarks > 0
    ? Math.round((submission.score / submission.totalMarks) * 100 * 10) / 10
    : null;

  const examDate = submission.exam?.startTime
    ? new Date(submission.exam.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <div className={`card hover:shadow-md transition-all duration-200 ${isGraded ? 'hover:border-brand-200' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <Icon size={20} className={meta.color} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-surface-900 truncate">{submission.exam?.title ?? 'Unknown Exam'}</h3>
              <p className="text-xs text-surface-500 mt-0.5">{examDate} · {submission.exam?.duration} min</p>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          <div className="mt-3 flex items-center gap-4 flex-wrap">
            {isGraded && pct !== null && (
              <>
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp size={14} className="text-surface-400" />
                  <span className={`font-bold ${pct >= (submission.exam?.passingPercentage ?? 40) ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pct}%
                  </span>
                  <span className="text-surface-400">
                    ({submission.score ?? 0}/{submission.totalMarks ?? 0} marks)
                  </span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  submission.isPassed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {submission.isPassed ? <><Trophy size={11} /> Passed</> : <><XCircle size={11} /> Failed</>}
                </div>
              </>
            )}

            {submission.status === 'Submitted' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Results pending review
              </p>
            )}

            {submission.status === 'Pending' && (
              <p className="text-xs text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                Exam in progress
              </p>
            )}

            {submission.strikeCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle size={11} /> {submission.strikeCount} strike(s)
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 self-center">
          {isGraded ? (
            <Link
              to={`/student/result/${submission._id}`}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              View Result <ArrowUpRight size={13} />
            </Link>
          ) : submission.status === 'Pending' ? (
            <Link
              to={`/student/exam/${submission.exam?._id}`}
              className="btn-secondary btn-sm"
            >
              Resume
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center">
              <ChevronRight size={14} className="text-surface-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SubmissionsHistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/my-submissions')
      .then(({ data }) => setSubmissions(data.submissions))
      .catch(() => setError('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, []);

  const graded = submissions.filter(s => s.status === 'Graded');
  const passed = graded.filter(s => s.isPassed);
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((acc, s) => acc + (s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0), 0) / graded.length * 10) / 10
    : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900">
            My <span className="text-gradient">Submissions</span>
          </h1>
          <p className="text-surface-500 mt-1">Your exam history and results</p>
        </div>

        {/* Stats row */}
        {!loading && submissions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-surface-900">{submissions.length}</p>
              <p className="text-xs text-surface-500 mt-0.5">Total</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-emerald-600">{graded.length}</p>
              <p className="text-xs text-surface-500 mt-0.5">Graded</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-brand-600">{passed.length}</p>
              <p className="text-xs text-surface-500 mt-0.5">Passed</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-violet-600">{graded.length > 0 ? `${avgScore}%` : '—'}</p>
              <p className="text-xs text-surface-500 mt-0.5">Avg Score</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner text="Loading your submissions…" />
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="card text-center py-16">
            <ClipboardList size={44} className="text-surface-300 mx-auto mb-3" />
            <p className="text-surface-600 font-medium mb-1">No submissions yet</p>
            <p className="text-surface-400 text-sm">Take an exam to see your results here.</p>
            <Link to="/student" className="btn-primary btn-sm mt-5 inline-flex">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <SubmissionCard key={sub._id} submission={sub} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SubmissionsHistoryPage;

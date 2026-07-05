import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle, XCircle, MinusCircle, Trophy, TrendingUp,
  ArrowLeft, Clock, AlertTriangle, BookOpen
} from 'lucide-react';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const ResultPage = () => {
  const { submissionId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/student/submissions/${submissionId}/result`)
      .then(({ data }) => setResult(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) return <><Navbar /><LoadingSpinner fullScreen text="Loading your result…" /></>;

  if (error) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-200 flex items-center justify-center">
        <div className="card text-center max-w-md mx-4 py-12 shadow-md">
          <Clock size={40} className="text-surface-400 mx-auto mb-4" />
          <p className="text-surface-800 font-semibold mb-2">Result Not Available Yet</p>
          <p className="text-surface-500 text-sm mb-6">{error}</p>
          <Link to="/student" className="btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    </>
  );

  const { submission: sub, exam, breakdown } = result;
  const pct = sub.percentage;

  const correct = breakdown.filter((q) => q.isCorrect).length;
  const wrong   = breakdown.filter((q) => !q.isCorrect && q.studentAnswer !== null).length;
  const skipped = breakdown.filter((q) => q.studentAnswer === null).length;

  return (
    <div className="min-h-screen bg-surface-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/student" className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 mb-6 transition-colors font-medium">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>

        {/* Score card */}
        <div className={`card mb-6 text-center py-10 border-2 shadow-sm ${
          sub.isPassed
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${sub.isPassed ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {sub.isPassed
              ? <Trophy size={40} className="text-emerald-500" />
              : <XCircle size={40} className="text-red-500" />}
          </div>
          <h1 className="text-4xl font-bold text-surface-900 mb-1">{pct}%</h1>
          <p className={`text-xl font-bold mb-2 ${sub.isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
            {sub.isPassed ? '🎉 Passed!' : 'Failed'}
          </p>
          <p className="text-surface-500 text-sm">
            {exam.title} · Pass threshold: {exam.passingPercentage}%
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-6">
            <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-sm">
              <p className="text-emerald-600 font-bold text-lg">{correct}</p>
              <p className="text-xs text-surface-500">Correct</p>
            </div>
            <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-sm">
              <p className="text-red-500 font-bold text-lg">{wrong}</p>
              <p className="text-xs text-surface-500">Wrong</p>
            </div>
            <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-sm">
              <p className="text-surface-600 font-bold text-lg">{skipped}</p>
              <p className="text-xs text-surface-500">Skipped</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-surface-600">
            <TrendingUp size={15} />
            Score: {sub.score} / {sub.totalMarks} marks
          </div>
          {sub.strikeCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 mt-2">
              <AlertTriangle size={13} /> {sub.strikeCount} anti-cheat strike(s) recorded
            </div>
          )}
        </div>

        {/* Per-question breakdown */}
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Answer Breakdown</h2>
        <div className="space-y-3">
          {breakdown.map((q, i) => (
            <div key={q.questionId} className={`rounded-xl border p-4 bg-white shadow-sm ${
              q.isCorrect
                ? 'border-emerald-200'
                : q.studentAnswer !== null
                ? 'border-red-200'
                : 'border-surface-200'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-0.5">
                  {q.isCorrect
                    ? <CheckCircle size={18} className="text-emerald-500" />
                    : q.studentAnswer !== null
                    ? <XCircle size={18} className="text-red-500" />
                    : <MinusCircle size={18} className="text-surface-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900">
                    Q{i + 1}. {q.text}
                  </p>
                  {q.hasOverride && (
                    <span className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <BookOpen size={11} /> Grade adjusted by instructor
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${
                  q.isCorrect
                    ? 'text-emerald-600'
                    : q.studentAnswer !== null
                    ? 'text-red-500'
                    : 'text-surface-400'
                }`}>
                  {q.isCorrect ? `+${q.positiveMarks}` : q.studentAnswer !== null ? `-${q.negativeMarks}` : '0'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-7">
                {q.options.map((opt, oi) => {
                  const isCorrectOpt  = oi === q.correctOptionIndex;
                  const isStudentOpt  = q.studentAnswer !== null && Number(q.studentAnswer) === oi;

                  let cls = 'text-surface-500 bg-surface-100 border border-surface-200';
                  if (isCorrectOpt && isStudentOpt) cls = 'text-emerald-700 bg-emerald-100 border border-emerald-200 font-medium';
                  else if (isCorrectOpt) cls = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
                  else if (isStudentOpt) cls = 'text-red-600 bg-red-50 border border-red-200';

                  return (
                    <div key={oi} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${cls}`}>
                      <span className="font-bold w-4 flex-shrink-0">{OPTION_LETTERS[oi]}</span>
                      <span className="truncate">{opt}</span>
                      {isCorrectOpt && <CheckCircle size={11} className="ml-auto flex-shrink-0 text-emerald-600" />}
                      {isStudentOpt && !isCorrectOpt && <XCircle size={11} className="ml-auto flex-shrink-0 text-red-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ResultPage;

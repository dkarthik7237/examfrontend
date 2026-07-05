import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, MinusCircle, Save,
  Flag, AlertTriangle, User, BookOpen, Clock, Target, Shield
} from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const OverrideControl = ({ override, onChange }) => (
  <div className="flex gap-1.5">
    <button
      title="Auto-grade (reset override)"
      onClick={() => onChange(null)}
      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${override === null || override === undefined ? 'bg-surface-700 text-white' : 'bg-surface-100 text-surface-500 border border-surface-200 hover:bg-surface-200'}`}
    >Auto</button>
    <button
      title="Mark as correct"
      onClick={() => onChange(true)}
      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${override === true ? 'bg-emerald-600 text-white' : 'bg-surface-100 text-surface-500 border border-surface-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
    >✓ Correct</button>
    <button
      title="Mark as incorrect"
      onClick={() => onChange(false)}
      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${override === false ? 'bg-red-600 text-white' : 'bg-surface-100 text-surface-500 border border-surface-200 hover:bg-red-50 hover:text-red-600'}`}
    >✗ Wrong</button>
  </div>
);

const QuestionReview = ({ question, studentAnswer, overrides, onChange }) => {
  const qId = question._id;
  const override = overrides[qId];
  const isAutoCorrect = studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === question.correctOptionIndex;

  let effectiveResult;
  if (override === true) effectiveResult = 'correct';
  else if (override === false) effectiveResult = 'wrong';
  else effectiveResult = (studentAnswer !== undefined && studentAnswer !== null) ? (isAutoCorrect ? 'correct' : 'wrong') : 'unanswered';

  const resultConfig = {
    correct:   { icon: CheckCircle, color: 'text-emerald-600', bg: 'border-emerald-200 bg-emerald-50', label: `+${question.positiveMarks}` },
    wrong:     { icon: XCircle,     color: 'text-red-500',     bg: 'border-red-200 bg-red-50',         label: `-${question.negativeMarks}` },
    unanswered:{ icon: MinusCircle, color: 'text-surface-400', bg: 'border-surface-200 bg-white',      label: '0' },
  };
  const { icon: Icon, color, bg, label } = resultConfig[effectiveResult];

  return (
    <div className={`rounded-xl border p-4 ${bg} transition-all`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-surface-900 flex-1">{question.text}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-bold ${color}`}>{label}</span>
          <Icon size={16} className={color} />
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {question.options.map((opt, i) => {
          const isCorrectOpt = i === question.correctOptionIndex;
          const isStudentOpt = studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === i;

          let cls = 'text-surface-500 border-surface-200 bg-surface-100';
          if (isCorrectOpt && isStudentOpt) cls = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
          else if (isCorrectOpt) cls = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
          else if (isStudentOpt) cls = 'text-red-400 border-red-500/50 bg-red-500/10';

          return (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${cls}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold flex-shrink-0">{OPTION_LETTERS[i]}</span>
              <span className="truncate">{opt}</span>
              {isCorrectOpt && <CheckCircle size={12} className="ml-auto flex-shrink-0" />}
              {isStudentOpt && !isCorrectOpt && <XCircle size={12} className="ml-auto flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Override controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-surface-400">Admin override:</p>
        <OverrideControl override={override} onChange={(val) => onChange(qId, val)} />
      </div>
    </div>
  );
};

const SubmissionDetail = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const fetchSubmission = () => {
    api.get(`/admin/submissions/${id}`).then(({ data }) => {
      setSubmission(data.submission);
      // Pre-populate overrides from saved data
      const saved = {};
      if (data.submission.questionOverrides) {
        if (data.submission.questionOverrides instanceof Object) {
          Object.entries(data.submission.questionOverrides).forEach(([k, v]) => { saved[k] = v; });
        }
      }
      setOverrides(saved);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubmission(); }, [id]);

  const handleSaveOverrides = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/submissions/${id}/override`, { overrides });
      toast.success(`Score recalculated: ${data.score}/${data.totalMarks}`);
      fetchSubmission();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save overrides');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!confirm('Finalize this submission? The student will be able to view their result.')) return;
    setFinalizing(true);
    try {
      // Save overrides first if any
      if (Object.keys(overrides).length > 0) {
        await api.put(`/admin/submissions/${id}/override`, { overrides });
      }
      await api.put(`/admin/submissions/${id}/finalize`);
      toast.success('Submission finalized! Student can now view their result.');
      fetchSubmission();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to finalize');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) return <div className="flex min-h-screen"><Sidebar /><LoadingSpinner fullScreen /></div>;
  if (!submission) return null;

  const exam = submission.exam;
  const questions = exam?.questions ?? [];
  const pct = submission.totalMarks > 0 ? Math.round((submission.score / submission.totalMarks) * 100) : 0;
  const canOverride = ['Submitted', 'Debarred', 'Graded'].includes(submission.status);

  const getStudentAnswer = (qId) => {
    if (!submission.answers) return undefined;
    // answers may come as plain object from JSON
    return submission.answers[qId] ?? submission.answers?.get?.(qId);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Link to="/admin/submissions" className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to Submissions
          </Link>

          {/* Header card */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-brand-500" />
                <div>
                  <p className="text-xs text-surface-500">Student</p>
                  <p className="font-semibold text-surface-900">{submission.student?.name}</p>
                  <p className="text-xs text-surface-400">{submission.student?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-violet-400" />
                <div>
                  <p className="text-xs text-surface-500">Exam</p>
                  <p className="font-semibold text-surface-900 text-sm">{exam?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Target size={16} className="text-amber-400" />
                <div>
                  <p className="text-xs text-surface-500">Score</p>
                  <p className="font-bold text-surface-900">{submission.score}/{submission.totalMarks} <span className="text-sm font-normal text-surface-500">({pct}%)</span></p>
                  <p className={`text-xs font-medium ${submission.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {submission.isPassed ? '✓ Passed' : '✗ Failed'} (threshold: {exam?.passingPercentage}%)
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Status</p>
                <StatusBadge status={submission.status} />
                {submission.strikeCount > 0 && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> {submission.strikeCount} strike(s)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Proctoring Log Section */}
          <div className="card mb-6 bg-white border border-surface-200 shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-brand-500" />
              Proctoring Audit Log (Anti-Cheat History)
            </h2>
            {submission.proctoringLogs && submission.proctoringLogs.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-[14px] before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200">
                {submission.proctoringLogs.map((log, index) => {
                  let badgeColor = 'bg-surface-100 text-surface-600 border-surface-200';
                  if (log.event === 'Exam Started') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  else if (log.event === 'Tab Switch (Strike)') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (log.event === 'Debarred') badgeColor = 'bg-red-50 text-red-700 border-red-200';
                  else if (log.event.startsWith('Exam Submitted') || log.event.startsWith('Auto-Submitted')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <div key={index} className="flex items-start gap-4 pl-8 relative">
                      <div className="absolute left-[9px] top-[7px] w-3.5 h-3.5 rounded-full border-2 border-brand-500 bg-white z-10" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold border ${badgeColor}`}>{log.event}</span>
                          <span className="text-xs text-surface-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-surface-600 font-medium">{log.details}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-surface-400">No proctoring logs recorded for this submission.</p>
            )}
          </div>

          {/* Question reviews */}
          {canOverride && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900">Answer Review</h2>
                <div className="flex gap-2">
                  <button className="btn-secondary btn-sm" onClick={handleSaveOverrides} disabled={saving}>
                    <Save size={14} />
                    {saving ? 'Saving…' : 'Save & Recalculate'}
                  </button>
                  {submission.status !== 'Graded' && (
                    <button className="btn-success btn-sm" onClick={handleFinalize} disabled={finalizing}>
                      <Flag size={14} />
                      {finalizing ? 'Finalizing…' : 'Finalize Result'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {questions.map((q) => (
                  <QuestionReview
                    key={q._id}
                    question={q}
                    studentAnswer={getStudentAnswer(q._id.toString())}
                    overrides={overrides}
                    onChange={(qId, val) => setOverrides((prev) => {
                      const next = { ...prev };
                      if (val === null) delete next[qId];
                      else next[qId] = val;
                      return next;
                    })}
                  />
                ))}
              </div>

              {submission.status === 'Graded' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-300">
                    This submission was finalized on {new Date(submission.finalizedAt).toLocaleString()}. The student can view their result.
                  </p>
                </div>
              )}
            </>
          )}

          {submission.status === 'Pending' && (
            <div className="card text-center py-10">
              <Clock size={36} className="text-surface-300 mx-auto mb-2" />
              <p className="text-surface-500">This exam is still in progress. The student has not submitted yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubmissionDetail;

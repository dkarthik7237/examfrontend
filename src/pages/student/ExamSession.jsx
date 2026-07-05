import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, AlertTriangle, Shield, CheckCircle, Send,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useExamTimer from '../../hooks/useExamTimer';
import Sidebar from '../../components/common/Sidebar';
import { toast } from 'react-toastify';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ── Strike Warning Overlay ─────────────────────────────────────────
const StrikeWarning = ({ count, max, onDismiss }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl animate-scale-in">
      <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-amber-800 mb-2">Anti-Cheat Warning!</h2>
      <p className="text-amber-700 text-sm mb-4">
        Tab switching or leaving the exam window is not allowed.
      </p>
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className={`w-6 h-6 rounded-full border-2 transition-all ${i < count ? 'bg-amber-500 border-amber-400' : 'bg-white border-amber-300'}`} />
        ))}
      </div>
      <p className="text-sm text-amber-700 font-semibold mb-5">
        Strike {count} of {max} — {max - count} remaining before debarment
      </p>
      <button onClick={onDismiss} className="btn-primary w-full">Return to Exam</button>
    </div>
  </div>
);

// ── Debarment Overlay ──────────────────────────────────────────────
const DebarmentOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/70 backdrop-blur-sm">
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl animate-scale-in">
      <Shield size={52} className="text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-red-800 mb-3">Debarred</h2>
      <p className="text-red-700 mb-6">
        You have violated exam rules too many times. Your submission has been recorded and the session is closed.
      </p>
      <p className="text-xs text-red-500">Contact your instructor for more information.</p>
    </div>
  </div>
);

// ── Time Expired Overlay ───────────────────────────────────────────
const TimeExpiredOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm">
    <div className="card max-w-sm w-full mx-4 text-center py-10 shadow-xl animate-scale-in">
      <Clock size={48} className="text-surface-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-surface-900 mb-2">Time's Up!</h2>
      <p className="text-surface-500 text-sm">Your exam has been submitted automatically.</p>
    </div>
  </div>
);

// ── Main ExamSession ───────────────────────────────────────────────
const ExamSession = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [overlay, setOverlay] = useState(null); // null | 'strike' | 'debarred' | 'expired' | 'submitted'
  const [strikeInfo, setStrikeInfo] = useState({ count: 0, max: 3 });
  const [submitting, setSubmitting] = useState(false);

  // Use refs so async callbacks always see current values without stale closure bugs
  const submissionIdRef = useRef(null);
  const overlayRef = useRef(null);

  const setOverlaySynced = (val) => {
    overlayRef.current = val;
    setOverlay(val);
  };

  // Load or start session
  useEffect(() => {
    const init = async () => {
      try {
        let data;
        try {
          const res = await api.get(`/student/exams/${examId}/session`);
          data = res.data;
        } catch {
          // No existing session → start one
          const res = await api.post(`/student/exams/${examId}/start`);
          data = res.data;
        }

        setSession(data);
        submissionIdRef.current = data.submission._id;
        setStrikeInfo({ count: data.submission.strikeCount, max: data.exam.maxStrikes });

        // Restore saved answers
        if (data.submission.answers) {
          setAnswers(data.submission.answers);
        }

        // If already debarred/submitted show overlay immediately
        if (data.submission.status === 'Debarred') {
          setOverlaySynced('debarred');
        } else if (['Submitted', 'Graded'].includes(data.submission.status)) {
          setOverlaySynced('submitted');
        } else if (data.remainingSeconds <= 0) {
          // Timer already expired — auto-submit immediately
          handleAutoSubmit(data.submission._id);
        }

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam session');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // ── Page Visibility Anti-Cheat ─────────────────────────────────
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.hidden && overlayRef.current === null && submissionIdRef.current) {
        try {
          const { data } = await api.post(`/student/submissions/${submissionIdRef.current}/strike`);
          setStrikeInfo({ count: data.strikeCount, max: data.maxStrikes });
          if (data.debarred) {
            setOverlaySynced('debarred');
          } else {
            setOverlaySynced('strike');
          }
        } catch (_) {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []); // stable — uses refs, no stale closure issue

  // ── Auto-submit helper (called on time expiry) ─────────────────
  const handleAutoSubmit = useCallback(async (subId) => {
    const id = subId || submissionIdRef.current;
    if (!id) return;
    try {
      await api.post(`/student/submissions/${id}/submit`);
    } catch (_) {
      // Already submitted is fine — backend guards it
    }
    setOverlaySynced('expired');
  }, []);

  // Timer expiry callback — FIX: actually submits the exam
  const handleTimeExpired = useCallback(() => {
    if (overlayRef.current === null) {
      handleAutoSubmit();
    }
  }, [handleAutoSubmit]);

  const handleSync = useCallback((data) => {
    if (data?.submission?.status === 'Debarred') {
      setOverlaySynced('debarred');
    } else if (['Submitted', 'Graded'].includes(data?.submission?.status)) {
      setOverlaySynced('submitted');
    }
  }, []);

  const { formatted, isWarning, isDanger } = useExamTimer(
    session?.submission?._id,
    examId,
    session?.remainingSeconds,
    handleTimeExpired,
    handleSync
  );

  // ── Answer Selection ───────────────────────────────────────────
  const handleSelectOption = useCallback(async (questionId, displayIdx) => {
    if (overlayRef.current) return;
    const optionMaps = session?.optionMaps;
    const originalIdx = optionMaps?.[questionId]?.[displayIdx] ?? displayIdx;

    setAnswers((prev) => ({ ...prev, [questionId]: originalIdx }));

    try {
      await api.put(`/student/submissions/${submissionIdRef.current}/answer`, {
        questionId,
        originalOptionIndex: originalIdx,
      });
    } catch (err) {
      setAnswers((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
      
      const status = err.response?.status;
      const errMsg = err.response?.data?.message;
      
      if (status === 403 || status === 400) {
        try {
          const { data } = await api.get(`/student/exams/${examId}/session`);
          if (data?.submission?.status === 'Debarred') {
            setOverlaySynced('debarred');
          } else if (['Submitted', 'Graded'].includes(data?.submission?.status)) {
            setOverlaySynced('submitted');
          } else {
            setOverlaySynced('expired');
          }
        } catch (_) {
          setOverlaySynced('expired');
        }
      } else {
        toast.error(errMsg || 'Failed to save answer — please try again');
      }
    }
  }, [session, examId]);

  // ── Manual Submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit the exam? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await api.post(`/student/submissions/${submissionIdRef.current}/submit`);
      toast.success('Exam submitted successfully!');
      setOverlaySynced('submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading exam…" />;
  if (error) return (
    <div className="min-h-screen bg-surface-200 flex items-center justify-center p-4">
      <div className="card text-center max-w-md shadow-md">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button className="btn-secondary" onClick={() => navigate('/student')}>Back to Dashboard</button>
      </div>
    </div>
  );

  const questions = session?.questions ?? [];
  const exam = session?.exam;
  const currentQuestion = questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQ = questions.length;

  return (
    <div className="min-h-screen bg-surface-200 flex flex-col">
      {/* Overlays */}
      {overlay === 'strike' && (
        <StrikeWarning count={strikeInfo.count} max={strikeInfo.max} onDismiss={() => setOverlaySynced(null)} />
      )}
      {overlay === 'debarred' && <DebarmentOverlay />}
      {overlay === 'expired' && <TimeExpiredOverlay />}
      {overlay === 'submitted' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm">
          <div className="card max-w-sm w-full mx-4 text-center py-10 shadow-xl animate-scale-in">
            <CheckCircle size={52} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Exam Submitted!</h2>
            <p className="text-surface-500 text-sm mb-6">Your answers have been recorded. Results will be visible once graded.</p>
            <button className="btn-primary w-full" onClick={() => navigate('/student')}>Back to Dashboard</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="bg-white border-b border-surface-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div>
          <p className="font-semibold text-surface-900 text-sm">{exam?.title}</p>
          <p className="text-xs text-surface-500">{answeredCount}/{totalQ} answered</p>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg tabular-nums transition-all ${
          isDanger
            ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse'
            : isWarning
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-surface-100 text-surface-800 border border-surface-200'
        }`}>
          <Clock size={16} />
          {formatted || '--:--'}
        </div>

        {/* Strikes */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: strikeInfo.max }, (_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all ${i < strikeInfo.count ? 'bg-red-500 border-red-400' : 'bg-surface-200 border-surface-300'}`} />
            ))}
          </div>
          <span className="text-xs text-surface-500">{strikeInfo.max - strikeInfo.count} warnings left</span>
        </div>

        <button className="btn-danger btn-sm" onClick={handleSubmit} disabled={submitting || !!overlay}>
          <Send size={14} /> {submitting ? 'Submitting…' : 'Submit Exam'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question navigator sidebar */}
        <aside className="w-48 bg-white border-r border-surface-200 p-3 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 px-1">Questions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((q, i) => {
              const answered = answers[q._id] !== undefined;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentQIndex(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    i === currentQIndex
                      ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                      : answered
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-surface-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-surface-500">
              <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
              Answered
            </div>
            <div className="flex items-center gap-2 text-surface-500">
              <div className="w-3 h-3 rounded bg-surface-100 border border-surface-200" />
              Unanswered
            </div>
          </div>
        </aside>

        {/* Question area */}
        <main className="flex-1 p-8 overflow-y-auto bg-surface-200">
          {currentQuestion && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              {/* Question header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-500/30 text-sm">
                  {currentQIndex + 1}
                </span>
                <div className="flex-1 text-xs text-surface-500">
                  <span className="text-emerald-600 font-semibold">+{currentQuestion.positiveMarks} pts</span>
                  {currentQuestion.negativeMarks > 0 && (
                    <span className="text-red-500 font-semibold ml-2">-{currentQuestion.negativeMarks} pts</span>
                  )}
                </div>
                <span className="text-xs text-surface-400 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded-full">
                  {currentQIndex + 1} of {totalQ}
                </span>
              </div>

              <p className="text-lg font-medium text-surface-900 mb-6 leading-relaxed">
                {currentQuestion.text}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, displayIdx) => {
                  const originalIdx = session?.optionMaps?.[currentQuestion._id]?.[displayIdx] ?? displayIdx;
                  const isSelected = answers[currentQuestion._id] === originalIdx;

                  return (
                    <button
                      key={displayIdx}
                      className={isSelected ? 'option-btn-selected w-full text-left' : 'option-btn'}
                      onClick={() => handleSelectOption(currentQuestion._id, displayIdx)}
                      disabled={!!overlay}
                    >
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-surface-300 text-surface-500'
                      }`}>
                        {OPTION_LETTERS[displayIdx]}
                      </span>
                      <span className="flex-1 text-left">{opt}</span>
                      {isSelected && <CheckCircle size={16} className="text-brand-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setCurrentQIndex(i => Math.max(0, i - 1))}
                  disabled={currentQIndex === 0}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setCurrentQIndex(i => Math.min(totalQ - 1, i + 1))}
                  disabled={currentQIndex === totalQ - 1}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ExamSession;

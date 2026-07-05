import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, CheckCircle, XCircle,
  HelpCircle, ChevronDown, ChevronUp, Clock, Target
} from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const QuestionForm = ({ examId, initial = {}, onSave, onClose }) => {
  const [form, setForm] = useState({
    text: initial.text || '',
    options: initial.options?.length === 4 ? [...initial.options] : ['', '', '', ''],
    correctOptionIndex: initial.correctOptionIndex ?? 0,
    positiveMarks: initial.positiveMarks ?? 1,
    negativeMarks: initial.negativeMarks ?? 0,
  });
  const [loading, setLoading] = useState(false);

  const updateOption = (i) => (e) => {
    const opts = [...form.options];
    opts[i] = e.target.value;
    setForm(f => ({ ...f, options: opts }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Question text</label>
        <textarea className="input min-h-[80px] resize-none" placeholder="Enter the question…"
          value={form.text} onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))} required />
      </div>

      <div>
        <label className="label mb-2 block">Answer options <span className="text-surface-400 text-xs">(mark the correct one)</span></label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="radio" name="correct" className="accent-brand-500 w-4 h-4 flex-shrink-0"
                checked={form.correctOptionIndex === i}
                onChange={() => setForm(f => ({ ...f, correctOptionIndex: i }))} />
              <div className="flex items-center gap-2 flex-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${form.correctOptionIndex === i ? 'bg-brand-500 text-white' : 'bg-surface-600 text-surface-500'}`}>
                  {OPTION_LETTERS[i]}
                </span>
                <input className="input" placeholder={`Option ${OPTION_LETTERS[i]}`}
                  value={opt} onChange={updateOption(i)} required />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Positive marks</label>
          <input type="number" className="input" min="0" step="0.5" value={form.positiveMarks}
            onChange={(e) => setForm(f => ({ ...f, positiveMarks: Number(e.target.value) }))} required />
        </div>
        <div>
          <label className="label">Negative marks (on wrong answer)</label>
          <input type="number" className="input" min="0" step="0.25" value={form.negativeMarks}
            onChange={(e) => setForm(f => ({ ...f, negativeMarks: Number(e.target.value) }))} required />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>
          {loading ? 'Saving…' : initial._id ? 'Update Question' : 'Add Question'}
        </button>
      </div>
    </form>
  );
};

const QuestionCard = ({ question, index, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-300 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-500 text-sm font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <p className="flex-1 text-sm text-surface-900 font-medium truncate">{question.text}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-emerald-400">+{question.positiveMarks}</span>
          {question.negativeMarks > 0 && <span className="text-xs text-red-400">-{question.negativeMarks}</span>}
          <button className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-500/10 transition-colors" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit2 size={14} />
          </button>
          <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={14} className="text-surface-500" /> : <ChevronDown size={14} className="text-surface-500" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 animate-fade-in">
          {question.options.map((opt, i) => (
            <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${i === question.correctOptionIndex ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === question.correctOptionIndex ? 'bg-emerald-500 text-white' : 'bg-surface-600 text-surface-500'}`}>
                {OPTION_LETTERS[i]}
              </span>
              <span className={`text-sm ${i === question.correctOptionIndex ? 'text-emerald-400 font-medium' : 'text-surface-700'}`}>{opt}</span>
              {i === question.correctOptionIndex && <CheckCircle size={14} className="ml-auto text-emerald-400" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ExamManagePage = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchExam = () => api.get(`/admin/exams/${examId}`).then(({ data }) => setExam(data.exam)).finally(() => setLoading(false));

  useEffect(() => { fetchExam(); }, [examId]);

  const handleAddQuestion = async (form) => {
    await api.post(`/admin/exams/${examId}/questions`, form);
    toast.success('Question added!');
    fetchExam();
  };

  const handleEditQuestion = async (form) => {
    await api.put(`/admin/questions/${modal.data._id}`, form);
    toast.success('Question updated!');
    fetchExam();
  };

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/admin/questions/${qId}`);
    toast.success('Question deleted');
    fetchExam();
  };

  if (loading) return <div className="flex min-h-screen"><Sidebar /><LoadingSpinner fullScreen /></div>;
  if (!exam) return null;

  const totalMarks = exam.questions?.reduce((s, q) => s + q.positiveMarks, 0) ?? 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <Link to="/admin/courses" className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to Courses
          </Link>

          {/* Exam info */}
          <div className="card mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-surface-900">{exam.title}</h1>
                  <StatusBadge status={exam.isPublished ? 'published' : 'draft'} />
                </div>
                <p className="text-surface-500 text-sm">{exam.course?.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-surface-200">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={15} className="text-brand-500" />
                <div>
                  <p className="text-surface-500 text-xs">Duration</p>
                  <p className="text-surface-900 font-medium">{exam.duration} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target size={15} className="text-amber-400" />
                <div>
                  <p className="text-surface-500 text-xs">Pass %</p>
                  <p className="text-surface-900 font-medium">{exam.passingPercentage}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <HelpCircle size={15} className="text-violet-400" />
                <div>
                  <p className="text-surface-500 text-xs">Questions</p>
                  <p className="text-surface-900 font-medium">{exam.questions?.length ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={15} className="text-emerald-400" />
                <div>
                  <p className="text-surface-500 text-xs">Total Marks</p>
                  <p className="text-surface-900 font-medium">{totalMarks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900">Questions</h2>
            <button className="btn-primary btn-sm" onClick={() => setModal({ type: 'add' })}>
              <Plus size={15} /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {!exam.questions?.length && (
              <div className="card text-center py-12">
                <HelpCircle size={36} className="text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No questions yet. Add some MCQs to this exam.</p>
              </div>
            )}
            {exam.questions?.map((q, i) => (
              <QuestionCard key={q._id} question={q} index={i}
                onEdit={() => setModal({ type: 'edit', data: q })}
                onDelete={() => handleDeleteQuestion(q._id)} />
            ))}
          </div>
        </div>
      </main>

      <Modal isOpen={modal?.type === 'add'} onClose={() => setModal(null)} title="Add Question" size="md">
        <QuestionForm examId={examId} onSave={handleAddQuestion} onClose={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal?.type === 'edit'} onClose={() => setModal(null)} title="Edit Question" size="md">
        <QuestionForm examId={examId} initial={modal?.data} onSave={handleEditQuestion} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
};

export default ExamManagePage;

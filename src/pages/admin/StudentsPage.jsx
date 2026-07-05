import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, Edit2, Trash2, Plus, Eye, EyeOff,
  UserPlus, Copy, CheckCircle, X, AlertCircle, BookOpen, FileText, Calendar
} from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

// ── Confirm Delete Modal ───────────────────────────────────────────
const ConfirmDeleteModal = ({ student, onConfirm, onCancel }) => (
  <div className="modal-backdrop" onClick={onCancel}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900">Delete Student</h3>
            <p className="text-sm text-surface-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-surface-700 mb-6 text-sm">
          Are you sure you want to delete <strong>{student.name}</strong>? This will also remove all their submissions and enrollment records.
        </p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete Student</button>
        </div>
      </div>
    </div>
  </div>
);

// ── Edit Student Modal ─────────────────────────────────────────────
const EditStudentModal = ({ student, onSave, onClose }) => {
  const [form, setForm] = useState({ name: student.name, email: student.email, password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      const { data } = await api.put(`/admin/students/${student._id}`, payload);
      toast.success('Student updated successfully');
      onSave(data.student);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <Edit2 size={18} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Edit Student</h3>
                <p className="text-xs text-surface-500">Update name, email or password</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost btn-sm p-1.5 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="edit-name">Full Name</label>
              <input id="edit-name" type="text" className="input"
                value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="edit-email">Email Address</label>
              <input id="edit-email" type="email" className="input"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="edit-pwd">New Password <span className="text-surface-400 font-normal">(leave blank to keep current)</span></label>
              <div className="relative">
                <input id="edit-pwd" type={showPwd ? 'text' : 'password'} className="input pr-11"
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Create Admin Modal ─────────────────────────────────────────────
const CreateAdminModal = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null); // { name, email, generatedPassword }
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const { data } = await api.post('/admin/admins', form);
      setCreated({ ...data.admin, generatedPassword: data.generatedPassword });
      toast.success('Admin account created!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (created) {
      navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.generatedPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <UserPlus size={18} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Create Admin Account</h3>
                <p className="text-xs text-surface-500">Grant admin access to a new user</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost btn-sm p-1.5 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {!created ? (
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="admin-name">Full Name</label>
                  <input id="admin-name" type="text" className="input" placeholder="Admin name"
                    value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="admin-email">Email Address</label>
                  <input id="admin-email" type="email" className="input" placeholder="admin@example.com"
                    value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="admin-pwd">Password <span className="text-surface-400 font-normal">(optional — auto-generated if blank)</span></label>
                  <div className="relative">
                    <input id="admin-pwd" type={showPwd ? 'text' : 'password'} className="input pr-11"
                      placeholder="Leave blank to auto-generate" value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 transition-colors">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    <><UserPlus size={16} /> Create Admin</>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Success state — show credentials */
            <div>
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm mb-5">
                <CheckCircle size={16} className="flex-shrink-0" />
                Admin account created for <strong>{created.name}</strong>
              </div>
              <p className="text-sm text-surface-600 mb-3 font-medium">Share these credentials securely:</p>
              <div className="bg-surface-100 border border-surface-200 rounded-xl p-4 font-mono text-sm space-y-1.5 mb-4">
                <div><span className="text-surface-500">Email: </span><span className="text-surface-900 font-semibold">{created.email}</span></div>
                <div><span className="text-surface-500">Password: </span><span className="text-surface-900 font-semibold">{created.generatedPassword}</span></div>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={handleCopy}>
                  {copied ? <><CheckCircle size={15} className="text-emerald-500" /> Copied!</> : <><Copy size={15} /> Copy credentials</>}
                </button>
                <button className="btn-primary" onClick={onClose}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main StudentsPage ──────────────────────────────────────────────
const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data.students);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/students/${deleteTarget._id}`);
      toast.success('Student deleted');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleEditSave = (updated) => {
    setStudents(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
    setEditTarget(null);
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">
                Student <span className="text-gradient">Management</span>
              </h1>
              <p className="text-surface-500 mt-1">Manage student accounts and credentials</p>
            </div>
            <button
              className="btn-primary flex-shrink-0"
              onClick={() => setShowCreateAdmin(true)}
            >
              <UserPlus size={17} />
              Create Admin
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
                <Users size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{students.length}</p>
                <p className="text-sm text-surface-500">Total Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BookOpen size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {students.reduce((a, s) => a + s.enrolledCourseCount, 0)}
                </p>
                <p className="text-sm text-surface-500">Total Enrollments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                <FileText size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {students.reduce((a, s) => a + s.submissionCount, 0)}
                </p>
                <p className="text-sm text-surface-500">Total Submissions</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="search"
              className="input pl-10 max-w-sm"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          {loading ? (
            <LoadingSpinner text="Loading students…" />
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Users size={40} className="text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">{search ? 'No students match your search.' : 'No students registered yet.'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Courses</th>
                    <th>Submissions</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {s.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-surface-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-surface-600">{s.email}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                          <BookOpen size={11} /> {s.enrolledCourseCount}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                          <FileText size={11} /> {s.submissionCount}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-surface-500 text-xs">
                          <Calendar size={12} />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-ghost btn-xs text-brand-600 hover:bg-brand-50"
                            onClick={() => setEditTarget(s)}
                            title="Edit student"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-ghost btn-xs text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteTarget(s)}
                            title="Delete student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {editTarget && (
        <EditStudentModal
          student={editTarget}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          student={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showCreateAdmin && (
        <CreateAdminModal onClose={() => setShowCreateAdmin(false)} />
      )}
    </div>
  );
};

export default StudentsPage;

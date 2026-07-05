import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Activity, ClipboardList,
  LogOut, GraduationCap, ChevronRight, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/courses', label: 'Courses & Exams', icon: BookOpen },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/monitor', label: 'Live Monitor', icon: Activity },
  { to: '/admin/submissions', label: 'Submissions', icon: ClipboardList },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-surface-200 flex flex-col flex-shrink-0 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-200">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-sm shadow-brand-500/30">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-surface-900 leading-none tracking-tight">ExamSpace</p>
          <p className="text-xs text-surface-500 mt-0.5 font-medium">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {adminLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={isActive(link) ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <link.icon size={17} />
            <span>{link.label}</span>
            {isActive(link) && <ChevronRight size={13} className="ml-auto opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-surface-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-surface-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{user?.name}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 mt-0.5"
        >
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

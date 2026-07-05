import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-surface-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
      <Link to="/student" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-sm shadow-brand-500/30 group-hover:shadow-md group-hover:shadow-brand-500/30 transition-all duration-200">
          <GraduationCap size={17} className="text-white" />
        </div>
        <span className="font-bold text-surface-900 tracking-tight">ExamSpace</span>
        <span className="text-xs text-surface-500 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded-full font-medium">Student</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          to="/student"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors text-sm font-medium"
        >
          <LayoutDashboard size={15} />
          Dashboard
        </Link>
        <Link
          to="/student/submissions"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors text-sm font-medium"
        >
          <ClipboardList size={15} />
          My Submissions
        </Link>
        <div className="w-px h-5 bg-surface-200 mx-1" />
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <span className="text-sm text-surface-700 font-medium">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

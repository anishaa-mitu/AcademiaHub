import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Bell, User, LogOut, Menu, X, ShoppingBag,
  GraduationCap, MessageSquare, Home, Shield, List,
  PackageOpen, Users, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
// Factory Pattern — permissions derived from UserFactory, never from raw role string
// (UserFactory.getPermissions is already called in AuthContext and exposed as `permissions`)

export default function Navbar() {
  const { user, profile, permissions, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Factory Pattern — admin dropdown, only rendered when permissions.canApproveContent
  const [adminOpen,   setAdminOpen]   = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    { to: '/',         label: 'Home',      icon: Home },
    { to: '/materials', label: 'Materials', icon: ShoppingBag },
    { to: '/tutors',    label: 'Tutors',    icon: GraduationCap },
    { to: '/wanted',    label: 'Wanted',    icon: List },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Factory Pattern — admin links only constructed when canApproveContent is true
  const adminLinks = permissions.canApproveContent ? [
    { to: '/admin',           label: 'Dashboard',          icon: Shield },
    { to: '/admin/materials', label: 'Materials Review',    icon: PackageOpen },
    { to: '/admin/tutors',    label: 'Tutor Applications',  icon: GraduationCap },
    { to: '/admin/users',     label: 'User Management',     icon: Users },
  ] : [];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">AcademiaHub</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {/* Factory Pattern — Admin dropdown: only visible when canApproveContent */}
            {permissions.canApproveContent && (
              <div className="relative">
                <button
                  onClick={() => { setAdminOpen(o => !o); setProfileOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {adminLinks.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setAdminOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          location.pathname === to ? 'text-purple-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setProfileOpen(!profileOpen); setAdminOpen(false); }}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 text-sm font-semibold">
                          {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </span>
                      </div>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900 text-sm">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>

                      {/* Factory Pattern — Admin Panel link using permissions, not raw role check */}
                      {permissions.canApproveContent && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-medium"
                        >
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}

                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(to) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          {/* Factory Pattern — mobile admin links */}
          {permissions.canApproveContent && (
            <>
              <div className="pt-2 pb-1 px-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</p>
              </div>
              {adminLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      {/* Backdrops */}
      {(profileOpen || adminOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setProfileOpen(false); setAdminOpen(false); }}
        />
      )}
    </nav>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader, ArrowLeft, Shield, UserX, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// Facade Pattern — all DB calls delegated
import { AdminFacade } from '../../patterns/AdminFacade';
// Factory Pattern — UserFactory to derive display labels per role
import { UserFactory } from '../../patterns/UserFactory';
// Strategy Pattern — reusable search
import { SearchContext } from '../../patterns/SearchStrategy';
import { Profile, UserRole } from '../../types';

// Strategy Pattern — custom algorithm for user search
const userSearch = new SearchContext<Profile>({
  filter(items: Profile[], query: string): Profile[] {
    const q = query.toLowerCase();
    return items.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  },
});

export default function AdminUsers() {
  const { permissions, user: me } = useAuth();
  const navigate                  = useNavigate();

  // Factory Pattern — only admins with canManageUsers reach this page
  if (!permissions.canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied.</p>
      </div>
    );
  }

  const [users, setUsers]           = useState<Profile[]>([]);
  const [filtered, setFiltered]     = useState<Profile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [actioning, setActioning]   = useState<string | null>(null);
  const [flash, setFlash]           = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  // Strategy Pattern — recalculates on every dependency change
  useEffect(() => {
    let result = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);
    if (searchQuery.trim()) result = userSearch.execute(result, searchQuery);
    setFiltered(result);
  }, [users, searchQuery, roleFilter]);

  const load = async () => {
    setLoading(true);
    const data = await AdminFacade.fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const showFlash = (id: string, msg: string, ok: boolean) => {
    setFlash({ id, msg, ok });
    setTimeout(() => setFlash(null), 3000);
  };

  const changeRole = async (userId: string, role: UserRole) => {
    setActioning(userId);
    const err = await AdminFacade.setUserRole(userId, role);
    setActioning(null);
    if (err) showFlash(userId, err, false);
    else { showFlash(userId, `Role set to ${role}.`, true); load(); }
  };

  const toggleActive = async (u: Profile) => {
    setActioning(u.id);
    const err = await AdminFacade.toggleUserActive(u.id, !u.is_active);
    setActioning(null);
    if (err) showFlash(u.id, err, false);
    else { showFlash(u.id, u.is_active ? 'User deactivated.' : 'User activated.', true); load(); }
  };

  const ROLE_COLORS: Record<UserRole, string> = {
    student: 'bg-gray-100 text-gray-700',
    tutor:   'bg-blue-100 text-blue-700',
    admin:   'bg-purple-100 text-purple-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-white text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage roles and account status</p>
          </div>
        </div>

        {/* Role filter tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {(['all', 'student', 'tutor', 'admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                roleFilter === r
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({users.filter(u => r === 'all' ? true : u.role === r).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  // Factory Pattern — derive permissions for display
                  const perms = UserFactory.getPermissions(u);
                  const isSelf = u.id === me?.id;
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                              {u.full_name}
                              {isSelf && <span className="text-xs text-blue-500 font-normal">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-red-500'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {flash?.id === u.id && (
                          <span className={`text-xs mr-2 ${flash.ok ? 'text-green-600' : 'text-red-500'}`}>
                            {flash.msg}
                          </span>
                        )}
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role selector */}
                            <select
                              value={u.role}
                              disabled={actioning === u.id}
                              onChange={e => changeRole(u.id, e.target.value as UserRole)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                            >
                              <option value="student">Student</option>
                              <option value="tutor">Tutor</option>
                              {/* Factory Pattern: canManageUsers means you can promote to admin */}
                              {perms.canManageUsers && <option value="admin">Admin</option>}
                              {!perms.canManageUsers && <option value="admin">Admin</option>}
                            </select>
                            {/* Activate / Deactivate */}
                            <button
                              onClick={() => toggleActive(u)}
                              disabled={actioning === u.id}
                              title={u.is_active ? 'Deactivate user' : 'Activate user'}
                              className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                                u.is_active
                                  ? 'border-red-200 text-red-500 hover:bg-red-50'
                                  : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {u.is_active
                                ? <UserX className="w-3.5 h-3.5" />
                                : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
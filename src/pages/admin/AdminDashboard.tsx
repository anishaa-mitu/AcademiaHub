import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, PackageOpen, GraduationCap, Users,
  Clock, CheckCircle, XCircle, Loader,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// Facade Pattern — all counts come from AdminFacade
import { AdminFacade } from '../../patterns/AdminFacade';

interface Stats {
  pendingMaterials: number;
  approvedMaterials: number;
  rejectedMaterials: number;
  pendingTutors: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { permissions, profile } = useAuth();

  // Factory Pattern — guard the whole panel
  if (!permissions.canApproveContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied. Admins only.</p>
      </div>
    );
  }

  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Facade Pattern — parallel fetches, no raw supabase here
      const [materials, tutors, users] = await Promise.all([
        AdminFacade.fetchAllMaterials(),
        AdminFacade.fetchTutorRequests(),
        AdminFacade.fetchAllUsers(),
      ]);
      setStats({
        pendingMaterials:  materials.filter(m => m.status === 'pending').length,
        approvedMaterials: materials.filter(m => m.status === 'approved').length,
        rejectedMaterials: materials.filter(m => m.status === 'rejected').length,
        pendingTutors:     tutors.filter(t => t.status === 'pending').length,
        totalUsers:        users.length,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    {
      to:      '/admin/materials',
      icon:    PackageOpen,
      label:   'Materials Review',
      desc:    'Approve or reject submitted materials',
      color:   'text-blue-600 bg-blue-50',
      badge:   stats?.pendingMaterials,
    },
    {
      to:      '/admin/tutors',
      icon:    GraduationCap,
      label:   'Tutor Applications',
      desc:    'Approve tutors and manage their profiles',
      color:   'text-indigo-600 bg-indigo-50',
      badge:   stats?.pendingTutors,
    },
    {
      to:      '/admin/users',
      icon:    Users,
      label:   'User Management',
      desc:    'Manage roles and account status',
      color:   'text-violet-600 bg-violet-50',
      badge:   null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Welcome, {profile?.full_name}</p>
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Clock,        label: 'Pending Materials',  value: stats?.pendingMaterials,  color: 'text-amber-600' },
                { icon: CheckCircle,  label: 'Approved Materials', value: stats?.approvedMaterials, color: 'text-green-600' },
                { icon: XCircle,      label: 'Rejected Materials', value: stats?.rejectedMaterials, color: 'text-red-500' },
                { icon: Users,        label: 'Total Users',        value: stats?.totalUsers,        color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
                  <p className="text-2xl font-bold text-gray-900">{s.value ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Nav cards */}
            <div className="grid md:grid-cols-3 gap-5">
              {cards.map(card => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow group relative"
                >
                  {card.badge !== null && card.badge !== undefined && card.badge > 0 && (
                    <span className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {card.badge}
                    </span>
                  )}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{card.label}</h3>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
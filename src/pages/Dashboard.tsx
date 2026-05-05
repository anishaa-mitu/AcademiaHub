import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, DollarSign, Users, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();

  if (profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/admin/materials" className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow block">
              <AlertCircle className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg mb-1">Pending Materials</h3>
              <p className="text-gray-600 text-sm">Review and approve user submissions</p>
            </Link>
            <Link to="/admin/tutors" className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow block">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-lg mb-1">Tutor Requests</h3>
              <p className="text-gray-600 text-sm">Approve tutors and manage roles</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome, {profile?.full_name}!</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Whole card is clickable */}
          <Link to="/dashboard/materials" className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow block">
            <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">My Materials</h3>
            <p className="text-gray-600 text-sm mb-4">Manage your uploaded materials and track sales</p>
            <span className="text-blue-600 font-medium text-sm">View →</span>
          </Link>
          <Link to="/dashboard/earnings" className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow block">
            <DollarSign className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold mb-2">Earnings</h3>
            <p className="text-gray-600 text-sm mb-4">Track your sales and earnings</p>
            <span className="text-blue-600 font-medium text-sm">View →</span>
          </Link>
        </div>

        {/* Tutor card — goes to Profile page to edit tutor info */}
        {profile?.role === 'tutor' && (
          <Link to="/profile" className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow block">
            <Users className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-2">My Tutor Profile</h3>
            <p className="text-gray-600 text-sm mb-4">Manage your tutoring sessions and expertise</p>
            <span className="text-blue-600 font-medium text-sm">Manage →</span>
          </Link>
        )}
      </div>
    </div>
  );
}
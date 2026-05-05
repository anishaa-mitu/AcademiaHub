import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import UploadMaterial from './pages/UploadMaterial';
import Tutors from './pages/Tutors';
import Wanted from './pages/Wanted';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import ManageMaterials from './pages/ManageMaterials';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMaterials from './pages/admin/AdminMaterials';
import AdminTutors from './pages/admin/AdminTutors';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/materials" element={<ProtectedRoute><ManageMaterials /></ProtectedRoute>} />
            <Route path="/dashboard/earnings" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/materials/upload" element={<ProtectedRoute><UploadMaterial /></ProtectedRoute>} />
            <Route path="/materials/:id" element={<MaterialDetail />} />
            <Route path="/tutors" element={<ProtectedRoute><Tutors /></ProtectedRoute>} />
            <Route path="/wanted" element={<ProtectedRoute><Wanted /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/materials" element={<ProtectedRoute><AdminMaterials /></ProtectedRoute>} />
            <Route path="/admin/tutors" element={<ProtectedRoute><AdminTutors /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
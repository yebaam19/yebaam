import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import HomePage from './features/home/HomePage';
import SchoolListPage from './features/schools/SchoolListPage';
import SchoolProfilePage from './features/schools/SchoolProfilePage';
import ProgramPage from './features/programs/ProgramPage';
import ProgramsPage from './features/programs/ProgramsPage';
import CampaignsPage from './features/campaigns/CampaignsPage';
import EventsPage from './features/events/EventsPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import UnauthorizedPage from './features/auth/UnauthorizedPage';
import AdminLayout from './features/admin/AdminLayout';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ProtectedRoute from './components/ProtectedRoute';

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f3fcf3]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"              element={<HomePage />}          />
          <Route path="/schools"       element={<SchoolListPage />}    />
          <Route path="/schools/:id"   element={<SchoolProfilePage />} />
          <Route path="/programs"      element={<ProgramsPage />}      />
          <Route path="/programs/:id"  element={<ProgramPage />}       />
          <Route path="/campaigns"     element={<CampaignsPage />}     />
          <Route path="/events"        element={<EventsPage />}        />
          <Route path="/login"         element={<LoginPage />}         />
          <Route path="/register"      element={<RegisterPage />}      />
          <Route path="/unauthorized"  element={<UnauthorizedPage />}  />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Admin routes — full-screen sidebar layout, no public Navbar/Footer */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PLATFORM_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
          {/* All public routes — shared Navbar + Footer */}
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

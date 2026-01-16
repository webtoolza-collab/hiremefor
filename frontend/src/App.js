import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Pages
import Home from './pages/Home';
import WorkerProfile from './pages/WorkerProfile';

// Worker Pages
import WorkerLogin from './pages/worker/Login';
import WorkerRegister from './pages/worker/Register';
import WorkerDashboard from './pages/worker/Dashboard';
import WorkerEditProfile from './pages/worker/EditProfile';
import WorkerRatings from './pages/worker/Ratings';
import WorkerForgotPin from './pages/worker/ForgotPin';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminWorkers from './pages/admin/Workers';
import AdminSkills from './pages/admin/Skills';
import AdminAreas from './pages/admin/Areas';
import AdminRatings from './pages/admin/Ratings';

// Components
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/workers/:id" element={<WorkerProfile />} />

        {/* Worker Routes */}
        <Route path="/worker/login" element={<WorkerLogin />} />
        <Route path="/worker/register" element={<WorkerRegister />} />
        <Route path="/worker/forgot-pin" element={<WorkerForgotPin />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/profile/edit" element={<WorkerEditProfile />} />
        <Route path="/worker/ratings" element={<WorkerRatings />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/workers" element={<AdminWorkers />} />
        <Route path="/admin/skills" element={<AdminSkills />} />
        <Route path="/admin/areas" element={<AdminAreas />} />
        <Route path="/admin/ratings" element={<AdminRatings />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

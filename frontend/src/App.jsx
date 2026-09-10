import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';

// page layouts
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import EcoSathiChat from './components/chatbot/EcoSathiChat';

// Page Components
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CityDetail from './pages/CityDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Complaints from './pages/Complaints';
import AuthorityNotices from './pages/AuthorityNotices';
import Leaderboard from './pages/Leaderboard';
import Compare from './pages/Compare';
import About from './pages/About';
import ReportDetail from './pages/ReportDetail';

/**
 * App Component
 * 
 * Root component that sets up:
 * - React Router for page navigation
 * - Context providers for global state (Auth, City)
 * - Navbar, Footer, and floating EcoSathi AI Chatbot Assistant
 * - All page routes
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <CityProvider>
          <div className="flex flex-col min-h-screen bg-gray-50 relative">
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-grow">
              <Routes>
                {/* Home */}
                <Route path="/" element={<Home />} />

                {/* Auth Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Main Feature Pages */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/city/:name" element={<CityDetail />} />
                <Route path="/complaints" element={<Complaints />} />
                <Route path="/complaints/:id" element={<ReportDetail />} />
                <Route path="/notices" element={<AuthorityNotices />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/about" element={<About />} />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* Floating EcoSathi AI Assistant Widget */}
            <EcoSathiChat />

            {/* Footer */}
            <Footer />
          </div>
        </CityProvider>
      </AuthProvider>
    </Router>
  );
}

/**
 * 404 Not Found Page
 */
function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Page Not Found</p>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="px-8 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors inline-block"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

export default App;
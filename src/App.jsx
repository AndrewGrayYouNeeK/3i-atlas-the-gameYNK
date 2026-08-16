import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './components/navigation/BottomNav';
import TabNavigator from './components/navigation/TabNavigator';
import SiteFooter from './components/navigation/SiteFooter';
import useSystemTheme from './components/navigation/useSystemTheme';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import MainMenu from './pages/MainMenu.jsx';
import Game from './pages/Game.jsx';
import Store from './pages/Store.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

const PersistentTabsLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      <SiteFooter />
      <AnimatePresence mode="wait">
        {currentPath === '/' && (
          <motion.div key="tab-home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <MainMenu onStartGame={(levelId, difficulty) => navigate(`/game?level=${levelId}&difficulty=${difficulty || 'medium'}`)} />
          </motion.div>
        )}
        {currentPath === '/store' && (
          <motion.div key="tab-store" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <Store onBack={() => navigate('/')} />
          </motion.div>
        )}
        {currentPath === '/leaderboard' && (
          <motion.div key="tab-leaderboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <Leaderboard onBack={() => navigate('/')} />
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </>
  );
};

const GameRoute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const levelId = Number(searchParams.get('level') || 0);
  const difficulty = searchParams.get('difficulty') || 'medium';
  const skin = searchParams.get('skin') || 'default';
  const mode = searchParams.get('mode') || 'mission';

  return (
    <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
      <Game levelId={levelId} difficulty={difficulty} skin={skin} mode={mode} onMainMenu={() => navigate('/')} />
    </motion.div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/" element={<PersistentTabsLayout />} />
      <Route path="/store" element={<PersistentTabsLayout />} />
      <Route path="/leaderboard" element={<PersistentTabsLayout />} />
      <Route path="/game" element={<GameRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-violet-800 border-t-violet-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AppRoutes />;
};

function App() {
  useSystemTheme();
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <TabNavigator />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
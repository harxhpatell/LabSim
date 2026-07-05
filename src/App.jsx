import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SlumpTest from './experiments/SlumpTest';
import BeamTest from './experiments/BeamTest';
import SieveAnalysis from './experiments/SieveAnalysis';
import CBR from './experiments/CBR';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/slump" element={<SlumpTest />} />
          <Route path="/beam" element={<BeamTest />} />
          <Route path="/sieve" element={<SieveAnalysis />} />
          <Route path="/cbr" element={<CBR />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Footer />
      </HashRouter>
    </AuthProvider>
  );
}

import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import logoImg from './logo.png';
import OrderDetail from './pages/OrderDetail.jsx';
import BuildingGrid from './pages/BuildingGrid.jsx';
import UserManagementModal from './components/UserManagementModal.jsx';
import api from './api.js';

function App() {
  const [token, setToken] = useState(localStorage.getItem('dio_grace_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsersModal, setShowUsersModal] = useState(false);
  // Simple state router
  const [view, setView] = useState('orders'); // 'orders' | 'order-detail' | 'building-grid'
  const [viewParams, setViewParams] = useState({});

  useEffect(() => {
    if (token) {
      localStorage.setItem('dio_grace_token', token);
      // Fetch current user details
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setLoading(false);
        })
        .catch(err => {
          console.error('Session expired', err);
          handleLogout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setView('orders');
  };

  const handleLogout = () => {
    localStorage.removeItem('dio_grace_token');
    setToken(null);
    setUser(null);
    setView('orders');
    setShowUsersModal(false);
  };

  const navigate = (newView, params = {}) => {
    setView(newView);
    setViewParams(params);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', marginBottom: '1rem' }}>🏗️ Loading Dio Graciaa...</h2>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #3b82f6',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('orders')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="Dio Grace Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
        </div>

        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="navbar-username">{user.name}</div>
            <span className="navbar-role">
              {user.role === 'ROLE_A' && '⚙️ Admin'}
              {user.role === 'ROLE_B' && '🏗️ Feeder'}
              {user.role === 'ROLE_C' && '👁️ Executive'}
              {user.role === 'ROLE_D' && '🔍 Client'}
              {user.role !== 'ROLE_A' && user.role !== 'ROLE_B' && user.role !== 'ROLE_C' && user.role !== 'ROLE_D' && '👁️ Viewer'}
            </span>
          </div>

          {/* User Management Button for Setup Operator (ROLE_A) */}
          {user.role === 'ROLE_A' && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowUsersModal(true)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              👥 User Management
            </button>
          )}

          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main Pages router */}
      <div className="main-wrapper animate-fade-in-up" key={`${view}-${viewParams.orderId || ''}-${viewParams.buildingId || ''}`}>
        <main className="main-content">
          {view === 'orders' && (
            <Orders user={user} navigate={navigate} />
          )}
          {view === 'order-detail' && (
            <OrderDetail user={user} orderId={viewParams.orderId} navigate={navigate} />
          )}
          {view === 'building-grid' && (
            <BuildingGrid
              user={user}
              orderId={viewParams.orderId}
              buildingId={viewParams.buildingId}
              navigate={navigate}
            />
          )}
        </main>
      </div>

      {/* User Management Modal for Setup user */}
      {showUsersModal && (
        <UserManagementModal
          currentUser={user}
          onClose={() => setShowUsersModal(false)}
        />
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { FaHome, FaReceipt, FaTruck, FaUser } from 'react-icons/fa';
import './App.css';
import Dashboard from './pages/Dashboard';
import AdminsPage from './pages/AdminsPage';
import CategoriesPage from './pages/CategoriesPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import AdminDeliveriesPage from './pages/AdminDeliveriesPage';
import UserDashboard from './pages/UserDashboard';
import LandingPage from './pages/LandingPage';
import UserDeliveryPage from './pages/UserDeliveryPage';
import UserOrdersPage from './pages/UserOrdersPage';
import UserNotificationsPage from './pages/UserNotificationsPage';
import UserSupportPage from './pages/UserSupportPage';
import UserProfilePage from './pages/UserProfilePage';
import UserOffersPage from './pages/UserOffersPage';
import DeveloperAdminApplicationsPage from './pages/DeveloperAdminApplicationsPage';
import DeveloperLoginPage from './pages/DeveloperLoginPage';
import { authService, developerAuthService, userService } from './services/api';

const getDashboardPath = (role) => (role === 'admin' ? '/admin/dashboard' : '/user/dashboard');

function ProtectedRoute({ authUser }) {
  const location = useLocation();
  if (!authUser) {
    const next = encodeURIComponent(location.pathname || '/');
    if ((location.pathname || '').startsWith('/admin/developer')) {
      return <Navigate to={`/developer/login?next=${next}`} replace />;
    }
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return <Outlet />;
}

function RoleRoute({ authUser, allowedRole, children }) {
  if (!authUser) {
    return <Navigate to="/auth" replace />;
  }
  if (authUser.role !== allowedRole) {
    return <Navigate to={getDashboardPath(authUser.role)} replace />;
  }
  return children;
}

function AuthEntry({ authUser, onLogin, onSignup }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const next = params.get('next') || '';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '';

  if (authUser) {
    return <Navigate to={safeNext || getDashboardPath(authUser.role)} replace />;
  }

  return (
    <LandingPage
      onLogin={onLogin}
      onSignup={onSignup}
      forceAuthModal
      forceAuthTab="login"
      closeAuthNavigatesTo="/"
      disableAutoAuthPopup
    />
  );
}

function MainLayout({ authUser, onLogout, children }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 768px)').matches);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => {
      const next = media.matches;
      setIsMobile(next);
      if (!next) setSidebarOpen(true);
      if (next) setSidebarOpen(false);
    };
    update();

    try {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    } catch (error) {
      media.addListener(update);
      return () => media.removeListener(update);
    }
  }, []);

  useEffect(() => {
    if (authUser?.role !== 'user' || !authUser?.id) {
      setUnreadAlertCount(0);
      return undefined;
    }

    let cancelled = false;
    const syncUnreadAlerts = async () => {
      if (document.hidden || location.pathname === '/user/notifications') return;
      try {
        const response = await userService.getNotifications(authUser.id, {
          unread_only: true,
          limit: 1,
        });
        if (cancelled) return;
        setUnreadAlertCount(Number(response?.data?.unread_count || 0));
      } catch (_error) {
        if (!cancelled) setUnreadAlertCount(0);
      }
    };

    syncUnreadAlerts();
    const intervalId = window.setInterval(syncUnreadAlerts, 300000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [authUser?.id, authUser?.role, location.pathname]);

  const navItems = useMemo(() => {
    if (authUser?.role === 'admin') {
      const base = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: 'DB' },
        { to: '/admin/deliveries', label: 'Deliveries', icon: 'DL' },
        { to: '/admins', label: 'Admins', icon: 'AD' },
        { to: '/categories', label: 'Categories', icon: 'CT' },
        { to: '/subscriptions', label: 'Subscriptions', icon: 'SB' },
        { to: '/customers', label: 'Customers', icon: 'CU' },
        { to: '/products', label: 'Products', icon: 'PD' },
      ];
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (authUser?.admin_role === 'super_admin' && isLocal) {
        base.push({ to: '/admin/developer', label: 'Developer', icon: 'DV' });
      }
      return base;
    }

    return [
      { to: '/user/dashboard', label: 'Dashboard', icon: 'DB' },
      { to: '/user/delivery', label: 'Delivery', icon: 'DL' },
      { to: '/user/orders', label: 'Orders', icon: 'OR' },
      { to: '/user/notifications', label: 'Alerts', icon: 'NT', hasUnread: unreadAlertCount > 0 },
      { to: '/user/support', label: 'Support', icon: 'SP' },
      { to: '/user/profile', label: 'Profile', icon: 'PR' },
      { to: '/user/offers', label: 'Offers', icon: 'OF' },
    ];
  }, [authUser, unreadAlertCount]);

  const bottomNavItems = useMemo(() => {
    if (authUser?.role !== 'user') return [];
    return [
      { to: '/user/dashboard', label: 'Home', icon: <FaHome /> },
      { to: '/user/delivery', label: 'Delivery', icon: <FaTruck /> },
      { to: '/user/orders', label: 'Orders', icon: <FaReceipt /> },
      { to: '/user/profile', label: 'Profile', icon: <FaUser /> },
    ];
  }, [authUser?.role]);

  return (
    <div className="app-container">
      {isMobile && (
        <header className="mobile-appbar" role="banner">
          <button
            type="button"
            className="mobile-appbar-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            title="Menu"
          >
            ☰
          </button>
          <div className="mobile-appbar-title">
            <svg className="mobile-appbar-logo" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.2c-2.1 2.4-6.7 6.9-6.7 11.1 0 4.3 3.5 7.6 7.7 7.6 4.3 0 7.7-3.4 7.7-7.6 0-4.2-4.6-8.7-6.7-11.1-.4-.5-1.2-.5-1.6 0z"
                fill="rgba(255,255,255,0.92)"
              />
              <path
                d="M7.2 14.2c1.2 1.2 3 1.8 4.7 1.8 1.6 0 3.4-.6 4.6-1.8"
                fill="none"
                stroke="rgba(15, 118, 110, 0.95)"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            MilkMan
          </div>
          <div className="mobile-appbar-right" />
        </header>
      )}

      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          role="button"
          tabIndex={0}
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setSidebarOpen(false);
            }
          }}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>MilkMan</h2>
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            III
          </button>
        </div>

        <div className="sidebar-user">
          <div>{authUser?.first_name} {authUser?.last_name}</div>
          <small>{authUser?.role === 'admin' ? 'Admin' : 'User'}</small>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="nav-item">
              <span className="icon">
                {item.icon}
                {item.hasUnread && <span className="nav-alert-dot" aria-hidden="true" />}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <button type="button" className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">{children}</main>

      {isMobile && bottomNavItems.length > 0 && (
        <nav className="mobile-bottom-nav" aria-label="Bottom navigation">
          {bottomNavItems.map((item) => {
            const active = (location.pathname || '').startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className={`mobile-nav-item ${active ? 'active' : ''}`}>
                <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshAuthUser = async () => {
    const response = await authService.me();
    setAuthUser(response.data.user || null);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const isLocal =
        window.location.hostname === 'localhost'
        || window.location.hostname === '127.0.0.1';

      try {
        // Security: on localhost/dev, always start from a fresh logged-out state.
        // This prevents "last user still logged in" when you reopen the site on a shared laptop.
        if (isLocal) {
          const did = window.sessionStorage.getItem('mm_autologout_on_load') === '1';
          if (!did) {
            window.sessionStorage.setItem('mm_autologout_on_load', '1');
            try { await authService.logout(); } catch (error) { /* ignore */ }
            setAuthUser(null);

            const path = window.location.pathname || '/';
            if (path.startsWith('/user/') || (path.startsWith('/admin/') && !path.startsWith('/admin/developer'))) {
              window.history.replaceState(null, '', '/');
            }
          }
        }

        await refreshAuthUser();
      } catch (error) {
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const handleLogin = async (payload) => {
    const response = await authService.login(payload);
    setAuthUser(response.data.user);
  };

  const handleDeveloperLogin = async (payload) => {
    const response = await developerAuthService.login(payload);
    setAuthUser(response.data.user);
  };

  const handleSignup = async (payload) => {
    const response = await authService.signup(payload);
    if (response.data.user) {
      setAuthUser(response.data.user);
    }
    return response;
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore API errors during logout and still clear client auth state.
    } finally {
      setAuthUser(null);
    }
  };

  if (authLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            authUser
              ? <Navigate to={getDashboardPath(authUser.role)} replace />
              : <LandingPage onLogin={handleLogin} onSignup={handleSignup} />
          }
        />

        <Route
          path="/auth"
          element={
            <AuthEntry authUser={authUser} onLogin={handleLogin} onSignup={handleSignup} />
          }
        />

        <Route
          path="/developer/login"
          element={
            authUser
              ? <Navigate to={getDashboardPath(authUser.role)} replace />
              : <DeveloperLoginPage onDeveloperLogin={handleDeveloperLogin} />
          }
        />

        <Route element={<ProtectedRoute authUser={authUser} />}>
          <Route
            path="/admin/dashboard"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <Dashboard authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/admin/developer"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <DeveloperAdminApplicationsPage authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/admin/deliveries"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <AdminDeliveriesPage />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/admins"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <AdminsPage />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/categories"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <CategoriesPage />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/subscriptions"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <SubscriptionsPage />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/customers"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <CustomersPage />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/products"
            element={(
              <RoleRoute authUser={authUser} allowedRole="admin">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <ProductsPage />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/dashboard"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserDashboard authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/delivery"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserDeliveryPage authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/orders"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserOrdersPage authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/reorder"
            element={<Navigate to="/user/orders" replace />}
          />
          <Route
            path="/user/notifications"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserNotificationsPage authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/support"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserSupportPage authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/profile"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserProfilePage authUser={authUser} onAuthUserUpdate={setAuthUser} onAuthRefresh={refreshAuthUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
          <Route
            path="/user/offers"
            element={(
              <RoleRoute authUser={authUser} allowedRole="user">
                <MainLayout authUser={authUser} onLogout={handleLogout}>
                  <UserOffersPage authUser={authUser} />
                </MainLayout>
              </RoleRoute>
            )}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to={authUser ? getDashboardPath(authUser.role) : '/'} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;

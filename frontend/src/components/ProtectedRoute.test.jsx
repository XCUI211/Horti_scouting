import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const setStoredUser = (user) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
};

const renderApp = (initialPath, routeElement) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>LoginLanding</div>} />
          <Route path="/admin_home" element={<div>AdminHome</div>} />
          <Route path="/scout_home" element={<div>ScoutHome</div>} />
          {routeElement}
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
});

describe('ProtectedRoute', () => {
  it('redirects to / when no user is logged in', () => {
    renderApp(
      '/protected',
      <Route
        path="/protected"
        element={<ProtectedRoute><div>Secret</div></ProtectedRoute>}
      />
    );

    expect(screen.getByText('LoginLanding')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('renders children when logged in and no role is required', () => {
    setStoredUser({ uid: 1, username: 'a', role: 'admin' });

    renderApp(
      '/protected',
      <Route
        path="/protected"
        element={<ProtectedRoute><div>Secret</div></ProtectedRoute>}
      />
    );

    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('renders children when the required role matches', () => {
    setStoredUser({ uid: 1, username: 'a', role: 'admin' });

    renderApp(
      '/admin_only',
      <Route
        path="/admin_only"
        element={<ProtectedRoute role="admin"><div>AdminSecret</div></ProtectedRoute>}
      />
    );

    expect(screen.getByText('AdminSecret')).toBeInTheDocument();
  });

  it('redirects admin to /admin_home when accessing a scout-only route', () => {
    setStoredUser({ uid: 1, username: 'a', role: 'admin' });

    renderApp(
      '/scout_only',
      <Route
        path="/scout_only"
        element={<ProtectedRoute role="scout"><div>ScoutSecret</div></ProtectedRoute>}
      />
    );

    expect(screen.getByText('AdminHome')).toBeInTheDocument();
    expect(screen.queryByText('ScoutSecret')).not.toBeInTheDocument();
  });

  it('redirects scout to /scout_home when accessing an admin-only route', () => {
    setStoredUser({ uid: 2, username: 's', role: 'scout' });

    renderApp(
      '/admin_only',
      <Route
        path="/admin_only"
        element={<ProtectedRoute role="admin"><div>AdminSecret</div></ProtectedRoute>}
      />
    );

    expect(screen.getByText('ScoutHome')).toBeInTheDocument();
    expect(screen.queryByText('AdminSecret')).not.toBeInTheDocument();
  });
});

import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/client';

interface RouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: RouteProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/auth');
          setIsAuthenticated(false);
          return;
        }

        const { response } = await api.auth.validateToken(token);

        if (!response.ok) {
          localStorage.removeItem('token');
          navigate('/auth');
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        navigate('/auth');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: RouteProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const { response } = await api.auth.validateToken(token);

        if (response.ok) {
          navigate('/');
          setIsAuthenticated(true);
          return;
        }

        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } catch {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

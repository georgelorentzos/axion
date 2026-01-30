import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: RouteProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const apiUrl = window.GLOBAL_ENV.API_ENDPOINT;

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/auth');
          setIsAuthenticated(false);
          return;
        }

        const response = await fetch(`${apiUrl}/api/validate-token`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

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
  const apiUrl = import.meta.env.VITE_SERVER_API_URL;
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const response = await fetch(`${apiUrl}/api/validate-token`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

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
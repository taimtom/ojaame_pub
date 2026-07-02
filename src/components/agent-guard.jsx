import { Navigate } from 'react-router-dom';
import { useAgentAuth } from 'src/contexts/AgentAuthContext';

export function AgentGuard({ children }) {
  const { token, loading } = useAgentAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/agent/login" replace />;
  return children;
}

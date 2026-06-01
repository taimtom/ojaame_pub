import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { agentApi, AGENT_TOKEN_KEY } from 'src/lib/agentApi';

const AgentAuthContext = createContext(null);

export function AgentAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AGENT_TOKEN_KEY));
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const t = localStorage.getItem(AGENT_TOKEN_KEY);
    if (!t) {
      setAgent(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await agentApi.get('/api/referral/auth/me');
      setAgent(data);
    } catch {
      localStorage.removeItem(AGENT_TOKEN_KEY);
      setToken(null);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email, password) => {
    const { data } = await agentApi.post('/api/referral/auth/login', { email, password });
    localStorage.setItem(AGENT_TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setAgent(data.agent);
  }, []);

  const signup = useCallback(async (body) => {
    const { data } = await agentApi.post('/api/referral/auth/signup', body);
    localStorage.setItem(AGENT_TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setAgent(data.agent);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AGENT_TOKEN_KEY);
    setToken(null);
    setAgent(null);
  }, []);

  const value = useMemo(
    () => ({ token, agent, loading, login, signup, logout, refreshMe }),
    [token, agent, loading, login, signup, logout, refreshMe]
  );

  return <AgentAuthContext.Provider value={value}>{children}</AgentAuthContext.Provider>;
}

export function useAgentAuth() {
  const v = useContext(AgentAuthContext);
  if (!v) throw new Error('useAgentAuth must be used inside AgentAuthProvider');
  return v;
}

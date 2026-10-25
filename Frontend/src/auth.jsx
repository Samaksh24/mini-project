import { createContext, useContext, useState } from "react";
import { api, tokenStore } from "./lib/api.js";

const AuthContext = createContext(null);
const USER_KEY = "cr_user";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const save = (next) => {
    setUser(next);
    try {
      next ? localStorage.setItem(USER_KEY, JSON.stringify(next)) : localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    save(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    await api.register(name, email, password);
    return login(email, password);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* the local session is cleared either way */
    }
    save(null);
  };

  // Called when the server says our session has expired.
  const expire = () => {
    tokenStore.set(null);
    save(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === "Admin", login, register, logout, expire }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

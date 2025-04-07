import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the authentication context
const AuthContext = createContext(null);

// Get the backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // On mount, check if a token exists and fetch the current user data.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${BACKEND_URL}/user/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // If the token is invalid or expired, clear it.
            localStorage.removeItem('token');
            setUser(null);
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('token');
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  /**
   * Logs in a user with their credentials.
   * If successful, stores the token, updates user state,
   * and navigates to "/profile". Otherwise, returns an error message.
   */
  const login = async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return data.message || 'Login failed';
      }
      // Store the received token.
      localStorage.setItem('token', data.token);
      // Fetch the authenticated user's data.
      const userRes = await fetch(`${BACKEND_URL}/user/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.token}`
        }
      });
      const userData = await userRes.json();
      if (userRes.ok) {
        setUser(userData.user);
        navigate('/profile');
      } else {
        localStorage.removeItem('token');
        setUser(null);
        return userData.message || 'Failed to fetch user data';
      }
    } catch (error) {
      console.error('Error during login:', error);
      return 'An error occurred during login';
    }
  };

  /**
   * Registers a new user.
   * On success, navigates to "/success". Otherwise, returns an error message.
   */
  const register = async (userData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        return data.message || 'Registration failed';
      }
      // On successful registration, navigate to the success page.
      navigate('/success');
    } catch (error) {
      console.error('Error during registration:', error);
      return 'An error occurred during registration';
    }
  };

  /**
   * Logs out the currently authenticated user.
   * Removes the token from localStorage, resets user state,
   * and navigates to the homepage.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

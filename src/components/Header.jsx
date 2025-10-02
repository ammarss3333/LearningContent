// Global header component displayed on every page.
// Provides navigation links, a welcome message and a Sign Out button.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOutUser } from '../firebase.js';

/**
 * Header component displayed on all pages.  Shows the site title, a set of
 * navigation links (Home, Exams, Leaderboard and Admin if the user is an
 * administrator), a welcome message with the user's name and a sign‑out
 * button.  The header uses a gradient background to match the look of
 * the reference design.
 *
 * Props:
 *  - user: the current authenticated user object (null if not logged in)
 *  - isAdmin: boolean flag indicating whether the user has admin rights
 */
export default function Header({ user, isAdmin }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/');
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  return (
    <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <h1 className="text-lg sm:text-2xl font-semibold flex items-center space-x-2">
          <span role="img" aria-label="logo">📚</span>
          <span>Exam Platform</span>
        </h1>
        <nav className="flex space-x-4 items-center text-sm sm:text-base">
          <Link to="/" className="hover:underline">Home</Link>
          {user && <Link to="/exams" className="hover:underline">Exams</Link>}
          <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
          {isAdmin && (
            <Link to="/admin" className="hover:underline">Admin</Link>
          )}
        </nav>
        <div className="flex items-center space-x-2">
          {user && (
            <>
              <span className="hidden sm:block">Welcome, {user.name || user.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-white text-indigo-600 px-3 py-1 rounded-md shadow hover:bg-indigo-50"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
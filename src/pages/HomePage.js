/* global React */

import { signIn, signOutUser } from '../firebase.js';

// HomePage displays a welcome screen.  When the user is not logged in it
// offers a sign‑in button.  After login it shows some basic stats and
// navigation links.

export default function HomePage({ user }) {
  const handleLogin = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Failed to sign in', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  if (!user) {
    return (
      React.createElement('div', { className: 'flex flex-col items-center justify-center min-h-screen text-center space-y-4' },
        React.createElement('h1', { className: 'text-3xl font-bold' }, 'Welcome to the Student Exam Platform'),
        React.createElement('p', { className: 'text-gray-600 max-w-md' },
          'A place to practise and test your knowledge.  Sign in to begin.'
        ),
        React.createElement('button', {
          onClick: handleLogin,
          className: 'bg-primary text-white px-6 py-3 rounded shadow hover:bg-primary/90',
        }, 'Sign in with Google')
      )
    );
  }

  return (
    React.createElement('div', { className: 'p-6 space-y-4' },
      React.createElement('h1', { className: 'text-2xl font-semibold' }, `Hello, ${user.name || user.email}!`),
      React.createElement('div', { className: 'flex flex-wrap gap-4' },
        React.createElement(ReactRouterDOM.Link, {
          to: '/exams',
          className: 'block px-4 py-2 bg-white border rounded shadow hover:bg-gray-50',
        }, 'Browse Exams'),
        React.createElement(ReactRouterDOM.Link, {
          to: '/leaderboard',
          className: 'block px-4 py-2 bg-white border rounded shadow hover:bg-gray-50',
        }, 'Leaderboard'),
        user.isAdmin && React.createElement(ReactRouterDOM.Link, {
          to: '/admin',
          className: 'block px-4 py-2 bg-white border rounded shadow hover:bg-gray-50',
        }, 'Admin Panel')
      ),
      React.createElement('div', { className: 'mt-4' },
        React.createElement('h2', { className: 'text-xl font-medium' }, 'Your Badges'),
        React.createElement('div', { className: 'flex flex-wrap gap-2 mt-2' },
          (user.badges && user.badges.length > 0 ? user.badges : ['No badges yet']).map((badge, idx) => (
            React.createElement('span', {
              key: idx,
              className: 'inline-block px-3 py-1 rounded-full bg-secondary text-white text-sm',
            }, badge)
          ))
        )
      ),
      React.createElement('button', {
        onClick: handleLogout,
        className: 'text-red-500 underline mt-6',
      }, 'Sign out')
    )
  );
}

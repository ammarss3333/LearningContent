import React from 'react';
import { Link } from 'react-router-dom';
import { signIn } from '../firebase.js';

/**
 * Home page shown at the root of the application.  When a user is not
 * authenticated it displays a welcome message and a button to sign in via
 * Google.  After authentication it provides quick links to take an exam
 * and view the leaderboard, as well as showing earned badges.  Sign out
 * and greeting are handled in the global header.
 */
export default function HomePage({ user }) {
  const handleLogin = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Failed to sign in', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-2xl font-semibold text-center">Welcome to the Exam Platform</h2>
        {!user ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-lg">
              Select an option below to get started.
            </p>
            <div className="flex flex-col sm:flex-row justify-center sm:space-x-4 space-y-3 sm:space-y-0">
              <Link
                to="/exams"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow text-center"
              >
                Take an Exam
              </Link>
              <Link
                to="/leaderboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow text-center"
              >
                View Leaderboard
              </Link>
            </div>
            <div>
              <h3 className="text-xl font-medium mt-6">Your Badges</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {(user.badges && user.badges.length > 0
                  ? user.badges
                  : ['No badges yet']
                ).map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 rounded-full bg-secondary text-white text-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
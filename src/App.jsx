import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
} from './firebase.js';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import ExamListPage from './pages/ExamListPage.jsx';
import ExamPage from './pages/ExamPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

/**
 * Root component for the exam platform.  Handles authentication state and
 * routing.  Displays a persistent header with navigation links and passes
 * the current user and admin status into pages as props.  If the user's
 * Firestore profile does not exist it will be created on the fly.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        let snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            name: authUser.displayName || '',
            email: authUser.email || '',
            isAdmin: false,
            badges: [],
            attempts: [],
          });
          snap = await getDoc(userRef);
        }
        const data = snap.data();
        setUser({
          uid: authUser.uid,
          name: authUser.displayName || '',
          email: authUser.email || '',
          ...data,
        });
        setIsAdmin(data?.isAdmin || false);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <>
      <Header user={user} isAdmin={isAdmin} />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/exams" element={<ExamListPage user={user} />} />
          <Route path="/exam/:examId" element={<ExamPage user={user} />} />
          {/* Keep plural path for results to match existing links */}
          <Route path="/results/:attemptId" element={<ResultPage user={user} />} />
          <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
          {isAdmin && <Route path="/admin" element={<AdminDashboard user={user} />} />}
          {/* Fallback to home for unknown paths */}
          <Route path="*" element={<HomePage user={user} />} />
        </Routes>
      </div>
    </>
  );
}

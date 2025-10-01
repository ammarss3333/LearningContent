import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
} from './firebase.js';
import HomePage from './pages/HomePage.jsx';
import ExamListPage from './pages/ExamListPage.jsx';
import ExamPage from './pages/ExamPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';

/**
 * Root of the exam platform.  Handles user authentication state, routes
 * different pages via React Router and passes user information down as
 * props.  Firebase is initialised in src/firebase.js.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // ensure user doc exists and fetch it
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
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }
  return (
    <Routes>
      <Route path="/" element={<HomePage user={user} />} />
      <Route path="/exams" element={<ExamListPage user={user} />} />
      <Route path="/exam/:examId" element={<ExamPage user={user} />} />
      <Route path="/results/:attemptId" element={<ResultPage user={user} />} />
      <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
      <Route
        path="/admin/*"
        element={user?.isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
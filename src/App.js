/* global React, ReactRouterDOM, ReactDOM */

// Root of the exam platform.  Handles user authentication state, routes
// different pages via React Router and passes user information down as
// props.  Firebase is initialised in src/firebase.js.

import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
} from './firebase.js';

import HomePage from './pages/HomePage.js';
import ExamListPage from './pages/ExamListPage.js';
import ExamPage from './pages/ExamPage.js';
import ResultPage from './pages/ResultPage.js';
import AdminDashboard from './pages/AdminDashboard.js';
import LeaderboardPage from './pages/LeaderboardPage.js';

const { BrowserRouter, Routes, Route, Navigate } = ReactRouterDOM;

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
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
    return React.createElement('div', { className: 'p-6' }, 'Loading…');
  }
  return (
    React.createElement(BrowserRouter, null,
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement(HomePage, { user }) }),
        React.createElement(Route, { path: '/exams', element: React.createElement(ExamListPage, { user }) }),
        React.createElement(Route, { path: '/exam/:examId', element: React.createElement(ExamPage, { user }) }),
        React.createElement(Route, { path: '/results/:attemptId', element: React.createElement(ResultPage, { user }) }),
        React.createElement(Route, { path: '/leaderboard', element: React.createElement(LeaderboardPage, { user }) }),
        React.createElement(Route, {
          path: '/admin/*',
          element: user?.isAdmin ? React.createElement(AdminDashboard, { user }) : React.createElement(Navigate, { to: '/', replace: true }),
        }),
        React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/', replace: true }) })
      )
    )
  );
}

// Render the App into the root element
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));

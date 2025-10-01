/* global React */

import { db, collection, getDocs } from '../firebase.js';

export default function ExamListPage({ user }) {
  const { Link } = ReactRouterDOM;
  const [exams, setExams] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchExams() {
      try {
        const snap = await getDocs(collection(db, 'exams'));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExams(list);
      } catch (err) {
        console.error('Failed to fetch exams', err);
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  if (!user) {
    return React.createElement('div', { className: 'p-6' }, 'Please sign in to view exams.');
  }
  if (loading) {
    return React.createElement('div', { className: 'p-6' }, 'Loading exams…');
  }
  return (
    React.createElement('div', { className: 'p-6 space-y-4' },
      React.createElement('h1', { className: 'text-2xl font-semibold' }, 'Available Exams'),
      exams.length === 0 && React.createElement('p', null, 'No exams have been created yet.'),
      React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' },
        exams.map((exam) => (
          React.createElement('div', { key: exam.id, className: 'bg-white border rounded shadow p-4 flex flex-col' },
            React.createElement('h2', { className: 'text-xl font-medium mb-2' }, exam.title || 'Untitled Exam'),
            React.createElement('p', { className: 'flex-grow text-gray-600 mb-4' }, exam.description || 'No description'),
            React.createElement(Link, {
              to: `/exam/${exam.id}`,
              className: 'inline-block mt-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary/90',
            }, 'Take Exam')
          )
        ))
      )
    )
  );
}

/* global React */

import { db, collection, getDocs, query, orderBy, limit } from '../firebase.js';

export default function LeaderboardPage({ user }) {
  const [leaders, setLeaders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [usersMap, setUsersMap] = React.useState({});
  const [examsMap, setExamsMap] = React.useState({});

  React.useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const attemptsSnap = await getDocs(query(collection(db, 'attempts'), orderBy('score', 'desc'), limit(10)));
        const attempts = attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // fetch users and exams
        const userSnap = await getDocs(collection(db, 'users'));
        const uMap = {};
        userSnap.docs.forEach((d) => { uMap[d.id] = d.data(); });
        setUsersMap(uMap);
        const examSnap = await getDocs(collection(db, 'exams'));
        const eMap = {};
        examSnap.docs.forEach((d) => { eMap[d.id] = d.data(); });
        setExamsMap(eMap);
        setLeaders(attempts);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);
  if (loading) return React.createElement('div', { className: 'p-6' }, 'Loading leaderboard…');
  return (
    React.createElement('div', { className: 'p-6 space-y-4' },
      React.createElement('h1', { className: 'text-2xl font-semibold' }, 'Leaderboard'),
      leaders.length === 0 && React.createElement('p', null, 'No attempts yet.'),
      leaders.length > 0 && React.createElement('table', { className: 'w-full table-auto border-collapse text-sm' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'border px-2 py-1' }, '#'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Student'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Exam'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Score')
          )
        ),
        React.createElement('tbody', null,
          leaders.map((at, idx) => (
            React.createElement('tr', { key: at.id },
              React.createElement('td', { className: 'border px-2 py-1 text-center' }, idx + 1),
              React.createElement('td', { className: 'border px-2 py-1' }, usersMap[at.userId]?.name || usersMap[at.userId]?.email || at.userId),
              React.createElement('td', { className: 'border px-2 py-1' }, examsMap[at.examId]?.title || at.examId),
              React.createElement('td', { className: 'border px-2 py-1 text-center' }, at.score + '%')
            )
          ))
        )
      )
    )
  );
}

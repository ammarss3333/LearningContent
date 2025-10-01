import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, orderBy, limit } from '../firebase.js';

// LeaderboardPage fetches the top exam attempts ordered by score and displays
// them in a table.  It also fetches user and exam metadata to show
// human‑friendly names instead of IDs.
export default function LeaderboardPage({ user }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [examsMap, setExamsMap] = useState({});

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const attemptsSnap = await getDocs(
          query(collection(db, 'attempts'), orderBy('score', 'desc'), limit(10)),
        );
        const attempts = attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // fetch users and exams
        const userSnap = await getDocs(collection(db, 'users'));
        const uMap = {};
        userSnap.docs.forEach((d) => {
          uMap[d.id] = d.data();
        });
        setUsersMap(uMap);
        const examSnap = await getDocs(collection(db, 'exams'));
        const eMap = {};
        examSnap.docs.forEach((d) => {
          eMap[d.id] = d.data();
        });
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

  if (loading) {
    return <div className="p-6">Loading leaderboard…</div>;
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      {leaders.length === 0 && <p>No attempts yet.</p>}
      {leaders.length > 0 && (
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Student</th>
              <th className="border px-2 py-1">Exam</th>
              <th className="border px-2 py-1">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((at, idx) => (
              <tr key={at.id}>
                <td className="border px-2 py-1 text-center">{idx + 1}</td>
                <td className="border px-2 py-1">
                  {usersMap[at.userId]?.name || usersMap[at.userId]?.email || at.userId}
                </td>
                <td className="border px-2 py-1">
                  {examsMap[at.examId]?.title || at.examId}
                </td>
                <td className="border px-2 py-1 text-center">{at.score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
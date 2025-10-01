import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, collection, getDocs } from '../firebase.js';

// Displays a list of available exams.  Fetches the list from Firestore
// on mount and shows a card for each exam with a link to start.
export default function ExamListPage({ user }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return <div className="p-6">Please sign in to view exams.</div>;
  }
  if (loading) {
    return <div className="p-6">Loading exams…</div>;
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Available Exams</h1>
      {exams.length === 0 && <p>No exams have been created yet.</p>}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white border rounded shadow p-4 flex flex-col"
          >
            <h2 className="text-xl font-medium mb-2">
              {exam.title || 'Untitled Exam'}
            </h2>
            <p className="flex-grow text-gray-600 mb-4">
              {exam.description || 'No description'}
            </p>
            <Link
              to={`/exam/${exam.id}`}
              className="inline-block mt-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
            >
              Take Exam
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
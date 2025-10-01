import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  db,
  doc,
  getDoc,
  collection,
  getDocs,
} from '../firebase.js';
import { evaluateQuestion, calculateScore } from '../utils.js';

// Helper to format a user’s answer for display
function formatAnswer(q, ans) {
  if (ans == null) return '—';
  switch (q.type) {
    case 'mcq':
      return q.options ? q.options[ans] : ans;
    case 'truefalse':
      return ans ? 'True' : 'False';
    case 'short':
      return ans;
    case 'drag':
      return Array.isArray(ans) ? ans.join(' → ') : ans;
    default:
      return String(ans);
  }
}

export default function ResultPage({ user }) {
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    async function fetchAttempt() {
      try {
        const attemptRef = doc(db, 'attempts', attemptId);
        const attemptSnap = await getDoc(attemptRef);
        if (!attemptSnap.exists()) {
          console.error('Attempt not found');
          setLoading(false);
          return;
        }
        const attemptData = attemptSnap.data();
        setAttempt(attemptData);
        // fetch exam
        const examRef = doc(db, 'exams', attemptData.examId);
        const examSnap = await getDoc(examRef);
        const examData = examSnap.exists() ? { id: examSnap.id, ...examSnap.data() } : null;
        setExam(examData);
        // determine questions similar to exam page
        let questionsList = [];
        if (examData) {
          if (Array.isArray(examData.questionIds) && examData.questionIds.length > 0) {
            for (const qid of examData.questionIds) {
              const qRef = doc(db, 'questions', qid);
              const qSnap = await getDoc(qRef);
              if (qSnap.exists()) {
                questionsList.push({ id: qSnap.id, ...qSnap.data() });
              }
            }
          } else {
            const allSnap = await getDocs(collection(db, 'questions'));
            questionsList = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            if (examData.randomCount) {
              questionsList = questionsList.slice(0, examData.randomCount);
            }
          }
        }
        setQuestions(questionsList);
      } catch (err) {
        console.error('Failed to load attempt results', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return <div className="p-6">Loading results…</div>;
  }
  if (!attempt) {
    return <div className="p-6">Attempt not found.</div>;
  }
  const score = attempt.score ?? calculateScore(questions, attempt.answers || []);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Results</h1>
      <div className="bg-white p-4 rounded shadow">
        <p className="text-xl font-medium mb-2">Score: {score}%</p>
        {user && Array.isArray(user.badges) && user.badges.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-1">Badges earned:</h2>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-block px-3 py-1 rounded-full bg-secondary text-white text-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userAnswer = (attempt.answers || [])[idx];
          const correct = evaluateQuestion(q, userAnswer);
          return (
            <div key={q.id} className="bg-white p-4 rounded shadow">
              <h2 className="font-medium">
                Q{idx + 1}. {q.text}
              </h2>
              <p className="mt-1">Your answer: {formatAnswer(q, userAnswer)}</p>
              <p
                className={`mt-1 font-semibold ${
                  correct ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {correct ? 'Correct' : 'Incorrect'}
              </p>
              {q.explanation && (
                <p className="mt-2 text-gray-600">
                  <span className="font-medium">Explanation: </span>
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Link to="/" className="inline-block mt-4 underline text-primary">
        Back to Home
      </Link>
    </div>
  );
}
/* global React */

import {
  db,
  doc,
  getDoc,
  collection,
  getDocs,
} from '../firebase.js';

// Destructure React Router hooks from global ReactRouterDOM UMD build
const { useParams, Link } = ReactRouterDOM;
import { evaluateQuestion, calculateScore } from '../utils.js';

export default function ResultPage({ user }) {
  const { attemptId } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [attempt, setAttempt] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [exam, setExam] = React.useState(null);

  React.useEffect(() => {
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
        setExam(examSnap.exists() ? { id: examSnap.id, ...examSnap.data() } : null);
        // determine questions similar to exam page
        let questionsList = [];
        if (examSnap.exists()) {
          const examData = examSnap.data();
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
              // replicate the random selection based on exam order: we assume the attempt stored answers in same order as originally drawn.
              // we can't reconstruct the same random set reliably; instead use first N questions in alphabetical order as fallback.
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
    return React.createElement('div', { className: 'p-6' }, 'Loading results…');
  }
  if (!attempt) {
    return React.createElement('div', { className: 'p-6' }, 'Attempt not found.');
  }
  // compute score again for display consistency
  const score = attempt.score ?? calculateScore(questions, attempt.answers || []);
  return (
    React.createElement('div', { className: 'p-6 space-y-6' },
      React.createElement('h1', { className: 'text-2xl font-semibold' }, 'Your Results'),
      React.createElement('div', { className: 'bg-white p-4 rounded shadow' },
        React.createElement('p', { className: 'text-xl font-medium mb-2' }, `Score: ${score}%`),
        user && Array.isArray(user.badges) && user.badges.length > 0 && (
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-lg font-medium mb-1' }, 'Badges earned:'),
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
              user.badges.map((badge, idx) => (
                React.createElement('span', {
                  key: idx,
                  className: 'inline-block px-3 py-1 rounded-full bg-secondary text-white text-sm',
                }, badge)
              ))
            )
          )
        )
      ),
      React.createElement('div', { className: 'space-y-4' },
        questions.map((q, idx) => {
          const userAnswer = (attempt.answers || [])[idx];
          const correct = evaluateQuestion(q, userAnswer);
          return React.createElement('div', { key: q.id, className: 'bg-white p-4 rounded shadow' },
            React.createElement('h2', { className: 'font-medium' }, `Q${idx + 1}. ${q.text}`),
            React.createElement('p', { className: 'mt-1' }, `Your answer: ${formatAnswer(q, userAnswer)}`),
            React.createElement('p', { className: `mt-1 font-semibold ${correct ? 'text-green-600' : 'text-red-600'}` }, correct ? 'Correct' : 'Incorrect'),
            q.explanation && React.createElement('p', { className: 'mt-2 text-gray-600' }, React.createElement('span', { className: 'font-medium' }, 'Explanation: '), q.explanation)
          );
        })
      ),
      React.createElement(Link, { to: '/', className: 'inline-block mt-4 underline text-primary' }, 'Back to Home')
    )
  );

  // helper to format answer for display
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
}

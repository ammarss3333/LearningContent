import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  db,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
} from '../firebase.js';
import QuestionRenderer from '../components/QuestionRenderer.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { calculateScore, determineBadges } from '../utils.js';

/**
 * ExamPage displays a single exam, handles navigation between questions,
 * records answers and submits the attempt.  It supports fixed question
 * sets and random selection from the question pool.
 */
export default function ExamPage({ user }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch exam and questions on mount
  useEffect(() => {
    async function fetchExam() {
      try {
        const examRef = doc(db, 'exams', examId);
        const examSnap = await getDoc(examRef);
        if (!examSnap.exists()) {
          console.error('Exam not found');
          setLoading(false);
          return;
        }
        const examData = { id: examSnap.id, ...examSnap.data() };
        setExam(examData);
        // Determine questions
        let questionsList = [];
        if (Array.isArray(examData.questionIds) && examData.questionIds.length > 0) {
          // Fixed set of questions
          for (const qid of examData.questionIds) {
            const qRef = doc(db, 'questions', qid);
            const qSnap = await getDoc(qRef);
            if (qSnap.exists()) {
              questionsList.push({ id: qSnap.id, ...qSnap.data() });
            }
          }
        } else if (examData.randomCount) {
          // Randomly select N questions from all
          const allSnap = await getDocs(collection(db, 'questions'));
          questionsList = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // shuffle and slice
          for (let i = questionsList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questionsList[i], questionsList[j]] = [questionsList[j], questionsList[i]];
          }
          questionsList = questionsList.slice(0, examData.randomCount);
        } else {
          // default: load all questions
          const allSnap = await getDocs(collection(db, 'questions'));
          questionsList = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        setQuestions(questionsList);
        setAnswers(new Array(questionsList.length).fill(null));
      } catch (err) {
        console.error('Failed to load exam', err);
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [examId]);

  // Update answer for current question
  const handleAnswer = (value) => {
    setAnswers((prev) => {
      const newAns = prev.slice();
      newAns[currentIdx] = value;
      return newAns;
    });
  };

  const goPrevious = () => {
    setCurrentIdx((i) => Math.max(i - 1, 0));
  };
  const goNext = () => {
    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Calculate score
      const score = calculateScore(questions, answers);
      // Create attempt document
      const attemptRef = await addDoc(collection(db, 'attempts'), {
        userId: user.uid,
        examId: examId,
        answers: answers,
        score: score,
        timestamp: new Date().toISOString(),
      });
      // Update user document: add attemptId and badges
      const userRef = doc(db, 'users', user.uid);
      // Determine new badges
      const currentBadges = Array.isArray(user.badges) ? user.badges : [];
      const attemptsCount = Array.isArray(user.attempts) ? user.attempts.length : 0;
      const newBadges = determineBadges(score, currentBadges, attemptsCount);
      const updatedBadges = [...currentBadges, ...newBadges];
      const updatedAttempts = [...(user.attempts || []), attemptRef.id];
      await updateDoc(userRef, {
        badges: updatedBadges,
        attempts: updatedAttempts,
      });
      // Navigate to results page with attempt ID
      navigate(`/results/${attemptRef.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to submit exam', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className="p-6">Please sign in to take exams.</div>;
  }
  if (loading) {
    return <div className="p-6">Loading exam…</div>;
  }
  if (!exam || questions.length === 0) {
    return <div className="p-6">Exam not found or no questions available.</div>;
  }
  const progress = (currentIdx / questions.length) * 100;
  const currentQuestion = questions[currentIdx];
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">
        {exam.title || 'Exam'}
      </h1>
      <ProgressBar value={progress} />
      <div className="bg-white p-4 rounded shadow">
        <QuestionRenderer
          question={currentQuestion}
          answer={answers[currentIdx]}
          onAnswer={handleAnswer}
        />
      </div>
      <div className="flex justify-between mt-4">
        <button
          onClick={goPrevious}
          disabled={currentIdx === 0}
          className={`px-4 py-2 rounded ${currentIdx === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
        >
          Previous
        </button>
        {currentIdx < questions.length - 1 && (
          <button
            onClick={goNext}
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
          >
            Next
          </button>
        )}
        {currentIdx === questions.length - 1 && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
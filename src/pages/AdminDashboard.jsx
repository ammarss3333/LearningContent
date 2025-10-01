import React, { useState, useEffect, useRef } from 'react';
import {
  db,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
} from '../firebase.js';

// The AdminDashboard provides a secure interface for administrators to
// manage questions, exams and view progress.  Access is restricted via
// an `isAdmin` flag on the user document in Firestore.  Each sub‑panel
// is implemented as its own component below.
export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('questions');
  if (!user?.isAdmin) {
    return <div className="p-6">Access denied. You are not an administrator.</div>;
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>
      <div className="flex space-x-4">
        {['questions', 'exams', 'progress'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${tab === t ? 'bg-primary text-white' : 'bg-gray-200'} px-4 py-2 rounded`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'questions' && <ManageQuestions />}
      {tab === 'exams' && <ManageExams />}
      {tab === 'progress' && <ViewProgress />}
    </div>
  );
}

function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  // File input ref for importing JSON
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const snap = await getDocs(collection(db, 'questions'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(list);
      } catch (err) {
        console.error('Failed to fetch questions', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const handleDelete = async (qid) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', qid));
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  // Handle importing a JSON file containing an array of question objects.
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) {
        alert('JSON must be an array of question objects');
        return;
      }
      for (const item of json) {
        // Validate required fields
        if (!item.text || !item.type) continue;
        const ref = await addDoc(collection(db, 'questions'), item);
        setQuestions((prev) => [...prev, { id: ref.id, ...item }]);
      }
      alert('Questions imported successfully');
    } catch (err) {
      console.error('Failed to import questions', err);
      alert('Failed to import questions. Check console for details.');
    } finally {
      // reset file input
      e.target.value = '';
    }
  };

  // Export current questions as JSON
  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(questions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', 'questions_export.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditQuestion(null);
  };

  const handleSave = (qid, data) => {
    if (qid) {
      // editing existing
      setQuestions((prev) => prev.map((q) => (q.id === qid ? { id: qid, ...data } : q)));
    } else {
      // new question added: it will have id set by form
      setQuestions((prev) => [...prev, data]);
    }
    handleFormClose();
  };

  if (loading) {
    return <div className="p-4">Loading questions…</div>;
  }
  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => {
            setShowForm(true);
            setEditQuestion(null);
          }}
          className="bg-primary text-white px-3 py-2 rounded"
        >
          Add Question
        </button>
        <button onClick={handleExport} className="bg-blue-600 text-white px-3 py-2 rounded">
          Export JSON
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-600 text-white px-3 py-2 rounded"
        >
          Import JSON
        </button>
        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          onChange={handleImportFile}
          className="hidden"
        />
      </div>
      {showForm && (
        <QuestionForm
          initial={editQuestion}
          onClose={handleFormClose}
          onSave={handleSave}
        />
      )}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Text</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td className="border px-2 py-1">{q.text}</td>
              <td className="border px-2 py-1 capitalize">{q.type}</td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => {
                    setEditQuestion(q);
                    setShowForm(true);
                  }}
                  className="text-blue-600 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionForm({ initial, onClose, onSave }) {
  const isEdit = Boolean(initial);
  const [text, setText] = useState(initial?.text || '');
  const [type, setType] = useState(initial?.type || 'mcq');
  const [optionsStr, setOptionsStr] = useState((initial?.options || []).join('\n'));
  const [answer, setAnswer] = useState(initial?.answer || '');
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        text: text,
        type: type,
        explanation: explanation,
      };
      // parse options and answer depending on type
      if (type === 'mcq' || type === 'drag') {
        const opts = optionsStr
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s);
        data.options = opts;
        if (type === 'mcq') {
          data.answer = Number(answer);
        } else {
          // drag: correct answer is the provided order of options
          data.answer = opts;
        }
      } else if (type === 'truefalse') {
        data.answer = answer === 'true' || answer === true;
        data.options = ['True', 'False'];
      } else if (type === 'short') {
        data.answer = answer;
      }
      let newDoc;
      if (isEdit) {
        const ref = doc(db, 'questions', initial.id);
        await updateDoc(ref, data);
        newDoc = { id: initial.id, ...data };
      } else {
        const ref = await addDoc(collection(db, 'questions'), data);
        newDoc = { id: ref.id, ...data };
      }
      onSave(isEdit ? initial.id : null, newDoc);
    } catch (err) {
      console.error('Failed to save question', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded p-4 my-4">
      <h2 className="text-xl font-medium mb-2">
        {isEdit ? 'Edit Question' : 'New Question'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Question text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
            required
          ></textarea>
        </div>
        <div>
          <label className="block font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="truefalse">True/False</option>
            <option value="drag">Drag & Drop</option>
            <option value="short">Short Answer</option>
          </select>
        </div>
        {(type === 'mcq' || type === 'drag') && (
          <div>
            <label className="block font-medium">Options (one per line)</label>
            <textarea
              value={optionsStr}
              onChange={(e) => setOptionsStr(e.target.value)}
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Option 1\nOption 2\nOption 3…"
              required
            ></textarea>
          </div>
        )}
        {type === 'mcq' && (
          <div>
            <label className="block font-medium">Correct option index (0‑based)</label>
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full border rounded p-2"
              min={0}
              required
            />
          </div>
        )}
        {type === 'truefalse' && (
          <div>
            <label className="block font-medium">Correct answer</label>
            <select
              value={answer === true || answer === 'true' ? 'true' : 'false'}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        )}
        {type === 'short' && (
          <div>
            <label className="block font-medium">Correct answer</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
        )}
        <div>
          <label className="block font-medium">Explanation (optional)</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full border rounded p-2"
            rows={2}
            placeholder="Provide an explanation for the correct answer…"
          ></textarea>
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ManageExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  useEffect(() => {
    async function fetchAll() {
      try {
        const snap = await getDocs(collection(db, 'exams'));
        setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const qSnap = await getDocs(collection(db, 'questions'));
        setQuestions(qSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to load exams/questions', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);
  const handleDelete = async (id) => {
    if (!confirm('Delete this exam?')) return;
    try {
      await deleteDoc(doc(db, 'exams', id));
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete exam', err);
    }
  };
  const handleSave = (id, data) => {
    if (id) {
      setExams((prev) => prev.map((e) => (e.id === id ? { id, ...data } : e)));
    } else {
      setExams((prev) => [...prev, data]);
    }
    setShowForm(false);
    setEditExam(null);
  };
  if (loading) return <div className="p-4">Loading exams…</div>;
  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setShowForm(true);
          setEditExam(null);
        }}
        className="bg-primary text-white px-3 py-2 rounded"
      >
        Add Exam
      </button>
      {showForm && (
        <ExamForm
          initial={editExam}
          onClose={() => {
            setShowForm(false);
            setEditExam(null);
          }}
          onSave={handleSave}
          availableQuestions={questions}
        />
      )}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Title</th>
            <th className="border px-2 py-1">Mode</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id}>
              <td className="border px-2 py-1">{exam.title}</td>
              <td className="border px-2 py-1 capitalize">
                {exam.questionIds && exam.questionIds.length > 0
                  ? 'Fixed'
                  : exam.randomCount
                  ? `Random (${exam.randomCount})`
                  : 'All'}
              </td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => {
                    setEditExam(exam);
                    setShowForm(true);
                  }}
                  className="text-blue-600 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExamForm({ initial, onClose, onSave, availableQuestions }) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [mode, setMode] = useState(
    initial?.questionIds && initial.questionIds.length > 0
      ? 'fixed'
      : initial?.randomCount
      ? 'random'
      : 'all',
  );
  const [selectedQuestions, setSelectedQuestions] = useState(
    initial?.questionIds || [],
  );
  const [randomCount, setRandomCount] = useState(initial?.randomCount || 1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        title: title,
        description: description,
      };
      if (mode === 'fixed') {
        data.questionIds = selectedQuestions;
        data.randomCount = null;
      } else if (mode === 'random') {
        data.randomCount = Number(randomCount);
        data.questionIds = [];
      } else {
        // all
        data.questionIds = [];
        data.randomCount = null;
      }
      let ref;
      if (isEdit) {
        ref = doc(db, 'exams', initial.id);
        await updateDoc(ref, data);
        onSave(initial.id, { ...data, id: initial.id });
      } else {
        const newDoc = await addDoc(collection(db, 'exams'), data);
        onSave(null, { id: newDoc.id, ...data });
      }
    } catch (err) {
      console.error('Failed to save exam', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded p-4 my-4">
      <h2 className="text-xl font-medium mb-2">{isEdit ? 'Edit Exam' : 'New Exam'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded p-2"
            rows={2}
          ></textarea>
        </div>
        <div>
          <label className="block font-medium">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="fixed">Fixed question set</option>
            <option value="random">Random selection</option>
            <option value="all">All questions</option>
          </select>
        </div>
        {mode === 'fixed' && (
          <div>
            <label className="block font-medium">Select questions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded p-2">
              {availableQuestions.map((q) => (
                <label key={q.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedQuestions((prev) => {
                        if (checked) {
                          return [...prev, q.id];
                        } else {
                          return prev.filter((id) => id !== q.id);
                        }
                      });
                    }}
                  />
                  <span>{q.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {mode === 'random' && (
          <div>
            <label className="block font-medium">Number of questions (random)</label>
            <input
              type="number"
              value={randomCount}
              onChange={(e) => setRandomCount(e.target.value)}
              className="w-full border rounded p-2"
              min={1}
              required
            />
          </div>
        )}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ViewProgress() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [examsMap, setExamsMap] = useState({});
  useEffect(() => {
    async function fetchAll() {
      try {
        const atSnap = await getDocs(collection(db, 'attempts'));
        setAttempts(atSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const uSnap = await getDocs(collection(db, 'users'));
        const uMap = {};
        uSnap.docs.forEach((d) => {
          uMap[d.id] = d.data();
        });
        setUsersMap(uMap);
        const eSnap = await getDocs(collection(db, 'exams'));
        const eMap = {};
        eSnap.docs.forEach((d) => {
          eMap[d.id] = d.data();
        });
        setExamsMap(eMap);
      } catch (err) {
        console.error('Failed to load progress', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);
  if (loading) return <div className="p-4">Loading progress…</div>;
  return (
    <div className="space-y-4">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Student</th>
            <th className="border px-2 py-1">Exam</th>
            <th className="border px-2 py-1">Score</th>
            <th className="border px-2 py-1">Time</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((at) => (
            <tr key={at.id}>
              <td className="border px-2 py-1">
                {usersMap[at.userId]?.name || usersMap[at.userId]?.email || at.userId}
              </td>
              <td className="border px-2 py-1">
                {examsMap[at.examId]?.title || at.examId}
              </td>
              <td className="border px-2 py-1 text-center">{at.score}%</td>
              <td className="border px-2 py-1">
                {new Date(at.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
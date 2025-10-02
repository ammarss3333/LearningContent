// src/pages/AdminDashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
} from '../firebase.js';
import { Link } from 'react-router-dom';

/**
 * The AdminDashboard provides a secure interface for administrators to
 * manage questions, exams and view student progress.  Access is restricted
 * via an `isAdmin` flag on the user document.  Within the panel there
 * are three sub‑components: ManageQuestions, ManageExams and ViewProgress.
 */
export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('questions');
  if (!user?.isAdmin) {
    return <div className="p-6">Access denied. You are not an administrator.</div>;
  }
  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500">Administration</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Admin Control Center</h1>
              <p className="text-slate-600">
                Manage categories, questions, exams, and review learner progress from one place.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Signed in as {user.name || user.email}</span>
            </div>
          </div>
        </header>
        <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6">
          <nav className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {['questions', 'exams', 'progress'].map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-primary text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="mt-6">
            {tab === 'questions' && <ManageQuestions />}
            {tab === 'exams' && <ManageExams />}
            {tab === 'progress' && <ViewProgress />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------- Manage Questions -----------------------
function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [importCategoryId, setImportCategoryId] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [questionSnap, categorySnap] = await Promise.all([
          getDocs(collection(db, 'questions')),
          getDocs(collection(db, 'categories')),
        ]);
        const fetchedQuestions = questionSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const fetchedCategories = categorySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(fetchedQuestions);
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
        setCategoryLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCategoryCreated = (category) => {
    setCategories((prev) => [...prev, category]);
  };

  const handleCategoryDeleted = (categoryId) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    // Remove category reference from local questions to keep UI consistent
    setQuestions((prev) =>
      prev.map((question) =>
        question.categoryId === categoryId
          ? { ...question, categoryId: null, categoryName: 'Unassigned' }
          : question,
      ),
    );
    setImportCategoryId((prev) => (prev === categoryId ? '' : prev));
  };

  const handleDelete = async (qid) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', qid));
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!importCategoryId) {
      alert('Please choose a category for the imported questions first.');
      e.target.value = '';
      return;
    }
    const selectedCategory = categories.find((cat) => cat.id === importCategoryId);
    if (!selectedCategory) {
      alert('Selected category no longer exists.');
      e.target.value = '';
      return;
    }
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) {
        alert('JSON must be an array of question objects');
        return;
      }
      for (const item of json) {
        if (!item.text || !item.type) continue;
        const payload = {
          ...item,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          category: selectedCategory.name,
        };
        const ref = await addDoc(collection(db, 'questions'), payload);
        setQuestions((prev) => [...prev, { id: ref.id, ...payload }]);
      }
      alert('Questions imported successfully');
    } catch (err) {
      console.error('Failed to import questions', err);
      alert('Failed to import questions. Check console for details.');
    } finally {
      e.target.value = '';
    }
  };

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
      setQuestions((prev) => prev.map((q) => (q.id === qid ? { id: qid, ...data } : q)));
    } else {
      setQuestions((prev) => [...prev, data]);
    }
    handleFormClose();
  };

  if (loading) {
    return <div className="p-4">Loading questions…</div>;
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <CategoryManager
        categories={categories}
        loading={categoryLoading}
        onCreated={handleCategoryCreated}
        onDeleted={handleCategoryDeleted}
      />
      <div className="space-y-6">
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Questions workspace</h2>
          <p className="mt-1 text-sm text-slate-200">
            Build your question bank once categories are in place. Import, edit or export items with
            a few clicks.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setShowForm(true);
                setEditQuestion(null);
              }}
              disabled={!categories.length}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                categories.length
                  ? 'bg-white text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              Add Question
            </button>
            <button
              onClick={handleExport}
              className="rounded-full px-4 py-2 text-sm font-medium bg-slate-100 text-slate-900 hover:bg-slate-200"
            >
              Export JSON
            </button>
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <label className="text-slate-300">Import to category</label>
              <select
                value={importCategoryId}
                onChange={(e) => setImportCategoryId(e.target.value)}
                className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-white"
              >
                <option value="">Select…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="text-slate-900">
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!categories.length}
                className={`rounded-full px-4 py-2 font-medium transition ${
                  categories.length
                    ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                Import JSON
              </button>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
          {!categories.length && !categoryLoading && (
            <p className="mt-3 text-sm text-amber-200">
              Create at least one category before adding or importing questions.
            </p>
          )}
        </div>

        {showForm && (
          <QuestionForm
            initial={editQuestion}
            categories={categories}
            onClose={handleFormClose}
            onSave={handleSave}
          />
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Question bank</h3>
              <p className="text-sm text-slate-500">{questions.length} questions available.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-6 py-3 font-semibold">Question</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">{q.text}</td>
                    <td className="px-6 py-4 capitalize text-slate-500">{q.type}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {q.categoryName || q.category || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => {
                          setEditQuestion(q);
                          setShowForm(true);
                        }}
                        className="text-primary font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-rose-500 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!questions.length && !loading && (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={4}>
                      No questions yet. Create one once categories are available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="px-6 py-4 text-sm text-slate-500">Loading questions…</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Form for creating or editing a question
function QuestionForm({ initial, categories, onClose, onSave }) {
  const isEdit = Boolean(initial);
  const [text, setText] = useState(initial?.text || '');
  const [type, setType] = useState(initial?.type || 'mcq');
  const [optionsStr, setOptionsStr] = useState((initial?.options || []).join('\n'));
  const [answer, setAnswer] = useState(initial?.answer || '');
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const initialCategoryId = (() => {
    if (initial?.categoryId) return initial.categoryId;
    if (initial?.category) {
      const matched = categories.find(
        (cat) => cat.name.toLowerCase() === initial.category.toLowerCase(),
      );
      if (matched) return matched.id;
    }
    if (initial?.categoryName) {
      const matched = categories.find(
        (cat) => cat.name.toLowerCase() === initial.categoryName.toLowerCase(),
      );
      if (matched) return matched.id;
    }
    return '';
  })();
  const [categoryId, setCategoryId] = useState(initialCategoryId);
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
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      if (selectedCategory) {
        data.categoryId = selectedCategory.id;
        data.categoryName = selectedCategory.name;
        data.category = selectedCategory.name;
      } else {
        data.categoryId = null;
        data.categoryName = 'Unassigned';
      }
      if (type === 'mcq' || type === 'drag') {
        const opts = optionsStr
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s);
        data.options = opts;
        if (type === 'mcq') {
          data.answer = Number(answer);
        } else {
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
          <label className="block font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full border rounded p-2"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
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

function CategoryManager({ categories, loading, onCreated, onDeleted }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        createdAt: Date.now(),
      };
      const ref = await addDoc(collection(db, 'categories'), payload);
      onCreated({ id: ref.id, ...payload });
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create category', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Questions linked to it will show as Unassigned.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      onDeleted(id);
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  return (
    <aside className="bg-white rounded-2xl shadow-sm p-6 space-y-5 self-start">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
        <p className="text-sm text-slate-500">
          Organise the question bank with dedicated categories. Add categories before creating
          questions.
        </p>
      </div>
      <button
        onClick={() => setShowForm((prev) => !prev)}
        className="w-full rounded-full bg-primary text-white py-2 font-medium hover:opacity-90 transition"
      >
        {showForm ? 'Close form' : 'New category'}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 border border-slate-200 rounded-xl p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="e.g. Algebra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Optional context for this category"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-emerald-500 text-slate-900 py-2 font-semibold hover:bg-emerald-400 transition"
          >
            {saving ? 'Saving…' : 'Create category'}
          </button>
        </form>
      )}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Existing categories
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : categories.length ? (
          <ul className="space-y-3">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="rounded-xl border border-slate-200 p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{cat.name}</span>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-xs font-semibold uppercase text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                {cat.description && (
                  <p className="text-xs text-slate-500">{cat.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            No categories yet. Start by creating your first category.
          </p>
        )}
      </div>
    </aside>
  );
}

// ----------------------- Manage Exams -----------------------
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
              <td className="border px-2 py-1 space-x-2 whitespace-nowrap">
                <Link
                  to={`/exam/${exam.id}`}
                  className="text-green-600 underline mr-2"
                >
                  Preview
                </Link>
                <button
                  onClick={() => {
                    setEditExam(exam);
                    setShowForm(true);
                  }}
                  className="text-blue-600 underline mr-2"
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

// Form for creating or editing an exam
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
        data.questionIds = [];
        data.randomCount = null;
      }
      if (isEdit) {
        const ref = doc(db, 'exams', initial.id);
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

// ----------------------- View Progress -----------------------
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
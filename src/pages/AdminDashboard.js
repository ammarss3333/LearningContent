/* global React */

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
// Remove the named imports from 'react'.  When loading React via a UMD bundle,
// React is exposed as a global variable.  Destructure useState and useEffect
// from the global React object instead.  Importing from 'react' directly
// fails when the files are served statically without a bundler.
const { useState, useEffect } = React;

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('questions');

  if (!user?.isAdmin) {
    return React.createElement('div', { className: 'p-6' }, 'Access denied. You are not an administrator.');
  }
  return (
    React.createElement('div', { className: 'p-6 space-y-4' },
      React.createElement('h1', { className: 'text-2xl font-semibold' }, 'Admin Panel'),
      React.createElement('div', { className: 'flex space-x-4' },
        ['questions', 'exams', 'progress'].map((t) => (
          React.createElement('button', {
            key: t,
            onClick: () => setTab(t),
            className: `${tab === t ? 'bg-primary text-white' : 'bg-gray-200'} px-4 py-2 rounded`,
          }, t.charAt(0).toUpperCase() + t.slice(1))
        ))
      ),
      tab === 'questions' && React.createElement(ManageQuestions, null),
      tab === 'exams' && React.createElement(ManageExams, null),
      tab === 'progress' && React.createElement(ViewProgress, null)
    )
  );
}

function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);

  // File input ref for importing JSON
  const fileInputRef = React.useRef(null);

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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
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
    return React.createElement('div', { className: 'p-4' }, 'Loading questions…');
  }
  return (
    React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'flex space-x-4' },
        React.createElement('button', {
          onClick: () => { setShowForm(true); setEditQuestion(null); },
          className: 'bg-primary text-white px-3 py-2 rounded',
        }, 'Add Question'),
        React.createElement('button', {
          onClick: handleExport,
          className: 'bg-blue-600 text-white px-3 py-2 rounded',
        }, 'Export JSON'),
        React.createElement('button', {
          onClick: () => fileInputRef.current?.click(),
          className: 'bg-green-600 text-white px-3 py-2 rounded',
        }, 'Import JSON'),
        React.createElement('input', {
          type: 'file',
          accept: '.json,application/json',
          ref: fileInputRef,
          onChange: handleImportFile,
          className: 'hidden',
        })
      ),
      showForm && React.createElement(QuestionForm, {
        initial: editQuestion,
        onClose: handleFormClose,
        onSave: handleSave,
      }),
      React.createElement('table', { className: 'w-full table-auto border-collapse' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'border px-2 py-1' }, 'Text'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Type'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Actions')
          )
        ),
        React.createElement('tbody', null,
          questions.map((q) => (
            React.createElement('tr', { key: q.id },
              React.createElement('td', { className: 'border px-2 py-1' }, q.text),
              React.createElement('td', { className: 'border px-2 py-1 capitalize' }, q.type),
              React.createElement('td', { className: 'border px-2 py-1 space-x-2' },
                React.createElement('button', {
                  onClick: () => { setEditQuestion(q); setShowForm(true); },
                  className: 'text-blue-600 underline',
                }, 'Edit'),
                React.createElement('button', {
                  onClick: () => handleDelete(q.id),
                  className: 'text-red-600 underline',
                }, 'Delete')
              )
            )
          ))
        )
      )
    )
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
        const opts = optionsStr.split('\n').map((s) => s.trim()).filter((s) => s);
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
    React.createElement('div', { className: 'bg-white border rounded p-4 my-4' },
      React.createElement('h2', { className: 'text-xl font-medium mb-2' }, isEdit ? 'Edit Question' : 'New Question'),
      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Question text'),
          React.createElement('textarea', {
            value: text,
            onChange: (e) => setText(e.target.value),
            className: 'w-full border rounded p-2',
            rows: 3,
            required: true,
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Type'),
          React.createElement('select', {
            value: type,
            onChange: (e) => setType(e.target.value),
            className: 'w-full border rounded p-2',
          },
            React.createElement('option', { value: 'mcq' }, 'Multiple Choice'),
            React.createElement('option', { value: 'truefalse' }, 'True/False'),
            React.createElement('option', { value: 'drag' }, 'Drag & Drop'),
            React.createElement('option', { value: 'short' }, 'Short Answer')
          )
        ),
        (type === 'mcq' || type === 'drag') && React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Options (one per line)'),
          React.createElement('textarea', {
            value: optionsStr,
            onChange: (e) => setOptionsStr(e.target.value),
            className: 'w-full border rounded p-2',
            rows: 4,
            placeholder: 'Option 1\nOption 2\nOption 3…',
            required: true,
          })
        ),
        type === 'mcq' && React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Correct option index (0‑based)'),
          React.createElement('input', {
            type: 'number',
            value: answer,
            onChange: (e) => setAnswer(e.target.value),
            className: 'w-full border rounded p-2',
            min: 0,
            required: true,
          })
        ),
        type === 'truefalse' && React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Correct answer'),
          React.createElement('select', {
            value: answer === true || answer === 'true' ? 'true' : 'false',
            onChange: (e) => setAnswer(e.target.value),
            className: 'w-full border rounded p-2',
          },
            React.createElement('option', { value: 'true' }, 'True'),
            React.createElement('option', { value: 'false' }, 'False')
          )
        ),
        type === 'short' && React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Correct answer'),
          React.createElement('input', {
            type: 'text',
            value: answer,
            onChange: (e) => setAnswer(e.target.value),
            className: 'w-full border rounded p-2',
            required: true,
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Explanation (optional)'),
          React.createElement('textarea', {
            value: explanation,
            onChange: (e) => setExplanation(e.target.value),
            className: 'w-full border rounded p-2',
            rows: 2,
            placeholder: 'Provide an explanation for the correct answer…',
          })
        ),
        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'submit',
            disabled: saving,
            className: 'bg-green-600 text-white px-4 py-2 rounded',
          }, saving ? 'Saving…' : 'Save'),
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'bg-gray-200 text-gray-700 px-4 py-2 rounded',
          }, 'Cancel')
        )
      )
    )
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
  if (loading) return React.createElement('div', { className: 'p-4' }, 'Loading exams…');
  return (
    React.createElement('div', { className: 'space-y-4' },
      React.createElement('button', {
        onClick: () => { setShowForm(true); setEditExam(null); },
        className: 'bg-primary text-white px-3 py-2 rounded',
      }, 'Add Exam'),
      showForm && React.createElement(ExamForm, {
        initial: editExam,
        onClose: () => { setShowForm(false); setEditExam(null); },
        onSave: handleSave,
        availableQuestions: questions,
      }),
      React.createElement('table', { className: 'w-full table-auto border-collapse' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'border px-2 py-1' }, 'Title'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Mode'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Actions')
          )
        ),
        React.createElement('tbody', null,
          exams.map((ex) => (
            React.createElement('tr', { key: ex.id },
              React.createElement('td', { className: 'border px-2 py-1' }, ex.title || 'Untitled'),
              React.createElement('td', { className: 'border px-2 py-1' }, ex.questionIds ? 'Fixed' : 'Random'),
              React.createElement('td', { className: 'border px-2 py-1 space-x-2' },
                React.createElement('button', {
                  onClick: () => { setEditExam(ex); setShowForm(true); },
                  className: 'text-blue-600 underline',
                }, 'Edit'),
                React.createElement('button', {
                  onClick: () => handleDelete(ex.id),
                  className: 'text-red-600 underline',
                }, 'Delete')
              )
            )
          ))
        )
      )
    )
  );
}

function ExamForm({ initial, onClose, onSave, availableQuestions }) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [mode, setMode] = useState(initial?.questionIds ? 'fixed' : 'random');
  const [selectedIds, setSelectedIds] = useState(initial?.questionIds || []);
  const [randomCount, setRandomCount] = useState(initial?.randomCount || 5);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        title,
        description,
      };
      if (mode === 'fixed') {
        data.questionIds = selectedIds;
        data.randomCount = null;
      } else {
        data.randomCount = Number(randomCount);
        data.questionIds = null;
      }
      let newDoc;
      if (isEdit) {
        const ref = doc(db, 'exams', initial.id);
        await updateDoc(ref, data);
        newDoc = { id: initial.id, ...data };
      } else {
        const ref = await addDoc(collection(db, 'exams'), data);
        newDoc = { id: ref.id, ...data };
      }
      onSave(isEdit ? initial.id : null, newDoc);
    } catch (err) {
      console.error('Failed to save exam', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = (qid) => {
    setSelectedIds((prev) => prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]);
  };

  return (
    React.createElement('div', { className: 'bg-white border rounded p-4 my-4' },
      React.createElement('h2', { className: 'text-xl font-medium mb-2' }, isEdit ? 'Edit Exam' : 'New Exam'),
      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Title'),
          React.createElement('input', {
            type: 'text',
            value: title,
            onChange: (e) => setTitle(e.target.value),
            className: 'w-full border rounded p-2',
            required: true,
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Description'),
          React.createElement('textarea', {
            value: description,
            onChange: (e) => setDescription(e.target.value),
            className: 'w-full border rounded p-2',
            rows: 2,
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Mode'),
          React.createElement('select', {
            value: mode,
            onChange: (e) => setMode(e.target.value),
            className: 'w-full border rounded p-2',
          },
            React.createElement('option', { value: 'fixed' }, 'Fixed questions'),
            React.createElement('option', { value: 'random' }, 'Random questions')
          )
        ),
        mode === 'fixed' && React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium mb-1' }, 'Select questions'),
          React.createElement('div', { className: 'max-h-60 overflow-y-auto border rounded p-2' },
            availableQuestions.map((q) => (
              React.createElement('label', { key: q.id, className: 'flex items-center space-x-2 mb-1' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: selectedIds.includes(q.id),
                  onChange: () => toggleQuestion(q.id),
                }),
                React.createElement('span', null, q.text)
              )
            ))
          )
        ),
        mode === 'random' && React.createElement('div', null,
          React.createElement('label', { className: 'block font-medium' }, 'Number of random questions'),
          React.createElement('input', {
            type: 'number',
            value: randomCount,
            onChange: (e) => setRandomCount(e.target.value),
            className: 'w-full border rounded p-2',
            min: 1,
            required: true,
          })
        ),
        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'submit',
            disabled: saving,
            className: 'bg-green-600 text-white px-4 py-2 rounded',
          }, saving ? 'Saving…' : 'Save'),
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'bg-gray-200 text-gray-700 px-4 py-2 rounded',
          }, 'Cancel')
        )
      )
    )
  );
}

function ViewProgress() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [examsMap, setExamsMap] = useState({});
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch attempts
        const snap = await getDocs(collection(db, 'attempts'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAttempts(list);
        // Fetch users and exams for mapping
        const userSnap = await getDocs(collection(db, 'users'));
        const uMap = {};
        userSnap.docs.forEach((d) => { uMap[d.id] = d.data(); });
        setUsersMap(uMap);
        const examSnap = await getDocs(collection(db, 'exams'));
        const eMap = {};
        examSnap.docs.forEach((d) => { eMap[d.id] = d.data(); });
        setExamsMap(eMap);
      } catch (err) {
        console.error('Failed to load progress data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  if (loading) return React.createElement('div', { className: 'p-4' }, 'Loading progress…');
  return (
    React.createElement('div', null,
      React.createElement('h2', { className: 'text-xl font-medium mb-2' }, 'Student Progress'),
      React.createElement('table', { className: 'w-full table-auto border-collapse text-sm' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { className: 'border px-2 py-1' }, 'Student'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Exam'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Score'),
            React.createElement('th', { className: 'border px-2 py-1' }, 'Date')
          )
        ),
        React.createElement('tbody', null,
          attempts.map((at) => (
            React.createElement('tr', { key: at.id },
              React.createElement('td', { className: 'border px-2 py-1' }, usersMap[at.userId]?.name || usersMap[at.userId]?.email || at.userId),
              React.createElement('td', { className: 'border px-2 py-1' }, examsMap[at.examId]?.title || at.examId),
              React.createElement('td', { className: 'border px-2 py-1 text-center' }, at.score + '%'),
              React.createElement('td', { className: 'border px-2 py-1' }, new Date(at.timestamp).toLocaleString())
            )
          ))
        )
      )
    )
  );
}

/* global React */

// This component renders a single question of any supported type and
// provides a UI for the user to answer.  It delegates the state back
// upward via the `onAnswer` callback.  For multi‑choice and
// true/false questions the answer is a scalar; for drag and drop
// matching questions the answer is an array representing the order
// chosen by the user.

const { useState, useEffect } = React;

function MCQQuestion({ question, answer, onAnswer }) {
  return (
    React.createElement('div', null,
      question.options.map((opt, idx) => (
        React.createElement('label', { key: idx, className: 'block my-2 p-2 border rounded hover:bg-gray-100 cursor-pointer' },
          React.createElement('input', {
            type: 'radio',
            name: `q${question.id}`,
            className: 'mr-2',
            checked: String(answer) === String(idx),
            onChange: () => onAnswer(idx),
          }),
          opt
        )
      ))
    )
  );
}

function TrueFalseQuestion({ question, answer, onAnswer }) {
  return (
    React.createElement('div', { className: 'flex space-x-4' },
      ['True', 'False'].map((label, idx) => (
        React.createElement('button', {
          key: label,
          className: `${answer === (idx === 0) ? 'bg-primary text-white' : 'bg-gray-200'} px-4 py-2 rounded`,
          onClick: () => onAnswer(idx === 0),
        }, label)
      ))
    )
  );
}

function ShortAnswerQuestion({ question, answer, onAnswer }) {
  return (
    React.createElement('input', {
      type: 'text',
      value: answer || '',
      onChange: (e) => onAnswer(e.target.value),
      className: 'w-full border rounded p-2',
      placeholder: 'Type your answer…',
    })
  );
}

function DragMatchQuestion({ question, answer, onAnswer }) {
  // Use local state to hold the slots; initial value comes from answer prop
  const initSlots = () => {
    if (Array.isArray(answer) && answer.length === question.options.length) {
      return answer;
    }
    return new Array(question.options.length).fill(null);
  };
  const [slots, setSlots] = useState(initSlots);

  useEffect(() => {
    onAnswer(slots);
  }, [slots]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const item = e.dataTransfer.getData('text/plain');
    const newSlots = slots.slice();
    newSlots[index] = item;
    setSlots(newSlots);
  };

  return (
    React.createElement('div', { className: 'flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8' },
      // Draggable items
      React.createElement('div', { className: 'flex flex-col space-y-2' },
        question.options.map((item, idx) => (
          React.createElement('div', {
            key: idx,
            draggable: true,
            onDragStart: (e) => handleDragStart(e, item),
            className: 'p-2 border rounded bg-gray-100 cursor-grab text-center',
          }, item)
        ))
      ),
      // Drop zones
      React.createElement('div', { className: 'flex flex-col space-y-2' },
        slots.map((slot, idx) => (
          React.createElement('div', {
            key: idx,
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => handleDrop(e, idx),
            className: 'p-2 border rounded min-h-[40px] min-w-[120px] bg-white text-center',
          }, slot || React.createElement('span', { className: 'text-gray-400' }, 'Drop here'))
        ))
      )
    )
  );
}

/**
 * Main question renderer.  Delegates to the correct component based on type.
 */
export default function QuestionRenderer({ question, answer, onAnswer }) {
  return React.createElement('div', { className: 'space-y-4' },
    React.createElement('h2', { className: 'text-lg font-medium' }, question.text),
    (function () {
      switch (question.type) {
        case 'mcq':
          return React.createElement(MCQQuestion, { question, answer, onAnswer });
        case 'truefalse':
          return React.createElement(TrueFalseQuestion, { question, answer, onAnswer });
        case 'short':
          return React.createElement(ShortAnswerQuestion, { question, answer, onAnswer });
        case 'drag':
          return React.createElement(DragMatchQuestion, { question, answer, onAnswer });
        default:
          return React.createElement('div', null, 'Unsupported question type');
      }
    })()
  );
}

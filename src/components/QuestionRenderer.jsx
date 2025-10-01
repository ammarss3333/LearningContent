import React, { useState, useEffect } from 'react';

/**
 * This component renders a multiple choice question.  It displays each option
 * with a radio button and calls `onAnswer` when the user selects an option.
 */
function MCQQuestion({ question, answer, onAnswer }) {
  return (
    <div>
      {question.options.map((opt, idx) => (
        <label
          key={idx}
          className="block my-2 p-2 border rounded hover:bg-gray-100 cursor-pointer"
        >
          <input
            type="radio"
            name={`q${question.id}`}
            className="mr-2"
            checked={String(answer) === String(idx)}
            onChange={() => onAnswer(idx)}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

/**
 * Renders a True/False question.  Provides buttons for True and False and
 * highlights the selected answer.
 */
function TrueFalseQuestion({ question, answer, onAnswer }) {
  return (
    <div className="flex space-x-4">
      {['True', 'False'].map((label, idx) => (
        <button
          key={label}
          className={`${answer === (idx === 0) ? 'bg-primary text-white' : 'bg-gray-200'} px-4 py-2 rounded`}
          onClick={() => onAnswer(idx === 0)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Renders a short answer question with a text input.
 */
function ShortAnswerQuestion({ question, answer, onAnswer }) {
  return (
    <input
      type="text"
      value={answer || ''}
      onChange={(e) => onAnswer(e.target.value)}
      className="w-full border rounded p-2"
      placeholder="Type your answer…"
    />
  );
}

/**
 * Renders a drag and drop matching question.  Users drag items to the
 * drop zones to indicate the correct order.  Local state holds the slot
 * values; when the slots change the `onAnswer` callback is invoked.
 */
function DragMatchQuestion({ question, answer, onAnswer }) {
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
    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
      {/* Draggable items */}
      <div className="flex flex-col space-y-2">
        {question.options.map((item, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            className="p-2 border rounded bg-gray-100 cursor-grab text-center"
          >
            {item}
          </div>
        ))}
      </div>
      {/* Drop zones */}
      <div className="flex flex-col space-y-2">
        {slots.map((slot, idx) => (
          <div
            key={idx}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, idx)}
            className="p-2 border rounded min-h-[40px] min-w-[120px] bg-white text-center"
          >
            {slot || <span className="text-gray-400">Drop here</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main question renderer.  Delegates to the correct subcomponent based on
 * question type.
 */
export default function QuestionRenderer({ question, answer, onAnswer }) {
  let content;
  switch (question.type) {
    case 'mcq':
      content = <MCQQuestion question={question} answer={answer} onAnswer={onAnswer} />;
      break;
    case 'truefalse':
      content = <TrueFalseQuestion question={question} answer={answer} onAnswer={onAnswer} />;
      break;
    case 'short':
      content = <ShortAnswerQuestion question={question} answer={answer} onAnswer={onAnswer} />;
      break;
    case 'drag':
      content = <DragMatchQuestion question={question} answer={answer} onAnswer={onAnswer} />;
      break;
    default:
      content = <div>Unsupported question type</div>;
  }
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{question.text}</h2>
      {content}
    </div>
  );
}
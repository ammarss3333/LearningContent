import React from 'react';

/**
 * A simple progress bar component to show exam progress.  Accepts a
 * percentage (0–100) and renders a coloured bar accordingly.
 *
 * @param {object} props
 * @param {number} props.value The progress percentage
 */
export default function ProgressBar({ value }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="w-full bg-gray-200 rounded">
      <div
        className="bg-primary text-xs leading-none py-1 text-center text-white rounded"
        style={{ width: `${clamped}%` }}
      >
        {Math.round(clamped)}%
      </div>
    </div>
  );
}
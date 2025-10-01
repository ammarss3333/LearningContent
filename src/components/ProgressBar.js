/* global React */

// A simple progress bar component to show exam progress.  Accepts a
// percentage (0–100) and renders a coloured bar accordingly.

export default function ProgressBar({ value }) {
  return (
    React.createElement('div', { className: 'w-full bg-gray-200 rounded' },
      React.createElement('div', {
        className: 'bg-primary text-xs leading-none py-1 text-center text-white rounded',
        style: { width: `${Math.min(Math.max(value, 0), 100)}%` },
      }, `${Math.round(value)}%`)
    )
  );
}

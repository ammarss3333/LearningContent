// Utility functions used across the exam platform

/**
 * Simple Fisher–Yates shuffle for arrays.
 * @param {Array<any>} arr
 * @returns {Array<any>} A new shuffled array.
 */
export function shuffle(arr) {
  const res = arr.slice();
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

/**
 * Evaluates a single question given the user’s answer.  The question object
 * should include a `type` field and an `answer` field describing the correct
 * response.  Depending on the question type, the shape of the `answer`
 * may differ:
 *
 * * `mcq` – `answer` holds the 0‑based index of the correct option.
 * * `truefalse` – `answer` is a boolean.
 * * `short` – `answer` is a string (case insensitive comparison).
 * * `drag` – `answer` is an array describing the correct order of items.
 *
 * @param {Object} question
 * @param {any} userAnswer
 * @returns {boolean} True if the answer is correct, false otherwise.
 */
export function evaluateQuestion(question, userAnswer) {
  switch (question.type) {
    case 'mcq':
      return String(userAnswer) === String(question.answer);
    case 'truefalse':
      return Boolean(userAnswer) === Boolean(question.answer);
    case 'short':
      if (typeof userAnswer !== 'string') return false;
      return (
        userAnswer.trim().toLowerCase() ===
        String(question.answer).trim().toLowerCase()
      );
    case 'drag':
      // Compare arrays element‑wise
      if (!Array.isArray(userAnswer) || !Array.isArray(question.answer)) return false;
      if (userAnswer.length !== question.answer.length) return false;
      for (let i = 0; i < userAnswer.length; i++) {
        if (String(userAnswer[i]) !== String(question.answer[i])) return false;
      }
      return true;
    default:
      return false;
  }
}

/**
 * Calculates the total score of an exam attempt.  The score is the
 * percentage of correct answers (0–100).  Unanswered questions count as
 * incorrect.
 * @param {Array<Object>} questions
 * @param {Array<any>} answers
 * @returns {number} A score between 0 and 100.
 */
export function calculateScore(questions, answers) {
  const total = questions.length;
  let correct = 0;
  questions.forEach((q, idx) => {
    if (evaluateQuestion(q, answers[idx])) {
      correct++;
    }
  });
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/**
 * Determines which badges should be awarded for a given score and attempt
 * history.  New badges are returned; existing badges should not be
 * duplicated.
 * @param {number} score The percentage score for the attempt
 * @param {Array<string>} currentBadges The user’s existing badges
 * @param {number} attemptsCount How many exams the user has completed before this one
 * @returns {Array<string>} A list of badge identifiers to add
 */
export function determineBadges(score, currentBadges, attemptsCount) {
  const newBadges = [];
  if (!currentBadges.includes('first_attempt') && attemptsCount === 0) {
    newBadges.push('first_attempt');
  }
  if (!currentBadges.includes('high_score') && score >= 80) {
    newBadges.push('high_score');
  }
  // Additional badge criteria can be added here
  return newBadges;
}
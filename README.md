# Student Exam Platform

This project is a full‑featured examination and homework platform built to run entirely from static hosting (for example, on GitHub Pages) while relying on Firebase for back‑end services such as authentication and data storage.  The goal of this repository is to provide a ready‑to‑deploy implementation that can be extended to your needs without requiring any server infrastructure.

## Features

The platform implements two distinct roles – **students** and **administrators** – each with its own set of capabilities:

### Student

* Sign in using a Google account (powered by Firebase Authentication).
* Browse all available exams and homework assignments.
* Take exams composed of multiple choice (MCQ), true/false, drag‑and‑drop matching, and short answer questions.
* Visual progress bar and optional timer during an exam.
* Receive detailed feedback upon submission, including a score, explanations and any badges earned.
* Track progress across multiple attempts – scores and histories are stored in Firestore.
* Earn gamified badges for milestones (e.g. completing your first exam or achieving a high score).
* View a global leaderboard of top scorers.

### Administrator

* Restricted access to an admin panel (checked via a flag stored in the user’s Firestore profile).
* Create, edit and delete questions through a friendly web form – no need to edit JSON by hand.
* Organize exams by choosing a fixed set of question IDs or specify a random draw from the question pool.
* Upload or download JSON files containing complete question sets.
* Monitor student scores and attempt histories.

### Hosting and deployment

* The entire front‑end runs as a static web app and can be hosted for free on GitHub Pages.
* Firebase (free tier) handles authentication (Google login) and persistent storage via Firestore.
* A sample GitHub Actions workflow is included to automatically build and deploy the `docs/` directory to GitHub Pages whenever you push changes.

## Getting started

1. **Fork or clone this repository** into your own GitHub account.
2. **Create a Firebase project** at <https://console.firebase.google.com/>.  Under Project Settings ▶ **General**, locate your app configuration (the API key, project ID and other identifiers).  Paste these values into `src/firebaseConfig.js`.  See that file for instructions.
3. **Enable Google authentication** for your Firebase project under `Authentication ▶ Sign‑in method`.  Only Google sign‑in is used here.
4. **Create your Firestore database** in *production* or *test* mode.  Two collections will be created automatically the first time you run the app: `users` and `exams`.
5. **Assign admin users** by setting the `isAdmin` flag in the Firestore `users` collection.  This can be done manually from the Firebase console: after the user logs in at least once, edit their document and add a boolean field `isAdmin` set to `true`.  Without this flag they will only see the student interface.
6. **Optional – prepopulate questions**.  A sample set of questions is provided in `sample_questions.json`.  You can import these into Firestore via the admin panel’s upload feature once you have at least one admin user.
7. **Deploy** to GitHub Pages.  Create a new branch called `gh-pages` (if it doesn’t already exist) and enable GitHub Pages to serve from that branch.  Push your code to the `main` branch.  The included workflow will build the app into `docs/` and push it to the `gh-pages` branch automatically.  See `.github/workflows/deploy.yml` for details.

## Project structure

```text
exam-platform/
├── docs/           # compiled static site (target of build)
├── sample_questions.json
├── src/
│   ├── App.js      # root React component and routing
│   ├── components/ # reusable React components (question renderers, badges, etc.)
│   ├── firebaseConfig.js
│   ├── pages/      # individual pages for students and admins
│   └── utils.js    # helper functions
├── index.html      # HTML entry point, loads scripts from CDN
├── .github/workflows/deploy.yml
└── README.md       # this file
```

## Limitations and future work

* The platform uses Firebase client SDKs loaded from a CDN.  When running from GitHub Pages or a modern browser with internet access this works out of the box; however, in offline or restricted environments you may need to host these scripts yourself.
* Badge logic is intentionally simple (first exam completed, high score).  Feel free to extend the set of badges or make them dynamic via Firestore configuration.
* Randomly generated exams choose questions at random from the entire question bank.  In a real deployment you might wish to add categories, difficulty levels, or more sophisticated selection criteria.
* The drag‑and‑drop matching question uses native HTML 5 drag and drop APIs to avoid bundling a large library.  You can swap it out with your favourite library (e.g. [react‑beautiful‑dnd]) if desired.

## License

This repository is provided as sample code with no warranty.  You are free to modify and redistribute it under the terms of the MIT license.  See `LICENSE` for details.

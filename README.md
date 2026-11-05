# AI Role Interview Coach

A Vite app with a chatbot that helps you prepare for interviews for these AI roles:

1. **AI Project Manager**
2. **Forward Deployed Manager**
3. **AI Research**

It runs on **OpenAI** (`gpt-5-mini` by default). The page uses a blue and neon gradient with a moving grid background. Each role has its own color theme, and the chat changes color smoothly when you switch roles.

## Features
- **Enter your own API key** before you start. The key stays in your browser. You can choose to save it to `localStorage`, and it is sent only to `api.openai.com`.
- **3 modes** for each role:
  - **Coach (Q&A)**: ask anything about the role and its interviews.
  - **Mock interview**: type `start` and you get one question at a time, with a score and feedback after each answer.
  - **Answer review**: paste a question and your answer, and get a critique plus a stronger rewrite.
- Replies stream in as they are written and are shown as Markdown.
- Each role keeps its own conversation, has suggested prompts, and has a Stop button.
- The model can be changed in the API key dialog.

## Getting started
```bash
npm install
npm run dev
```
Open the URL Vite prints, then paste an OpenAI API key from https://platform.openai.com/api-keys.

To build for production:
```bash
npm run build && npm run preview
```

## Project structure
- `index.html`: page layout and the API key dialog
- `src/main.js`: UI state, role switching, chat flow
- `src/openai.js`: OpenAI Chat Completions client with streaming
- `src/roles.js`: role content, color themes, system prompts
- `src/style.css`: neon/grid styling and role color transitions

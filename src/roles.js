// Role definitions: content for the coach plus the colour theme for each role.
// Colours stay in the blue/neon family so switching roles is a subtle shift.

export const ROLES = {
  aipm: {
    id: 'aipm',
    label: 'AI Project Manager',
    short: 'AI PM',
    blurb:
      'Delivery of AI/ML projects: scoping, roadmaps, stakeholder management, risk, evaluation metrics and responsible AI.',
    theme: {
      accent: '#3b82f6', // electric blue
      accent2: '#22d3ee', // cyan
      glow: 'rgba(59, 130, 246, 0.45)',
      botBubble: 'rgba(30, 58, 138, 0.35)',
      border: 'rgba(96, 165, 250, 0.35)',
    },
    focus: [
      'Scoping AI projects and defining success metrics (business KPIs vs. model metrics)',
      'Managing data dependencies, labeling, and model iteration cycles',
      'Agile/hybrid delivery for experimental, uncertain ML work',
      'Stakeholder communication, expectation setting, and change management',
      'Risk management: bias, privacy, safety, compliance (e.g. EU AI Act), vendor/LLM risk',
      'Build vs. buy decisions, cost estimation, and LLM token/infra budgeting',
      'Evaluation, launch readiness, monitoring, and post-launch iteration',
    ],
    suggestions: [
      'Give me 5 common AI Project Manager interview questions',
      'How do I explain the difference between model accuracy and business impact?',
      'Walk me through managing an LLM project that is behind schedule',
      'What metrics would you track after launching a GenAI chatbot?',
    ],
  },
  fde: {
    id: 'fde',
    label: 'Forward Deployed Manager',
    short: 'FDE Mgr',
    blurb:
      'Customer-facing technical leadership: deploying AI into customer environments, solution design, and leading forward-deployed engineers.',
    theme: {
      accent: '#8b5cf6', // violet-blue
      accent2: '#38bdf8', // sky
      glow: 'rgba(139, 92, 246, 0.45)',
      botBubble: 'rgba(67, 56, 202, 0.32)',
      border: 'rgba(167, 139, 250, 0.38)',
    },
    focus: [
      'Leading forward-deployed engineering teams embedded with customers',
      'Discovery: turning ambiguous customer problems into deployable AI solutions',
      'Solution architecture: RAG, agents, integrations, data pipelines, security reviews',
      'Handling escalations, tough customers, and shifting requirements',
      'Balancing custom customer work vs. feeding insights back to core product',
      'Scoping pilots/POCs, defining success criteria, and converting to production',
      'Hiring, coaching, and managing engineers in a high-autonomy field role',
    ],
    suggestions: [
      'What does a Forward Deployed Manager actually do day-to-day?',
      'Ask me a customer-escalation scenario question',
      'How would you scope a 6-week GenAI pilot for an enterprise bank?',
      'How do I answer "custom work vs. product roadmap" trade-off questions?',
    ],
  },
  research: {
    id: 'research',
    label: 'AI Research',
    short: 'Research',
    blurb:
      'Research scientist / engineer interviews: ML fundamentals, deep learning, LLMs, experiment design, paper discussion and coding.',
    theme: {
      accent: '#06b6d4', // neon cyan
      accent2: '#34d399', // neon mint
      glow: 'rgba(6, 182, 212, 0.45)',
      botBubble: 'rgba(14, 116, 144, 0.30)',
      border: 'rgba(34, 211, 238, 0.38)',
    },
    focus: [
      'ML fundamentals: bias/variance, optimization, regularization, probability',
      'Deep learning & transformers: attention, scaling laws, training dynamics',
      'LLMs: pretraining, fine-tuning, RLHF/RLAIF, evaluation, interpretability',
      'Experiment design, ablations, statistical rigor, and reproducibility',
      'Reading and critiquing papers; presenting your own research',
      'Research coding: implementing models from scratch, debugging training runs',
      'Research taste: choosing problems and articulating a research agenda',
    ],
    suggestions: [
      'Explain self-attention as if I were in a research interview',
      'Quiz me on 5 ML fundamentals questions, one at a time',
      'How should I present my past research project in 5 minutes?',
      'What makes a good ablation study?',
    ],
  },
};

export const MODES = {
  coach: `MODE: COACH. Answer the candidate's questions clearly and practically. Give concrete example answers, frameworks (e.g. STAR), and tips on what interviewers look for. Keep answers focused and well structured with short headings or bullets.`,
  mock: `MODE: MOCK INTERVIEW. Act as a realistic interviewer for this role. Ask ONE question at a time and wait for the candidate's answer. After each answer give brief feedback (strengths, gaps, a score out of 10) and then ask the next question. Mix behavioral, situational, and technical questions, gradually increasing difficulty. If the candidate says "start", introduce yourself briefly and ask the first question. If they say "stop" or "end", give an overall summary with scores and top 3 improvement areas.`,
  feedback: `MODE: ANSWER REVIEW. The candidate will paste an interview question and their answer. Critique it: what works, what's missing, how an interviewer would perceive it, a score out of 10, and a rewritten stronger version of the answer.`,
};

export function buildSystemPrompt(role, mode) {
  return [
    `You are an expert interview coach helping candidates prepare for the role of **${role.label}**.`,
    `Role context: ${role.blurb}`,
    `Key areas interviewers assess for this role:\n- ${role.focus.join('\n- ')}`,
    MODES[mode] || MODES.coach,
    `General rules: be encouraging but honest; tailor depth to the candidate's stated experience; use Markdown formatting; keep responses concise unless asked for depth; stay on the topic of career and interview preparation for this role.`,
  ].join('\n\n');
}

export type WritingDimension = {
  key: string;
  name: string;
  zhName: string;
  level: string;
  score: number;
  note: string;
};

export type HighlightSentence = {
  text: string;
  reason: string;
  relatedDimension: string;
};

export type RevisionSuggestion = {
  priority: number;
  target: string;
  suggestion: string;
  prompt: string;
};

export type NextExercise = {
  title: string;
  instruction: string;
  minutes: number;
  difficulty: string;
};

export type MockReport = {
  title: string;
  overall: string;
  focus: string;
  strongest: WritingDimension;
  weakest: WritingDimension;
  dimensions: WritingDimension[];
  highlightSentences: HighlightSentence[];
  revisionSuggestions: RevisionSuggestion[];
  nextExercises: NextExercise[];
};

export function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function createMockReport({ title, draft }: { title: string; draft: string }): MockReport {
  const wordCount = getWordCount(draft);
  const hasBecause = /\bbecause\b/i.test(draft);
  const hasTransition = /\b(first|then|after|finally|next)\b/i.test(draft);
  const sentenceCount = draft.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean).length;
  const hasFeeling = /\b(excited|happy|nervous|proud|sad|worried|surprised|felt|feel)\b/i.test(draft);
  const hasSpecificNoun = /\b(museum|book|scientist|planet|machine|friend|class|experiment)\b/i.test(draft);
  const hasMechanicsIssue = /\bi\b/.test(draft) || /\s+[,.!?]/.test(draft);

  const dimensions: WritingDimension[] = [
    {
      key: "ideas",
      name: "Ideas",
      zhName: "Ideas",
      level: wordCount >= 55 || hasFeeling ? "Strong" : "Developing",
      score: wordCount >= 55 || hasFeeling ? 4 : 3,
      note:
        wordCount >= 55 || hasFeeling
          ? "Your main idea is clear and includes a personal detail."
          : "Your idea is starting to show. Add one more detail so the reader understands more.",
    },
    {
      key: "organization",
      name: "Organization",
      zhName: "Organization",
      level: hasTransition ? "Strong" : "Developing",
      score: hasTransition ? 4 : 3,
      note: hasTransition
        ? "The sequence is easy to follow because you use transition words."
        : "Try adding first, then, after, or finally to show the order.",
    },
    {
      key: "vocabulary",
      name: "Vocabulary",
      zhName: "Vocabulary",
      level: hasSpecificNoun ? "Developing" : "Practice",
      score: hasSpecificNoun ? 3 : 2,
      note: hasSpecificNoun
        ? "You use some specific words. Try one stronger verb or adjective next."
        : "Add more specific nouns, verbs, or adjectives to make the writing clearer.",
    },
    {
      key: "grammar",
      name: "Grammar",
      zhName: "Grammar",
      level: sentenceCount >= 3 ? "Developing" : "Practice",
      score: sentenceCount >= 3 ? 3 : 2,
      note: "Most meaning is understandable. Check verb tense and make sure each sentence is complete.",
    },
    {
      key: "sentence_fluency",
      name: "Sentence Fluency",
      zhName: "Sentence Fluency",
      level: hasBecause ? "Developing" : "Focus",
      score: hasBecause ? 3 : 2,
      note: hasBecause
        ? "You used because to connect an idea. Try varying one more sentence."
        : "Try combining two short sentences with because, when, or after.",
    },
    {
      key: "mechanics",
      name: "Mechanics",
      zhName: "Mechanics",
      level: hasMechanicsIssue ? "Practice" : "Developing",
      score: hasMechanicsIssue ? 2 : 3,
      note: hasMechanicsIssue
        ? "Check capitalization and punctuation before submitting."
        : "Capitalization and punctuation look mostly ready for a draft.",
    },
  ];

  const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const firstSentence = draft.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean)[0] ?? "";

  return {
    title,
    overall:
      wordCount < 40
        ? "You have a clear start. Next, add more details so the reader can understand the full story."
        : "You explained your idea clearly. Next, try adding more sentence variety and one stronger detail.",
    focus: weakest.name,
    strongest,
    weakest,
    dimensions,
    highlightSentences: firstSentence
      ? [
          {
            text: firstSentence,
            reason: "This sentence gives the reader a clear starting point.",
            relatedDimension: strongest.name,
          },
        ]
      : [],
    revisionSuggestions: [
      {
        priority: 1,
        target: weakest.name,
        suggestion: weakest.note,
        prompt: "Choose one sentence and improve only this skill. Keep the idea in your own words.",
      },
    ],
    nextExercises: [
      {
        title: `Practice ${weakest.name}`,
        instruction: "Revise one sentence from your draft using today's focus skill.",
        minutes: 8,
        difficulty: "easy",
      },
    ],
  };
}

export function createParentSummary(report: MockReport) {
  return {
    main: `This writing is strongest in ${report.strongest.name}. The next best practice focus is ${report.weakest.name}.`,
    support:
      "Support the student by asking them to explain their idea in English, then revise one small part in their own words. Please do not rewrite the full essay for them.",
  };
}

export function suggestRevision(text: string) {
  if (!/\bbecause\b/i.test(text)) {
    return `${text.trim()} I want to add one reason because it helps the reader understand my idea.`;
  }

  return text.replace(
    /It was a day I will remember\./i,
    "It was a day I will remember because I learned something new and felt proud of myself.",
  );
}

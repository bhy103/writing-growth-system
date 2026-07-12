export type WritingDimension = {
  key: string;
  name: string;
  zhName: string;
  level: string;
  score: number;
  note: string;
};

export type MockReport = {
  title: string;
  overall: string;
  focus: string;
  strongest: WritingDimension;
  weakest: WritingDimension;
  dimensions: WritingDimension[];
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
      zhName: "内容想法",
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
      zhName: "结构组织",
      level: hasTransition ? "Strong" : "Developing",
      score: hasTransition ? 4 : 3,
      note: hasTransition
        ? "The sequence is easy to follow because you use transition words."
        : "Try adding first, then, after, or finally to show the order.",
    },
    {
      key: "vocabulary",
      name: "Vocabulary",
      zhName: "词汇选择",
      level: hasSpecificNoun ? "Developing" : "Practice",
      score: hasSpecificNoun ? 3 : 2,
      note: hasSpecificNoun
        ? "You use some specific words. Try one stronger verb or adjective next."
        : "Add more specific nouns, verbs, or adjectives to make the writing clearer.",
    },
    {
      key: "grammar",
      name: "Grammar",
      zhName: "语法准确性",
      level: sentenceCount >= 3 ? "Developing" : "Practice",
      score: sentenceCount >= 3 ? 3 : 2,
      note: "Most meaning is understandable. Check verb tense and make sure each sentence is complete.",
    },
    {
      key: "sentence_fluency",
      name: "Sentence Fluency",
      zhName: "句子流畅度",
      level: hasBecause ? "Developing" : "Focus",
      score: hasBecause ? 3 : 2,
      note: hasBecause
        ? "You used because to connect an idea. Try varying one more sentence."
        : "Try combining two short sentences with because, when, or after.",
    },
    {
      key: "mechanics",
      name: "Mechanics",
      zhName: "书写规范",
      level: hasMechanicsIssue ? "Practice" : "Developing",
      score: hasMechanicsIssue ? 2 : 3,
      note: hasMechanicsIssue
        ? "Check capitalization and punctuation before submitting."
        : "Capitalization and punctuation look mostly ready for a draft.",
    },
  ];

  const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];

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
  };
}

export function createParentSummary(report: MockReport) {
  return {
    main: `孩子这篇英文作文在 ${report.strongest.name}（${report.strongest.zhName}）方面表现相对更好。下一步建议重点练习 ${report.weakest.name}（${report.weakest.zhName}）。`,
    support:
      "家长可以先用中文理解方向，但陪伴时尽量让孩子用英文说和写。请不要直接替孩子重写整篇作文。",
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

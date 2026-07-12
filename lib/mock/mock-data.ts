export const initialDraft = {
  title: "A Memorable Day",
  content:
    "Last Friday, my class went to the science museum. I felt excited because I wanted to see the space room. First, we watched a short movie about planets. Then my friend and I tried a machine that showed how astronauts move. I was nervous, but I also felt happy. It was a day I will remember.",
};

export const sampleExtractedText = {
  photo:
    "Last Friday, my class went to the science museum. I felt excited because I wanted to see the space room. First, we watched a short movie about planets. Then my friend and I tried a machine that showed how astronauts move.",
  image:
    "My favorite book is Charlotte's Web. I like this book because the story is kind and sad. The characters help each other, and I learned that friendship is important.",
  document:
    "I want to become a scientist when I grow up. Scientists ask questions and try to find answers. I like doing experiments because I can learn how the world works.",
};

export const extractionMeta = {
  photo: { confidence: "72%", state: "Low confidence · review carefully" },
  image: { confidence: "88%", state: "Needs review" },
  document: { confidence: "96%", state: "Ready to confirm" },
};

export const initialHistory = [
  {
    title: "A Memorable Day",
    status: "Analyzed",
    focus: "Sentence Fluency",
  },
  {
    title: "My Favorite Book",
    status: "Draft",
    focus: "Ideas",
  },
];

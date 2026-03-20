export type FindType =
  | "movie"
  | "book"
  | "reel"
  | "poetry"
  | "article"
  | "music"
  | "image"
  | "other";

export interface Find {
  id: string;
  title: string;
  type: FindType;
  note: string;
  sourceUrl?: string;
  imageUrl?: string;
  dateAdded: string;
  author?: string;
  excerpt?: string;
}

export const finds: Find[] = [
  {
    id: "1",
    title: "Paterson",
    type: "movie",
    note: "A quiet film about a bus driver who writes poetry. It reminded me that art lives in the ordinary.",
    sourceUrl: "https://www.imdb.com/title/tt5247022/",
    imageUrl: "https://m.media-amazon.com/images/M/MV5BMTUzNDkzMDAzOF5BMl5BanBnXkFtZTgwMTQ4MTMwMTI@._V1_.jpg",
    dateAdded: "2026-03-15",
  },
  {
    id: "2",
    title: "When Breath Becomes Air",
    type: "book",
    note: "Paul Kalanithi's memoir on mortality. Changed how I think about time.",
    author: "Paul Kalanithi",
    dateAdded: "2026-02-20",
  },
  {
    id: "3",
    title: "The Summer Day",
    type: "poetry",
    note: "The last two lines live rent-free in my head.",
    author: "Mary Oliver",
    excerpt: "Tell me, what is it you plan to do\nwith your one wild and precious life?",
    dateAdded: "2026-03-01",
  },
  {
    id: "4",
    title: "A Message From the Future",
    type: "reel",
    note: "Beautifully illustrated short about the Green New Deal. Art meets activism.",
    sourceUrl: "https://www.youtube.com/watch?v=d9uTH0iGdc0",
    imageUrl: "https://img.youtube.com/vi/d9uTH0iGdc0/hqdefault.jpg",
    dateAdded: "2026-01-10",
  },
  {
    id: "5",
    title: "The Expanding Dark Forest and Generative AI",
    type: "article",
    note: "Maggie Appleton's essay on how AI changes the web. Prescient and beautifully written.",
    author: "Maggie Appleton",
    sourceUrl: "https://maggieappleton.com/ai-dark-forest",
    dateAdded: "2026-02-05",
  },
  {
    id: "6",
    title: "Nattoppet",
    type: "music",
    note: "Ambient Swedish piece that feels like a late-night walk in winter.",
    sourceUrl: "https://open.spotify.com/track/3m8tGiGHmeVGMUbOQn8FaD",
    dateAdded: "2026-03-10",
  },
  {
    id: "7",
    title: "Earthrise",
    type: "image",
    note: "The photo that changed how humanity sees itself. Taken by William Anders, Apollo 8.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/NASA-Apollo8-Dec24-Earthrise.jpg/1280px-NASA-Apollo8-Dec24-Earthrise.jpg",
    dateAdded: "2025-12-24",
  },
  {
    id: "8",
    title: "The Boy, the Mole, the Fox and the Horse",
    type: "book",
    note: "Simple drawings, profound truths. 'What is the bravest thing you've ever said? Help.'",
    author: "Charlie Mackesy",
    dateAdded: "2026-01-28",
  },
  {
    id: "9",
    title: "Severance",
    type: "movie",
    note: "What if you could split your work self from your personal self? A masterclass in tension.",
    sourceUrl: "https://www.imdb.com/title/tt11280740/",
    imageUrl: "https://m.media-amazon.com/images/M/MV5BMjkwZjcwMGQtNDAzOC00YjJiLThiYTgtNWU3ZjRiMDdhMThiXkEyXkFqcGc@._V1_.jpg",
    dateAdded: "2026-02-15",
  },
  {
    id: "10",
    title: "Wild Geese",
    type: "poetry",
    note: "Permission to be imperfect. I return to this whenever I feel lost.",
    author: "Mary Oliver",
    excerpt: "You do not have to be good.\nYou do not have to walk on your knees\nfor a hundred miles through the desert, repenting.",
    dateAdded: "2026-03-18",
  },
  {
    id: "11",
    title: "How to Do Nothing",
    type: "book",
    note: "Jenny Odell's argument for attention as resistance. Made me rethink productivity.",
    author: "Jenny Odell",
    dateAdded: "2026-01-05",
  },
  {
    id: "12",
    title: "Life in a Day",
    type: "reel",
    note: "Crowdsourced documentary of a single day on Earth. Deeply moving.",
    sourceUrl: "https://www.youtube.com/watch?v=JaFVr_cJJIY",
    imageUrl: "https://img.youtube.com/vi/JaFVr_cJJIY/hqdefault.jpg",
    dateAdded: "2026-02-28",
  },
];

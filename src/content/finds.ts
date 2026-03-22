export type FindType =
  | "movie"
  | "book"
  | "reel"
  | "video"
  | "poetry"
  | "article"
  | "music"
  | "image"
  | "tool"
  | "people"
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
  coverVideoUrl?: string;
  priority?: 1 | 2 | 3;
  featured?: boolean;
  expandedNote?: string;
}

export const finds: Find[] = [
  {
    id: "1",
    title: "The Green Mile",
    type: "movie",
    note: "John Coffey feeling all the pain in the world and still choosing to give it love.",
    sourceUrl: "https://www.imdb.com/title/tt0120689/",
    imageUrl: "https://m.media-amazon.com/images/M/MV5BMTUxMzQyNjA5MF5BMl5BanBnXkFtZTYwOTU2NTY3._V1_.jpg",
    dateAdded: "2026-03-21",
    priority: 1,
  },
  {
    id: "2",
    title: "FIGlet",
    type: "tool",
    note: "The origin of ASCII art on the internet. Glenn Chappell built it in 1991, and by the 2000s it had 400+ community-made fonts. A little piece of internet history.",
    sourceUrl: "https://www.figlet.org/",
    imageUrl: "https://res.cloudinary.com/canonical/image/fetch/f_auto,q_auto,fl_sanitize,w_240/https%3A%2F%2Fdashboard.snapcraft.io%2Fsite_media%2Fappmedia%2F2019%2F02%2FFIG.png",
    dateAdded: "2026-03-21",
    priority: 2,
  },
  {
    id: "3",
    title: "Software is Culture",
    type: "article",
    note: "A gallery of iconic interactions from the past century that shaped how we use digital products. The art alone is worth the visit.",
    author: "Figma",
    sourceUrl: "https://www.figma.com/blog/software-is-culture/",
    coverVideoUrl: "https://player.vimeo.com/video/1145294479?h=31e2e3eece&title=0&byline=0&portrait=0&keyboard=0&muted=1&autoplay=1&autopause=0&controls=0&dnt=1&loop=1&background=1&quality=240p&app_id=122963&unmute_button=0&initial_quality=240p",
    dateAdded: "2026-03-21",
    priority: 3,
    featured: true,
    expandedNote: "This piece by Figma traces the most iconic interactions of the past century — from the first GUI to the iPhone's pinch-to-zoom. Each interaction is illustrated with gorgeous art that makes you want to linger. It's a love letter to the designers and engineers who shaped how we touch screens, click buttons, and navigate the digital world. The article argues that software isn't just a tool — it's culture, shaped by and shaping the people who use it.",
  },
  {
    id: "4",
    title: "Icograms",
    type: "tool",
    note: "An online tool with a vast library of isometric illustrations. Very useful for creating maps and diagrams.",
    sourceUrl: "https://icograms.com/",
    imageUrl: "https://storage.icograms.com/templates/thumbnails/map-urban-rural-areas.png",
    dateAdded: "2026-03-21",
    priority: 2,
  },
  {
    id: "5",
    title: "Susan Kare",
    type: "people",
    note: 'Known as "The woman who gave Macintosh a smile", she was the pioneering designer working with Apple in the early 1980s to create the visual language of the first Macintosh. She designed some famous pixel-arts like "Happy Mac", the Command key symbol (⌘), and the "hello" text animation you see when you use a new Apple product.',
    sourceUrl: "https://vimeo.com/97583369",
    imageUrl: "https://www.mac-history.net/wp-content/uploads/2022/12/Susan-Kare.jpg",
    dateAdded: "2026-03-21",
    priority: 3,
    featured: true,
    expandedNote: "Susan Kare is the iconographer who designed the first icons for Apple's Mac — making computers feel friendly and human. Working with Steve Jobs in the early 1980s, she created pixel-perfect icons on a 32×32 grid that became the visual language of personal computing: the Happy Mac, the paintbrush, the trash can, the command key symbol (⌘). Her presentation is a joy to watch — she walks through her process with warmth and humor. She even mentioned a book called \"Understanding Comics: The Invisible Art\" by Scott McCloud, which went straight to my read list. What strikes me most is how she proved that constraints (tiny grids, limited pixels) don't limit creativity — they focus it.",
  },
  {
    id: "6",
    title: "How AI Slop Will Spark the Next Human Renaissance",
    type: "video",
    note: "The idea that AI slop will eventually push people back toward real experiences and human craft. Not anti-AI, just pro-human.",
    author: "After Skool",
    sourceUrl: "https://www.youtube.com/watch?v=0iT9HbaRwfM",
    imageUrl: "https://img.youtube.com/vi/0iT9HbaRwfM/hqdefault.jpg",
    dateAdded: "2026-03-22",
    priority: 2,
  },
  {
    id: "7",
    title: "Product Management on the AI Exponential",
    type: "article",
    note: "The role of PM is dissolving into a shared responsibility between PM, design, and dev. In the AI era, everyone prototypes, everyone ships, and the lines blur in the best way.",
    author: "Cat Wu",
    sourceUrl: "https://claude.com/blog/product-management-on-the-ai-exponential",
    imageUrl: "https://cdn.prod.website-files.com/68a44d4040f98a4adf2207b6/69bc786ee19c0641392b77ad_og_product-management-on-the-ai-exponential.jpg",
    dateAdded: "2026-03-22",
    priority: 3,
  },
  {
    id: "8",
    title: "Interstellar",
    type: "movie",
    note: "The docking scene still gives me chills. A film about love disguised as sci-fi.",
    sourceUrl: "https://www.imdb.com/title/tt0816692/",
    imageUrl: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_.jpg",
    dateAdded: "2026-03-22",
    priority: 2,
  },
  {
    id: "9",
    title: "The Shawshank Redemption",
    type: "movie",
    note: "Hope is a dangerous thing. Hope can set you free.",
    sourceUrl: "https://www.imdb.com/title/tt0111161/",
    imageUrl: "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_.jpg",
    dateAdded: "2026-03-22",
    priority: 1,
  },
];

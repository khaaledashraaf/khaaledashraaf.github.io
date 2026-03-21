export type FindType =
  | "movie"
  | "book"
  | "reel"
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
    priority: 2,
  },
  {
    id: "2",
    title: "FIGlet",
    type: "tool",
    note: "The origin of ASCII art on the internet. Glenn Chappell built it in 1991, and by the 2000s it had 400+ community-made fonts. A little piece of internet history.",
    sourceUrl: "https://www.figlet.org/",
    imageUrl: "https://res.cloudinary.com/canonical/image/fetch/f_auto,q_auto,fl_sanitize,w_240/https%3A%2F%2Fdashboard.snapcraft.io%2Fsite_media%2Fappmedia%2F2019%2F02%2FFIG.png",
    dateAdded: "2026-03-21",
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
    note: "The iconographer who designed the first icons for Apple's Mac — making computers feel friendly and human. Her presentation is a joy to watch. She even mentioned a book called \"Understanding Comics: The Invisible Art\" which went straight to my read list.",
    sourceUrl: "https://vimeo.com/97583369",
    imageUrl: "https://invention.si.edu/sites/default/files/styles/670h/public/inventors-kare-susan-appleteam-susankare-color13-330dpi-cnormaseeff-banner-edit.jpg?itok=38dVfTtz",
    dateAdded: "2026-03-21",
    priority: 3,
  },
];

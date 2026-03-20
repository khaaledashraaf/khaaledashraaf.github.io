---
name: add-find
description: Add a new internet find (movie, book, reel, poetry, article, music, image, etc.) to the portfolio finds gallery
allowed-tools: Read, Edit, Bash(npm run build:*)
argument-hint: [description of the find]
---

The user wants to add a new find to their Internet Finds gallery. The find data lives in `src/content/finds.ts`.

## What you receive

The user will describe the find casually — e.g. "I just watched Interstellar and it blew my mind" or share a URL. Extract what you can from their message.

## Steps

1. **Read** `src/content/finds.ts` to see the current entries and determine the next `id` (increment the highest existing numeric id by 1).

2. **Determine the type** from context:
   - `"movie"` — films, TV shows, documentaries
   - `"book"` — books, graphic novels, zines
   - `"reel"` — YouTube videos, Instagram reels, TikToks, short films
   - `"poetry"` — poems, quotes, spoken word
   - `"article"` — blog posts, essays, newsletters
   - `"music"` — songs, albums, playlists, podcasts
   - `"image"` — photographs, art, illustrations
   - `"other"` — anything that doesn't fit above

   If ambiguous, ask the user.

3. **Gather the fields**. Required: `title`, `type`, `note`. Optional: `sourceUrl`, `imageUrl`, `author`, `excerpt`, `dateAdded`.
   - If the user didn't provide a personal note, ask them: "What resonated with you about this?" — the note should feel personal, not like a review.
   - For `dateAdded`, use today's date (ISO format) unless the user specifies otherwise.
   - For **poetry/quotes**: ask for or look up the excerpt text and author if not provided.
   - For **movies/reels**: if the user shares a YouTube URL, derive `imageUrl` as `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`. For movies, an IMDB or TMDB poster URL is ideal.
   - For **books**: try to include the `author`.
   - For **articles**: include `sourceUrl` and `author` if known.

4. **Add the entry** to the end of the `finds` array in `src/content/finds.ts` using the Edit tool.

5. **If the imageUrl uses a new hostname**, check `next.config.ts` and add it to `images.remotePatterns` if missing.

6. **Confirm** to the user with a short summary of what was added.

## Example entry format

```ts
{
  id: "13",
  title: "Interstellar",
  type: "movie",
  note: "The docking scene still gives me chills. A film about love disguised as sci-fi.",
  sourceUrl: "https://www.imdb.com/title/tt0816692/",
  imageUrl: "https://m.media-amazon.com/images/M/...",
  dateAdded: "2026-03-20",
},
```

## Tone

Keep it conversational. This is a personal gallery — the note should sound like the user, not a database entry. If the user gives you a dry description, help them make it feel more personal by suggesting a rewrite (but let them have final say).

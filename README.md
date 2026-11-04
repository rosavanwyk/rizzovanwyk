# rizzovanwyk.com

The Rizzo / van Wyk portfolio. Next.js site, edited with TinaCMS, hosted on Vercel.

## Editing the site

Go to **rizzovanwyk.com/admin** and sign in with Tina.

- **Change something on a page:** open a case study (or "Site: order & About page"), then click
  any image, video or text on the page preview. Its fields open on the left.
- **Swap an image or video:** click it, then click the thumbnail on the left. Upload a new file or
  pick one from the media library. JPG, PNG, WebP, GIF, SVG, MP4 and WebM all work. Videos
  autoplay muted and loop.
- **Add, remove or reorder panels:** in a case study, scroll the left sidebar to **Panels**. Use
  **+** to add a panel, drag the handles to reorder, and use the ⋯ menu to delete.
- **Reorder projects in the menu:** open **Site: order & About page** and drag the items under
  **Case study order**.
- **New case study:** Case studies → **Create new**. It appears at the end of the menu until you
  place it in the case study order.
- **Hide a case study:** turn on **Hidden (draft)**.
- **Save** publishes. Every save is a commit to GitHub, and Vercel puts it live in about a minute.

Tip: export images at about 2,600 px wide and compress them first (squoosh.app works well). Keep
videos under about 15 MB.

## Developer notes

- Content: `content/case-studies/*.json`, `content/site/site.json`; media in `public/media/`.
- `npm run dev` starts the site plus a local editor at `localhost:3000/admin` (it saves to local files).
- `npm run build` measures media (`content/media-dimensions.json`), builds the Tina admin when
  `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN` are set, then builds the site.
- `/case-study-1` redirects to `/mangopay`.

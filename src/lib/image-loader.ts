// Picks the smallest prepared copy of an image that is still sharp at the
// requested width (see scripts/responsive-images.mjs). Anything else is
// served as-is.
const WIDTHS = [828, 1440]

export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith('/media/') || !/\.(webp|png|jpe?g)$/i.test(src)) return src
  const target = WIDTHS.find((w) => width <= w)
  return target ? src.replace(/\.[^.]+$/, `.w${target}.webp`) : src
}

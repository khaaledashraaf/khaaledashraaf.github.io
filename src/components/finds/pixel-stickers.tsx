import Image from "next/image";

const stickers = {
  star: { src: "/svg/star.svg", alt: "Star" },
  heart: { src: "/svg/heart.svg", alt: "Heart" },
  "thumbs-up": { src: "/svg/thumbs up.svg", alt: "Thumbs up" },
} as const;

const stickerKeys = Object.keys(stickers) as (keyof typeof stickers)[];

export function FeaturedSticker({ findId, stickerType }: { findId: string; stickerType?: keyof typeof stickers }) {
  const key =
    stickerType ??
    stickerKeys[
      findId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      stickerKeys.length
    ];
  const sticker = stickers[key];

  // Deterministic rotation
  const index = stickerKeys.indexOf(key);
  const rotation = ((index * 17 + 7) % 25) - 12;

  return (
    <div
      className="absolute -top-2 -right-1 z-10 drop-shadow-md"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Image
        src={sticker.src}
        alt={sticker.alt}
        width={36}
        height={36}
        className="pointer-events-none"
      />
    </div>
  );
}

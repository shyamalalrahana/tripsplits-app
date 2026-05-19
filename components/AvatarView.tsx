"use client";

type Props = {
  name: string;
  color?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

const PALETTE = [
  "#5B8CFF",
  "#FF8A5B",
  "#3DE1B1",
  "#B57BFF",
  "#FF6BC9",
  "#FFC55B",
  "#2A6CFF",
  "#8A4BFF",
];

function hash(s: string) {
  return [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function AvatarView({ name, color, image, size = 40, className = "", style }: Props) {
  const initials = (name || "?")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const h = hash(name || "u");
  const c1 = color || PALETTE[h % PALETTE.length];
  const c2 = PALETTE[(h + 3) % PALETTE.length];
  const r = Math.round(size / 2.8);

  return (
    <div
      className={`avatarBox ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        fontSize: size * 0.36,
        background: image
          ? `url(${image}) center/cover`
          : `linear-gradient(135deg, ${c1}, ${c2})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)",
        ...style,
      }}
    >
      {!image && initials}
    </div>
  );
}

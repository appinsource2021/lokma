export function Cover({ name, hue, height = 120 }: { name: string; hue: number; height?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div
      className="cover"
      style={{
        height,
        background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 30) % 360} 65% 42%))`,
      }}
      aria-hidden
    >
      <span>{initials}</span>
    </div>
  );
}

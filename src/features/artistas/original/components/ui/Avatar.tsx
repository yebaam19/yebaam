type AvatarProps = {
  src?: string | null;
  name?: string;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ src, name = "A", className = "" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover bg-brand-mintLight ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-mintLight font-bold text-brand-dark ${className}`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

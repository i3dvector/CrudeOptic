/* eslint-disable @next/next/no-img-element */
/** SVG flag icon from flagcdn.com — works on Windows (where emoji flags don't render) */
export default function FlagIcon({
  iso,
  size = 20,
  className = "",
}: {
  iso: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={`https://flagcdn.com/w80/${iso.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w160/${iso.toLowerCase()}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={iso}
      className={`inline-block rounded-sm object-cover ${className}`}
      loading="lazy"
    />
  );
}

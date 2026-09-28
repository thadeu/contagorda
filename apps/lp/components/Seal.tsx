type SealProps = {
  id: string;
  size?: number | string;
  className?: string;
  spin?: boolean;
};

export default function Seal({ id, size = '100%', className, spin = false }: SealProps) {
  const ringId = `seal-ring-${id}`;

  return (
    <svg width={size} height={size} viewBox="0 0 170 170" className={className} role="img" aria-label="Selo ContaGorda">
      <defs>
        <path id={ringId} d="M85 85m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0" />
      </defs>

      <circle cx="85" cy="85" r="80" fill="#111" />
      <circle cx="85" cy="85" r="44" fill="#FF5B1F" />

      <g className={spin ? 'seal-spin' : undefined}>
        <text fontWeight="900" fontSize="13" fill="#fff" style={{ fontFamily: 'var(--font-archivo)' }}>
          <textPath href={`#${ringId}`} textLength="362" lengthAdjust="spacing">
            CONTAGORDA · CONTAGORDA · CONTAGORDA ·{' '}
          </textPath>
        </text>
      </g>

      <rect x="57" y="68" width="56" height="34" rx="17" fill="#FF5B1F" stroke="#111" strokeWidth="6" />
      <rect x="71" y="77" width="7" height="16" rx="3.5" fill="#111" />
      <rect x="92" y="77" width="7" height="16" rx="3.5" fill="#111" />
    </svg>
  );
}

type SnoutProps = {
  fill: string;
  stroke: string;
  size?: number;
};

export default function Snout({ fill, stroke, size = 32 }: SnoutProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="14" width="52" height="36" rx="18" fill={fill} stroke={stroke} strokeWidth="7" />
      <rect x="20" y="24" width="7" height="16" rx="3.5" fill={stroke} />
      <rect x="37" y="24" width="7" height="16" rx="3.5" fill={stroke} />
    </svg>
  );
}

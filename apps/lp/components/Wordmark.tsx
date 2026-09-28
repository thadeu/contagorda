import Link from 'next/link';

export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ContaGorda — página inicial"
      className={`flex flex-col bg-ink px-2 pt-1.5 pb-[5px] text-[15px] leading-[0.86] font-black tracking-[-0.03em] text-white hover:text-white ${className}`}
    >
      <span>conta</span>

      <span className="flex items-end gap-0.5">
        gorda
        <span className="mb-px flex gap-[1.5px]">
          <span className="h-[5px] w-[2.5px] rounded-sm bg-orange" />
          <span className="h-[5px] w-[2.5px] rounded-sm bg-orange" />
        </span>
      </span>
    </Link>
  );
}

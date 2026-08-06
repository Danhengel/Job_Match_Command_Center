export function BrandCompass({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="11.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m20.9 10.7-2.5 7.7-7.7 2.5 2.5-7.7 7.7-2.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <circle cx="16" cy="16" r="1.5" fill="#5eead4" />
      <path
        d="M16 2.8v2.4M16 26.8v2.4M2.8 16h2.4M26.8 16h2.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

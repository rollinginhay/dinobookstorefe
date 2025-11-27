export default function TagIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.5V6a2 2 0 0 1 2-2h4.5a1 1 0 0 1 .7.3l8.5 8.5a2 2 0 0 1 0 2.8l-4.5 4.5a2 2 0 0 1-2.8 0L3.3 11.2A1 1 0 0 1 3 10.5z"
      />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

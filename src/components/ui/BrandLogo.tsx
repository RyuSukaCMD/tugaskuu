export default function BrandLogo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <defs><linearGradient id="tugasku-brand-gradient" x1="18" y1="14" x2="110" y2="118" gradientUnits="userSpaceOnUse"><stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#2563EB" /></linearGradient></defs>
      <rect width="128" height="128" rx="32" fill="url(#tugasku-brand-gradient)" />
      <path d="M29 35C29 29.477 33.477 25 39 25H89C94.523 25 99 29.477 99 35V87C99 92.523 94.523 97 89 97H60L43 108V97H39C33.477 97 29 92.523 29 87V35Z" fill="white" fillOpacity=".97" />
      <path d="M48 45H80M48 61H80M48 77H68" stroke="#5B5CE2" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

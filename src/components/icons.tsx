import type {SVGProps} from 'react';

export function KrishiRakshakIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c-5 0-9-4.5-9-10 0-5.5 4-10 9-10s9 4.5 9 10c0 5.5-4 10-9 10Z" />
      <path d="M12 2a7 7 0 0 0-7 7c0 3.9 3.1 7 7 7s7-3.1 7-7A7 7 0 0 0 12 2Z" />
      <path d="M12 11a2.5 2.5 0 0 1-2.5-2.5 2.5 2.5 0 0 1 5 0A2.5 2.5 0 0 1 12 11Z" />
    </svg>
  );
}

type SuccessCheckProps = {
  className?: string;
};

export function SuccessCheck({ className }: SuccessCheckProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="stroke-primary success-check-circle"
        cx="26"
        cy="26"
        r="24"
        strokeWidth="2"
      />
      <path
        className="stroke-primary success-check-path"
        d="M14 27l8 8 16-16"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

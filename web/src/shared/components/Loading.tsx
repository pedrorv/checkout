type LoadingProps = {
  className?: string;
};

export function Loading({ className }: LoadingProps) {
  return (
    <div
      className={className ?? "flex min-h-screen items-center justify-center"}
    >
      <div className="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

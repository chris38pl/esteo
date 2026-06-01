export default function DashboardContentLoading() {
  return (
    <div className="flex min-w-0 flex-1 animate-pulse flex-col gap-4 px-4 py-6 md:px-8">
      <div className="h-7 w-40 rounded-lg bg-muted/40" />
      <div className="h-4 w-56 rounded-md bg-muted/30" />
      <div className="mt-2 h-40 w-full rounded-xl bg-muted/20" />
    </div>
  );
}

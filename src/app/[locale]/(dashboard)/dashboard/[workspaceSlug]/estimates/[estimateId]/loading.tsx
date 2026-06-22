export default function EstimateEditorLoading() {
  return (
    <div className="flex min-w-0 flex-1 animate-pulse flex-col gap-4 px-4 py-6 md:px-8">
      <div className="h-8 w-64 rounded-lg bg-muted/40" />
      <div className="h-4 w-40 rounded-md bg-muted/30" />
      <div className="mt-2 h-56 w-full rounded-xl bg-muted/20" />
      <div className="h-40 w-full rounded-xl bg-muted/15" />
    </div>
  );
}

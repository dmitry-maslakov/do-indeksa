export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 rounded-full bg-untouched">
      <div
        className="h-full rounded-full bg-data"
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}

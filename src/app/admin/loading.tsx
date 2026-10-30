export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        <div className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        <div className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </div>
      <div className="h-96 w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
    </div>
  )
}
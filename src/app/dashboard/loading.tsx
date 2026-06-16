export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">加载中...</p>
      </div>
    </div>
  );
}

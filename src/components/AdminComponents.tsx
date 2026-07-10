export interface StatCardProps {
  title: string;
  value: any;
  highlight?: boolean;
  bg?: string;
  border?: string;
}

export function StatCard({ title, value, highlight = false, bg = "bg-slate-900", border = "border-slate-800" }: StatCardProps) {
  return (
    <div className={`${bg} border ${highlight ? 'border-red-500/50 bg-red-500/5' : border} rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors`}>
      <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <p className={`text-xl sm:text-2xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export function HealthItem({ name, status }: { name: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
      <span className="text-sm font-medium text-slate-300">{name}</span>
      <span className="text-sm font-bold text-slate-400">{status}</span>
    </div>
  );
}

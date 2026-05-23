export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-bold tracking-tight transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 px-4 py-2.5 text-sm rounded-2xl bg-slate-950 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = null, // 'emerald', 'cyan', 'amber'
  ...props
}) => {
  const glowStyles = {
    emerald: 'border-emerald-500/30 shadow-glow-emerald',
    cyan: 'border-cyan-500/30 shadow-glow-cyan',
    amber: 'border-amber-500/30 shadow-glow-amber',
  };

  return (
    <div
      className={`bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 transition-all duration-200 ${
        hoverEffect ? 'hover:border-slate-700 hover:bg-slate-800/60 hover:-translate-y-0.5' : ''
      } ${glow ? glowStyles[glow] : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between mb-4 ${className}`}>
    <div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

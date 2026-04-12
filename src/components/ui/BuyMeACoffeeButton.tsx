import React from 'react';

interface BuyMeACoffeeButtonProps {
  className?: string;
  compact?: boolean;
}

export function BuyMeACoffeeButton({
  className = '',
  compact = false,
}: BuyMeACoffeeButtonProps) {
  return (
    <a
      href="https://buymeacoffee.com/mketiku"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-xl bg-[#FFDD00] font-black text-black shadow-lg shadow-yellow-500/20 transition-all hover:bg-[#FFCC00] active:scale-95 ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${className}`}
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
        alt="Buy me a coffee"
        className={compact ? 'h-4 w-4' : 'h-5 w-5'}
      />
      <span>{compact ? 'Support' : 'Buy me a coffee'}</span>
    </a>
  );
}

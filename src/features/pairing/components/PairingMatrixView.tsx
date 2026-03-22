import React from 'react';
import type { PairingMatrix } from '../hooks/useHistoryAnalytics';
import { motion } from 'framer-motion';

interface PairingMatrixViewProps {
  matrix: PairingMatrix;
}

export function PairingMatrixView({ matrix }: PairingMatrixViewProps) {
  const { personIds, personNames, counts } = matrix;

  if (personIds.length === 0) return null;

  // Find max count for scaling color intensity
  let maxCount = 0;
  Object.values(counts).forEach((row) => {
    Object.values(row).forEach((count) => {
      if (count > maxCount) maxCount = count;
    });
  });

  return (
    <div className="overflow-x-auto pt-4">
      <table
        role="grid"
        aria-label="Pairing heatmap"
        className="w-max border-separate border-spacing-1.5 md:border-spacing-2"
      >
        <thead>
          <tr>
            <th className="p-2"></th>
            {personIds.map((id) => (
              <th
                key={id}
                scope="col"
                aria-label={personNames[id]}
                className="p-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 -rotate-45 origin-bottom-left h-24 w-12 text-left align-bottom whitespace-nowrap"
              >
                <span className="inline-block translate-x-1 translate-y-0.5">
                  {personNames[id]}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personIds.map((rowId) => (
            <tr key={rowId}>
              <td
                scope="row"
                className="p-2 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right w-20"
              >
                {personNames[rowId]}
              </td>
              {personIds.map((colId) => {
                const count =
                  rowId === colId ? null : counts[rowId]?.[colId] || 0;
                const intensity = count ? count / (maxCount || 1) : 0;
                const cellAriaLabel =
                  count === null
                    ? `${personNames[rowId]} (self)`
                    : `${personNames[rowId]} and ${personNames[colId]} paired ${count} times`;

                return (
                  <td
                    key={colId}
                    role="gridcell"
                    aria-label={cellAriaLabel}
                    className="p-0"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      tabIndex={count !== null ? 0 : -1}
                      className={`h-10 w-10 sm:h-12 sm:w-12 2xl:h-14 2xl:w-14 min-w-[40px] aspect-square flex items-center justify-center rounded-lg text-xs 2xl:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
                        ${rowId === colId ? 'bg-neutral-50 dark:bg-neutral-800/20' : 'bg-neutral-50 dark:bg-neutral-800'}
                      `}
                      style={{
                        backgroundColor: count
                          ? `rgba(99, 102, 241, ${0.1 + intensity * 0.8})`
                          : undefined,
                        color: count && intensity > 0.5 ? 'white' : undefined,
                      }}
                      title={
                        count !== null
                          ? `${personNames[rowId]} + ${personNames[colId]}: ${count} times`
                          : ''
                      }
                    >
                      {count !== null && count > 0 ? count : ''}
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

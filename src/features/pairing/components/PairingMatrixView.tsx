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
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="p-2"></th>
            {personIds.map((id) => (
              <th
                key={id}
                className="p-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 rotate-45 h-20 w-12 text-left align-bottom"
              >
                {personNames[id]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personIds.map((rowId) => (
            <tr key={rowId}>
              <td className="p-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right w-24">
                {personNames[rowId]}
              </td>
              {personIds.map((colId) => {
                const count =
                  rowId === colId ? null : counts[rowId]?.[colId] || 0;
                const intensity = count ? count / (maxCount || 1) : 0;

                return (
                  <td key={colId} className="p-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`h-10 w-10 flex items-center justify-center rounded-lg text-xs font-bold transition-colors
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

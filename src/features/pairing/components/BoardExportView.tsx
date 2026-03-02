import React from 'react';
import type { PairingBoard, Person } from '../types';

interface BoardExportViewProps {
  boards: PairingBoard[];
  people: Person[];
  workspaceName: string;
  exportRef: React.RefObject<HTMLDivElement | null>;
  showFullName: boolean;
}

/**
 * A hidden, read-only, clean-styled render of the current board state.
 * Captured by html-to-image for PNG export.
 */
export function BoardExportView({
  boards,
  people,
  workspaceName,
  exportRef,
  showFullName,
}: BoardExportViewProps) {
  const getAssignedPeople = (board: PairingBoard): Person[] =>
    (board.assignedPersonIds ?? [])
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is Person => !!p);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      ref={exportRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1200px',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -50,
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb',
        padding: '48px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
            🦜
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.5px',
              }}
            >
              {workspaceName}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
              Pairing Overview
            </p>
          </div>
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#9ca3af',
            textAlign: 'right',
          }}
        >
          {today}
        </div>
      </div>

      {/* Board Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}
      >
        {boards.map((board) => {
          const assigned = getAssignedPeople(board);
          return (
            <div
              key={board.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: board.isExempt
                  ? '1.5px solid #fde68a'
                  : '1.5px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {/* Board header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: board.isExempt ? '#f59e0b' : '#6366f1',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#111827',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {board.name}
                </span>
                {board.isExempt && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#d97706',
                      backgroundColor: '#fef3c7',
                      padding: '2px 8px',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Exempt
                  </span>
                )}
              </div>

              {/* Goals */}
              {board.goals && board.goals.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  {board.goals.map((g, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          marginTop: '6px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: '#6366f1',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          lineHeight: 1.4,
                        }}
                      >
                        {g}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* People */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {assigned.length === 0 ? (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#d1d5db',
                      fontStyle: 'italic',
                    }}
                  >
                    Empty
                  </span>
                ) : (
                  assigned.map((p) => {
                    const initials = p.name
                      .trim()
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            height: '40px',
                            minWidth: showFullName ? 'auto' : '40px',
                            padding: showFullName ? '0 12px' : '0',
                            borderRadius: showFullName ? '999px' : '50%',
                            backgroundColor: p.avatarColorHex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: showFullName ? '12px' : '13px',
                            fontWeight: 700,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {showFullName ? p.name.split(' ')[0] : initials}
                        </div>
                        {!showFullName && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#6b7280',
                              fontWeight: 600,
                              maxWidth: '48px',
                              textAlign: 'center',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#d1d5db' }}>
          Generated by Parrit 🦜
        </span>
        <span style={{ fontSize: '12px', color: '#d1d5db' }}>
          parrit.vercel.app
        </span>
      </div>
    </div>
  );
}

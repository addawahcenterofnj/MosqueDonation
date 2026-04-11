'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--c-card)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}>
        {/* Color strip */}
        <div className="h-1.5" style={{ background: danger ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#059669,#047857)' }} />

        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'var(--c-accent-bg)', border: `1.5px solid ${danger ? 'rgba(239,68,68,0.3)' : 'var(--c-border-2)'}` }}>
            {danger ? (
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="w-6 h-6" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <h3 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--c-text)' }}>{title}</h3>
          <p className="text-sm text-center leading-relaxed mb-6" style={{ color: 'var(--c-text-2)' }}>{message}</p>

          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-ghost flex-1 py-2.5">Cancel</button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: danger ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#059669,#047857)',
                boxShadow: danger ? '0 4px 12px rgba(239,68,68,0.4)' : '0 4px 12px rgba(5,150,105,0.4)',
              }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

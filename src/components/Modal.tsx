import React, { useState } from 'react';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 범용 모달 + 필드 정의 기반 엔티티 폼.
// 각 페이지는 FIELD 배열만 정의하면 추가/수정 폼을 얻습니다.
// ─────────────────────────────────────────────────────────────

export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[85vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── 필드 정의 ──
export type FieldDef<T> = {
  key: keyof T & string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2;
};

export function EntityFormModal<T extends Record<string, any>>({
  title, fields, initial, onSubmit, onClose, submitting,
}: {
  title: string;
  fields: FieldDef<T>[];
  initial: T;
  onSubmit: (values: T) => void;
  onClose: () => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<T>(initial);

  const set = (key: string, raw: string, type?: string) => {
    setValues(v => ({ ...v, [key]: type === 'number' ? (raw === '' ? 0 : Number(raw)) : raw }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? '').trim()) {
        alert(`'${f.label}' 항목을 입력해 주세요.`);
        return;
      }
    }
    onSubmit(values);
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          {fields.map(f => (
            <div key={f.key} className={f.colSpan === 2 || f.type === 'textarea' ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {f.type === 'select' ? (
                <select
                  value={String(values[f.key] ?? '')}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                >
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={String(values[f.key] ?? '')}
                  onChange={e => set(f.key, e.target.value)}
                  rows={3}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 resize-none"
                />
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={String(values[f.key] ?? '')}
                  onChange={e => set(f.key, e.target.value, f.type)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-primary-100 border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-200/60 disabled:opacity-50">
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── 행 액션 버튼 (수정/삭제) ──
export function RowActions({ onEdit, onDelete, extra }: {
  onEdit?: () => void; onDelete?: () => void; extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {extra}
      {onEdit && (
        <button onClick={onEdit}
          className="px-2 py-1 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300">
          수정
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete}
          className="px-2 py-1 text-xs font-medium bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200">
          삭제
        </button>
      )}
    </div>
  );
}

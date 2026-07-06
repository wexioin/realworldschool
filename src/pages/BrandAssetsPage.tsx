import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Palette, Type, LayoutTemplate, BookOpen, FileBox,
  Download, FileText,
} from 'lucide-react';
import { useBrandAssets, useSaveBrandAsset, useDeleteBrandAsset } from '../api';
import type { BrandAsset, BrandAssetCategory } from '../api/types';
import {
  PageHeader, FilterChips, StatusBadge, Table, EmptyRow, Loading, SearchInput, AddButton,
} from '../components/ui';
import { EntityFormModal, RowActions, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/format';
import { downloadMockFile } from '../utils/export';

// ─────────────────────────────────────────────────────────────
// 브랜드 자산: 리얼월드 스쿨 브랜드 템플릿 보관소.
// 로고·폰트·보고서 템플릿·가이드 등을 업로드/다운로드/수정합니다.
// ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<BrandAssetCategory, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet'; icon: React.ElementType }> = {
  logo:     { label: '로고', tone: 'violet', icon: Palette },
  font:     { label: '폰트', tone: 'blue', icon: Type },
  template: { label: '템플릿', tone: 'green', icon: LayoutTemplate },
  guide:    { label: '가이드', tone: 'amber', icon: BookOpen },
  etc:      { label: '기타', tone: 'gray', icon: FileBox },
};

const CATEGORY_ORDER: BrandAssetCategory[] = ['logo', 'font', 'template', 'guide', 'etc'];

const formatFileSize = (kb: number): string =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

const CATEGORY_OPTIONS = CATEGORY_ORDER.map(c => ({ value: c, label: CATEGORY_META[c].label }));

const emptyAsset = (): BrandAsset => ({
  id: '',
  name: '',
  category: 'template',
  fileType: '',
  sizeKB: 0,
  uploader: '',
  uploadedAt: new Date().toISOString().slice(0, 10),
  version: 'v1.0',
  description: '',
});

const FIELDS: FieldDef<BrandAsset>[] = [
  { key: 'name', label: '자산명', required: true, colSpan: 2, placeholder: '예: 리얼월드 스쿨 로고 패키지' },
  { key: 'category', label: '분류', type: 'select', required: true, options: CATEGORY_OPTIONS },
  { key: 'fileType', label: '파일 형식', required: true, placeholder: 'PDF, PPTX, ZIP, TTF ...' },
  { key: 'version', label: '버전', placeholder: 'v1.0' },
  { key: 'sizeKB', label: '파일 크기 (KB)', type: 'number' },
  { key: 'uploader', label: '업로더', required: true, placeholder: '예: 디자인팀' },
  { key: 'uploadedAt', label: '등록일', type: 'date' },
  { key: 'description', label: '설명', type: 'textarea', colSpan: 2, placeholder: '자산에 대한 간략한 설명' },
];

export default function BrandAssetsPage() {
  const { data: assets, isLoading } = useBrandAssets();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<BrandAsset | null>(null);
  const toast = useToast();

  const save = useSaveBrandAsset();
  const del = useDeleteBrandAsset();

  const category = searchParams.get('category') ?? 'all';

  const filtered = useMemo(() => {
    if (!assets) return [];
    return assets.filter(a => {
      if (category !== 'all' && a.category !== category) return false;
      if (query && !`${a.name}${a.fileType}${a.uploader}${a.description ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [assets, category, query]);

  if (isLoading || !assets) return <Loading />;

  const countBy = (c: BrandAssetCategory) => assets.filter(a => a.category === c).length;

  const handleSubmit = (values: BrandAsset) => {
    save.mutate(values, {
      onSuccess: () => {
        toast.success(values.id ? '자산이 수정되었습니다.' : '자산이 업로드되었습니다.');
        setEditing(null);
      },
    });
  };

  const handleDelete = (a: BrandAsset) => {
    if (!window.confirm(`「${a.name}」 자산을 삭제할까요?`)) return;
    del.mutate(a.id, { onSuccess: () => toast.success('자산이 삭제되었습니다.') });
  };

  const handleDownload = (a: BrandAsset) => {
    downloadMockFile(a.name, a.fileType);
    toast.success(`「${a.name}」 다운로드를 시작합니다.`);
  };

  return (
    <div>
      <PageHeader
        title="브랜드 자산"
        description="리얼월드 스쿨 브랜드 템플릿 보관소 — 로고·폰트·보고서 템플릿·가이드를 관리합니다"
        right={<AddButton label="자산 업로드" onClick={() => setEditing(emptyAsset())} />}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <FilterChips
          param="category"
          options={[{ value: 'all', label: '전체' }, ...CATEGORY_ORDER.map(c => ({ value: c, label: CATEGORY_META[c].label }))]}
          counts={{ all: assets.length, ...Object.fromEntries(CATEGORY_ORDER.map(c => [c, countBy(c)])) } as any}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="자산명·형식·업로더 검색" />
      </div>

      <Table headers={['자산명', '분류', '형식', '크기', '버전', '업로더', '등록일', '']}>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={8} />
        ) : (
          filtered.map(a => {
            const meta = CATEGORY_META[a.category];
            const Icon = meta.icon;
            return (
              <tr key={a.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      meta.tone === 'violet' ? 'bg-violet-50 text-violet-600' :
                      meta.tone === 'blue' ? 'bg-blue-50 text-blue-600' :
                      meta.tone === 'green' ? 'bg-emerald-50 text-emerald-600' :
                      meta.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                      {a.description && <p className="text-xs text-gray-400 truncate max-w-[320px]">{a.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                    <FileText size={12} className="text-gray-400" />{a.fileType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatFileSize(a.sizeKB)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{a.version}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{a.uploader}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(a.uploadedAt)}</td>
                <td className="px-4 py-3">
                  <RowActions
                    onEdit={() => setEditing(a)}
                    onDelete={() => handleDelete(a)}
                    extra={
                      <button
                        onClick={() => handleDownload(a)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary-50 border border-primary-100 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Download size={12} /> 다운로드
                      </button>
                    }
                  />
                </td>
              </tr>
            );
          })
        )}
      </Table>

      {editing && (
        <EntityFormModal
          title={editing.id ? '브랜드 자산 수정' : '브랜드 자산 업로드'}
          fields={FIELDS}
          initial={editing}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
          submitting={save.isPending}
        />
      )}
    </div>
  );
}

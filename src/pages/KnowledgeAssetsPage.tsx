import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Heart, Bookmark, Pencil, Trash2, X } from 'lucide-react';
import {
  useKnowledgePosts, useSaveKnowledgePost, useDeleteKnowledgePost,
  useTogglePostLike, useTogglePostBookmark,
} from '../api';
import type { KnowledgePost, KnowledgeCategory } from '../api/types';
import {
  PageHeader, FilterChips, Loading, SearchInput, AddButton,
} from '../components/ui';
import { EntityFormModal, FieldDef } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/format';

// ─────────────────────────────────────────────────────────────
// 지식 자산: 관리자들이 사내 지식을 포스트처럼 공유하는 공간.
// 좋아요·즐겨찾기 리액션, 분야별 분류(회사/브랜드·제품/영업·운영/법무·홈페이지/FAQ·홍보&마케팅)
// ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<KnowledgeCategory, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet'; dot: string }> = {
  company:   { label: '회사/브랜드', tone: 'violet', dot: 'bg-violet-500' },
  product:   { label: '제품/영업', tone: 'green', dot: 'bg-emerald-500' },
  ops:       { label: '운영/법무', tone: 'amber', dot: 'bg-amber-500' },
  faq:       { label: '홈페이지/FAQ', tone: 'blue', dot: 'bg-blue-500' },
  marketing: { label: '홍보&마케팅', tone: 'red', dot: 'bg-rose-500' },
};

const CATEGORY_ORDER: KnowledgeCategory[] = ['company', 'product', 'ops', 'faq', 'marketing'];
const CATEGORY_OPTIONS = CATEGORY_ORDER.map(c => ({ value: c, label: CATEGORY_META[c].label }));

const CURRENT_AUTHOR = '관리자';

const emptyPost = (): KnowledgePost => ({
  id: '',
  title: '',
  body: '',
  category: 'company',
  author: CURRENT_AUTHOR,
  createdAt: new Date().toISOString().slice(0, 10),
  likes: 0,
  likedByMe: false,
  bookmarkedByMe: false,
});

const FIELDS: FieldDef<KnowledgePost>[] = [
  { key: 'title', label: '제목', required: true, colSpan: 2, placeholder: '예: 학교 견적 문의 대응 스크립트' },
  { key: 'category', label: '분야', type: 'select', required: true, options: CATEGORY_OPTIONS },
  { key: 'author', label: '작성자', required: true },
  { key: 'body', label: '내용', type: 'textarea', required: true, colSpan: 2, placeholder: '공유할 지식을 입력하세요.' },
];

// ── 리액션 버튼 ──
function ReactionBar({ post, onLike, onBookmark }: {
  post: KnowledgePost; onLike: () => void; onBookmark: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
          post.likedByMe
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <Heart size={13} className={post.likedByMe ? 'fill-rose-500 text-rose-500' : ''} />
        {post.likes}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onBookmark(); }}
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-lg border transition-colors',
          post.bookmarkedByMe
            ? 'bg-amber-50 border-amber-200 text-amber-500'
            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
        )}
        aria-label="즐겨찾기"
      >
        <Bookmark size={14} className={post.bookmarkedByMe ? 'fill-amber-400 text-amber-400' : ''} />
      </button>
    </div>
  );
}

export default function KnowledgeAssetsPage() {
  const { data: posts, isLoading } = useKnowledgePosts();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [editing, setEditing] = useState<KnowledgePost | null>(null);
  const [viewing, setViewing] = useState<KnowledgePost | null>(null);
  const toast = useToast();

  const save = useSaveKnowledgePost();
  const del = useDeleteKnowledgePost();
  const toggleLike = useTogglePostLike();
  const toggleBookmark = useTogglePostBookmark();

  const category = searchParams.get('category') ?? 'all';

  const filtered = useMemo(() => {
    if (!posts) return [];
    return posts.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (onlyBookmarked && !p.bookmarkedByMe) return false;
      if (query && !`${p.title}${p.body}${p.author}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [posts, category, onlyBookmarked, query]);

  if (isLoading || !posts) return <Loading />;

  const countBy = (c: KnowledgeCategory) => posts.filter(p => p.category === c).length;

  const handleSubmit = (values: KnowledgePost) => {
    save.mutate(values, {
      onSuccess: () => {
        toast.success(values.id ? '지식 자산이 수정되었습니다.' : '지식 자산이 등록되었습니다.');
        setEditing(null);
      },
    });
  };

  const handleDelete = (p: KnowledgePost) => {
    if (!window.confirm(`「${p.title}」 글을 삭제할까요?`)) return;
    del.mutate(p.id, { onSuccess: () => { toast.success('삭제되었습니다.'); setViewing(null); } });
  };

  return (
    <div>
      <PageHeader
        title="지식 자산"
        description="관리자끼리 공유하는 사내 지식 — 좋아요·즐겨찾기로 유용한 글을 모아보세요"
        right={<AddButton label="글 작성" onClick={() => setEditing(emptyPost())} />}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChips
            param="category"
            options={[{ value: 'all', label: '전체' }, ...CATEGORY_ORDER.map(c => ({ value: c, label: CATEGORY_META[c].label }))]}
            counts={{ all: posts.length, ...Object.fromEntries(CATEGORY_ORDER.map(c => [c, countBy(c)])) } as any}
          />
          <button
            onClick={() => setOnlyBookmarked(v => !v)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors',
              onlyBookmarked
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <Bookmark size={13} className={onlyBookmarked ? 'fill-amber-400 text-amber-400' : ''} /> 즐겨찾기만
          </button>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="제목·내용·작성자 검색" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
          조건에 맞는 글이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(p => {
            const meta = CATEGORY_META[p.category];
            return (
              <div
                key={p.id}
                onClick={() => setViewing(p)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <span className={clsx('w-1.5 h-1.5 rounded-full', meta.dot)} />{meta.label}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{p.author}</span>
                  <span className="text-xs text-gray-300 ml-auto">{formatDate(p.createdAt)}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{p.title}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 flex-1">{p.body}</p>
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <ReactionBar
                    post={p}
                    onLike={() => toggleLike.mutate(p.id)}
                    onBookmark={() => toggleBookmark.mutate(p.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 상세 보기 */}
      {viewing && (() => {
        const meta = CATEGORY_META[viewing.category];
        // viewing은 스냅샷이므로 리액션 최신 상태는 목록(posts)에서 다시 찾습니다.
        const live = posts.find(p => p.id === viewing.id) ?? viewing;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setViewing(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', meta.dot)} />{meta.label}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{live.author} · {formatDate(live.createdAt)}</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{live.title}</h2>
                </div>
                <button onClick={() => setViewing(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{live.body}</p>
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <ReactionBar
                  post={live}
                  onLike={() => toggleLike.mutate(live.id)}
                  onBookmark={() => toggleBookmark.mutate(live.id)}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(live); setViewing(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil size={13} /> 수정
                  </button>
                  <button
                    onClick={() => handleDelete(live)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 size={13} /> 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {editing && (
        <EntityFormModal
          title={editing.id ? '지식 자산 수정' : '새 글 작성'}
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

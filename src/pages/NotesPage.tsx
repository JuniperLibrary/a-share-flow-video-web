import { useState, useEffect, useRef } from 'react';
import { Button, Tag } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconCheck, IconClose, IconPlus, IconLeft, IconRight } from '@arco-design/web-react/icon';
import { api } from '../api';
import { PageHeader } from '../components/ui/page-header';
import { EmptyState } from '../components/ui/empty-state';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

interface Note {
  id: number;
  type: 'completed' | 'planned';
  content: string;
  created_at: string;
  updated_at: string;
}

const TYPE_CONFIG = {
  // Chinese-market rule: positive/done = inflow (red), not green. See DESIGN.md §2.
  completed: {
    label: '已完成',
    dot: 'bg-inflow',
    tag: <Badge variant="inflow">已完成</Badge>,
    card: 'border-inflow/20 bg-inflow-softer hover:border-inflow/40',
    dotButton: 'border-inflow bg-inflow/20 text-inflow',
    column: 'border-inflow/40 bg-inflow-softer',
  },
  planned: {
    label: '待计划',
    dot: 'bg-primary',
    tag: <Badge variant="default">待计划</Badge>,
    card: 'border-primary/20 bg-primary-softer hover:border-primary/40',
    dotButton: 'border-ink-3 hover:border-primary',
    column: 'border-primary/40 bg-primary-softer',
  },
} as const;

function NoteCard({
  note,
  onToggle,
  onDelete,
  onUpdate,
  isDragging,
  onDragStart: onCardDragStart,
}: {
  note: Note;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (content: string) => void;
  isDragging: boolean;
  onDragStart?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [editing]);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(note.id));
    onCardDragStart?.();
  }

  function handleSave() {
    if (editContent.trim() && editContent !== note.content) {
      onUpdate(editContent.trim());
    }
    setEditing(false);
  }

  function handleCancel() {
    setEditContent(note.content);
    setEditing(false);
  }

  const config = TYPE_CONFIG[note.type];

  return (
    <div
      draggable={!editing}
      onDragStart={handleDragStart}
      className={cn(
        'rounded-xl border backdrop-blur-xl p-4 shadow-lg transition-all duration-200 group',
        config.card,
        isDragging && 'opacity-30 scale-95',
        'cursor-grab active:cursor-grabbing select-none',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onToggle}
          className={cn(
            'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
            config.dotButton,
          )}
        >
          {note.type === 'completed' && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <textarea
                ref={inputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-black/40 border border-hairline rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-primary resize-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="w-7 h-7 rounded-lg bg-inflow-softer text-inflow hover:bg-inflow-muted flex items-center justify-center transition-all"
                  aria-label="保存"
                >
                  <IconCheck style={{ fontSize: 14 }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="w-7 h-7 rounded-lg bg-surface-3 text-ink-3 hover:bg-hairline-active flex items-center justify-center transition-all"
                  aria-label="取消"
                >
                  <IconClose style={{ fontSize: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-ink-3">{note.created_at}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => { setEditContent(note.content); setEditing(true); }}
            className="w-7 h-7 rounded-lg bg-surface-2 text-ink-3 hover:bg-hairline-active hover:text-ink flex items-center justify-center transition-all"
            aria-label="编辑"
          >
            <IconEdit style={{ fontSize: 13 }} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-surface-2 text-ink-3 hover:bg-inflow/10 hover:text-inflow flex items-center justify-center transition-all"
            aria-label="删除"
          >
            <IconDelete style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesPage() {
  const PAGE_SIZE = 5;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'completed' | 'planned'>('planned');
  const [dragNoteId, setDragNoteId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<'completed' | 'planned' | null>(null);
  const [completedPage, setCompletedPage] = useState(1);

  useEffect(() => { loadNotes(); }, []);

  useEffect(() => { setCompletedPage(1); }, [notes.length]);

  async function loadNotes() {
    try {
      const data = await api.getNotes();
      setNotes(data.notes);
    } catch { void 0; }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newContent.trim()) return;
    try {
      await api.createNote(newType, newContent.trim());
      setNewContent('');
      loadNotes();
    } catch { void 0; }
  }

  async function handleToggleType(note: Note) {
    const targetType = note.type === 'completed' ? 'planned' : 'completed';
    try {
      await api.updateNote(note.id, targetType, note.content);
      loadNotes();
    } catch { void 0; }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteNote(id);
      loadNotes();
    } catch { void 0; }
  }

  async function handleUpdate(id: number, content: string) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      await api.updateNote(id, note.type, content);
      loadNotes();
    } catch { void 0; }
  }

  async function handleDrop(noteId: number, targetType: 'completed' | 'planned') {
    const note = notes.find(n => n.id === noteId);
    if (!note || note.type === targetType) return;
    try {
      await api.updateNote(noteId, targetType, note.content);
      loadNotes();
    } catch { void 0; }
  }

  const completedNotes = notes.filter(n => n.type === 'completed');
  const plannedNotes = notes.filter(n => n.type === 'planned');

  function renderNoteList(list: Note[], listType: 'completed' | 'planned') {
    if (list.length === 0) {
      return (
        <EmptyState
          compact
          title={`暂无${TYPE_CONFIG[listType].label}的笔记`}
        />
      );
    }
    return (
      <div className="space-y-3">
        {list.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            isDragging={dragNoteId === note.id}
            onDragStart={() => setDragNoteId(note.id)}
            onToggle={() => handleToggleType(note)}
            onDelete={() => handleDelete(note.id)}
            onUpdate={(content) => handleUpdate(note.id, content)}
          />
        ))}
      </div>
    );
  }

  function renderColumn(
    columnType: 'completed' | 'planned',
    page?: number,
    onPageChange?: (page: number) => void,
  ) {
    const config = TYPE_CONFIG[columnType];
    const isOver = dropTarget === columnType;
    const notesList = columnType === 'completed' ? completedNotes : plannedNotes;
    const totalPages = page ? Math.max(1, Math.ceil(notesList.length / PAGE_SIZE)) : 1;
    const pagedList = page ? notesList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : notesList;

    return (
      <div
        onDragEnter={() => setDropTarget(columnType)}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const id = parseInt(e.dataTransfer.getData('text/plain'));
          if (!isNaN(id)) handleDrop(id, columnType);
          setDropTarget(null);
          setDragNoteId(null);
        }}
        className={cn(
          'rounded-2xl border p-5 transition-all duration-200',
          isOver ? config.column : 'border-hairline bg-surface-1 backdrop-blur-xl',
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={cn('w-2 h-2 rounded-full', config.dot)} />
          <h2 className="text-base font-semibold text-ink">{config.label}</h2>
          <Tag className="!rounded !text-[11px]">{notesList.length}</Tag>
        </div>
        {loading ? (
          <EmptyState compact title="加载中..." />
        ) : (
          renderNoteList(pagedList, columnType)
        )}
        {page && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="w-7 h-7 rounded-lg bg-surface-2 text-ink-3 hover:bg-hairline-active disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              aria-label="上一页"
            >
              <IconLeft style={{ fontSize: 12 }} />
            </button>
            <span className="text-xs text-ink-3">{page} / {totalPages}</span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="w-7 h-7 rounded-lg bg-surface-2 text-ink-3 hover:bg-hairline-active disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              aria-label="下一页"
            >
              <IconRight style={{ fontSize: 12 }} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen px-5 py-5"
      onDragEnd={() => { setDragNoteId(null); setDropTarget(null); }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] bg-dashboard-grid bg-grid-lg" />

      <div className="relative">
        <PageHeader
          title="开发笔记"
          meta={<span>功能变更和待办优化记录</span>}
        />

        <div className="rounded-2xl border border-hairline bg-surface-1 backdrop-blur-xl p-5 shadow-2xl mb-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-ink-2">新增笔记</span>
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all border',
                      newType === 'completed'
                        ? 'bg-inflow-softer text-inflow border-inflow/30'
                        : 'bg-surface-2 text-ink-3 border-transparent hover:text-ink-2',
                    )}
                    onClick={() => setNewType('completed')}
                  >
                    已完成
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all border',
                      newType === 'planned'
                        ? 'bg-primary-softer text-primary border-primary/30'
                        : 'bg-surface-2 text-ink-3 border-transparent hover:text-ink-2',
                    )}
                    onClick={() => setNewType('planned')}
                  >
                    待计划
                  </span>
                </div>
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="写一条笔记..."
                className="w-full bg-black/40 border border-hairline rounded-lg px-4 py-3 text-sm text-ink outline-none focus:border-primary resize-none transition-all"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <Button
              type="primary"
              onClick={handleCreate}
              icon={<IconPlus />}
              className="!bg-primary !border-primary !text-primary-ink !h-10 !font-semibold shadow-glow-primary hover:!brightness-110"
            >
              添加
            </Button>
          </div>
          <p className="text-[11px] text-ink-3 mt-2">⌘+Enter 快速添加</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderColumn('planned')}
          {renderColumn('completed', completedPage, (p) => setCompletedPage(p))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Button, Tag } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconCheck, IconClose, IconPlus, IconLeft, IconRight } from '@arco-design/web-react/icon';
import { api } from '../api';

interface Note {
  id: number;
  type: 'completed' | 'planned';
  content: string;
  created_at: string;
  updated_at: string;
}

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

  const isCompleted = note.type === 'completed';

  return (
    <div
      draggable={!editing}
      onDragStart={handleDragStart}
      className={`rounded-xl border backdrop-blur-xl p-4 shadow-lg transition-all duration-200 group ${
        isCompleted
          ? 'border-emerald-500/20 bg-emerald-900/10 hover:border-emerald-500/30'
          : 'border-cyan-500/20 bg-cyan-900/10 hover:border-cyan-500/30'
      } ${isDragging ? 'opacity-30 scale-95' : ''} cursor-grab active:cursor-grabbing select-none`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            isCompleted
              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
              : 'border-gray-500 hover:border-cyan-400'
          }`}
        >
          {isCompleted && (
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
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50 resize-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center transition-all"
                >
                  <IconCheck style={{ fontSize: 14 }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="w-7 h-7 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 flex items-center justify-center transition-all"
                >
                  <IconClose style={{ fontSize: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-gray-500">{note.created_at}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => { setEditContent(note.content); setEditing(true); }}
            className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all"
          >
            <IconEdit style={{ fontSize: 13 }} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
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
    const newType = note.type === 'completed' ? 'planned' : 'completed';
    try {
      await api.updateNote(note.id, newType, note.content);
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
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">暂无{listType === 'completed' ? '已完成' : '待计划'}的笔记</p>
        </div>
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
    title: string,
    count: number,
    dotColor: string,
    tagColor: string,
    notesList: Note[],
    page?: number,
    onPageChange?: (page: number) => void,
  ) {
    const isOver = dropTarget === columnType;
    const pageSize = 5;
    const totalPages = page ? Math.max(1, Math.ceil(notesList.length / pageSize)) : 1;
    const pagedList = page ? notesList.slice((page - 1) * pageSize, page * pageSize) : notesList;

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
        className={`rounded-2xl border p-5 transition-all duration-200 ${
          isOver
            ? columnType === 'completed'
              ? 'border-emerald-500/40 bg-emerald-900/20'
              : 'border-cyan-500/40 bg-cyan-900/20'
            : 'border-white/[0.06] bg-black/30 backdrop-blur-xl'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <Tag color={tagColor} style={{ borderRadius: 4, fontSize: 11 }}>
            {count}
          </Tag>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">加载中...</div>
        ) : (
          renderNoteList(pagedList, columnType)
        )}
        {page && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <IconLeft style={{ fontSize: 12 }} />
            </button>
            <span className="text-xs text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all"
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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative">
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            开发笔记
          </h1>
          <span className="text-sm text-gray-500">功能变更和待办优化记录</span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-5 shadow-2xl mb-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">新增笔记</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all ${
                      newType === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'
                    }`}
                    onClick={() => setNewType('completed')}
                  >
                    已完成
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all ${
                      newType === 'planned'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'
                    }`}
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
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 resize-none transition-all"
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
              style={{
                background: 'linear-gradient(135deg, #0891b2, #0d9488)',
                border: 'none',
                height: 38,
                fontWeight: 600,
                paddingLeft: 20,
                paddingRight: 20,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
                marginBottom: 0,
              }}
            >
              添加
            </Button>
          </div>
          <p className="text-[11px] text-gray-600 mt-2">⌘+Enter 快速添加</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderColumn('planned', '待计划', plannedNotes.length, 'bg-cyan-400', 'cyan', plannedNotes)}
          {renderColumn('completed', '已完成', completedNotes.length, 'bg-emerald-400', 'green', completedNotes, completedPage, (p) => setCompletedPage(p))}
        </div>
      </div>
    </div>
  );
}

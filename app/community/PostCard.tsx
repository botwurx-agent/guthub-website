'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, Pin, Send, Pencil, Trash2, X, Check } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Post } from './CommunityClient'

const TAG_OPTIONS = ['Success story', 'Expert AMA', 'Tips & tricks', 'IBS support', 'Question', 'General']

const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Success story': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Expert AMA':    { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  'Tips & tricks': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  'IBS support':   { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  'Question':      { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  'General':       { bg: 'var(--cream-100)', color: 'var(--ink-600)', border: 'var(--cream-200)' },
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function avatarColor(name: string): { bg: string; color: string } {
  const colors = [
    { bg: '#d1fae5', color: '#065f46' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#4c1d95' },
    { bg: '#fce7f3', color: '#831843' },
    { bg: '#dbeafe', color: '#1e3a5f' },
    { bg: '#fef9c3', color: '#713f12' },
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

type Comment = {
  id: string
  user_id: string
  body: string
  created_at: string
  profiles: { name: string | null }[] | null
}

export default function PostCard({
  post, isLiked, currentUserId, currentUserName, supabase,
  onLike, onUpdate, onDelete,
}: {
  post: Post
  isLiked: boolean
  currentUserId: string
  currentUserName: string | null
  supabase: SupabaseClient
  onLike: () => void
  onUpdate: (updated: Post) => void
  onDelete: () => void
}) {
  const profileArr = post.profiles as { name: string | null }[] | null
  const authorName = profileArr?.[0]?.name ?? 'GutHub member'
  const av = avatarColor(authorName)
  const tagStyle = TAG_COLORS[post.tag] ?? TAG_COLORS['General']
  const isOwn = post.user_id === currentUserId

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editBody, setEditBody] = useState(post.body)
  const [editTag, setEditTag] = useState(post.tag)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function toggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsLoaded) {
      const { data } = await supabase
        .from('community_post_comments')
        .select('id, user_id, body, created_at, profiles!community_post_comments_user_id_fkey(name)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      setComments((data ?? []) as unknown as Comment[])
      setCommentsLoaded(true)
    }
  }

  async function submitComment() {
    const body = commentText.trim()
    if (!body) return
    setPostingComment(true)
    const { data, error } = await supabase
      .from('community_post_comments')
      .insert({ post_id: post.id, user_id: currentUserId, body })
      .select('id, user_id, body, created_at, profiles!community_post_comments_user_id_fkey(name)')
      .single()
    setPostingComment(false)
    if (!error && data) {
      setComments(prev => [...prev, data as unknown as Comment])
      setCommentText('')
      onUpdate({ ...post, comment_count: post.comment_count + 1 })
    }
  }

  async function saveEdit() {
    const t = editTitle.trim(), b = editBody.trim()
    if (!t || !b) return
    setSavingEdit(true)
    setEditError(null)
    const { data, error } = await supabase
      .from('community_posts')
      .update({ title: t, body: b, tag: editTag })
      .eq('id', post.id)
      .select('id, user_id, title, body, tag, pinned, like_count, comment_count, created_at, profiles!community_posts_user_id_fkey(name)')
      .single()
    setSavingEdit(false)
    if (error || !data) {
      setEditError(error?.message ?? 'Could not save changes.')
      return
    }
    onUpdate(data as unknown as Post)
    setIsEditing(false)
  }

  async function performDelete() {
    setDeleting(true)
    const { error } = await supabase.from('community_posts').delete().eq('id', post.id)
    setDeleting(false)
    if (!error) onDelete()
  }

  return (
    <div style={{
      background: post.pinned ? 'var(--terracotta-50)' : '#fff',
      border: `1px solid ${post.pinned ? 'var(--terracotta-300)' : 'var(--cream-200)'}`,
      borderRadius: 16, padding: '20px 22px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, flexShrink: 0 }}>
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)' }}>{authorName}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>· {timeAgo(post.created_at)}</span>
          {post.pinned && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, padding: '2px 8px' }}>
              <Pin size={10} /> Pinned
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, background: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}`, borderRadius: 999, padding: '2px 9px' }}>
            {post.tag}
          </span>
        </div>
        {isOwn && !isEditing && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setIsEditing(true)} title="Edit"
              style={{ padding: 7, borderRadius: 8, border: 'none', background: 'var(--cream-50)', color: 'var(--ink-500)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Pencil size={14} />
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Delete"
              style={{ padding: 7, borderRadius: 8, border: 'none', background: 'var(--cream-50)', color: 'var(--ink-500)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Body or edit form */}
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Title"
            style={{ padding: '11px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' }}
          />
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            style={{ padding: '11px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAG_OPTIONS.map(t => {
              const active = editTag === t
              return (
                <button key={t} type="button" onClick={() => setEditTag(t)}
                  style={{ padding: '5px 11px', borderRadius: 999, border: `1px solid ${active ? 'var(--terracotta-400)' : 'var(--cream-200)'}`, background: active ? 'var(--terracotta-50)' : '#fff', color: active ? 'var(--terracotta-600)' : 'var(--ink-600)', fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer' }}>
                  {t}
                </button>
              )
            })}
          </div>
          {editError && (
            <div style={{ padding: '8px 11px', borderRadius: 8, background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)', color: 'var(--error)', fontSize: 13 }}>
              {editError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setIsEditing(false); setEditTitle(post.title); setEditBody(post.body); setEditTag(post.tag); setEditError(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--cream-200)', background: '#fff', color: 'var(--ink-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <X size={14} /> Cancel
            </button>
            <button onClick={saveEdit} disabled={savingEdit || !editTitle.trim() || !editBody.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, border: 'none', background: savingEdit ? 'var(--ink-300)' : 'var(--terracotta-500)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>
              <Check size={14} /> {savingEdit ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', margin: '0 0 8px', lineHeight: 1.25, color: 'var(--ink-900)' }}>
            {post.title}
          </h3>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 16px', color: 'var(--ink-500)', whiteSpace: 'pre-wrap' }}>
            {post.body}
          </p>
        </>
      )}

      {/* Actions */}
      {!isEditing && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onLike}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: isLiked ? '#fef2f2' : 'var(--cream-50)', color: isLiked ? '#dc2626' : 'var(--ink-500)', fontSize: 13, fontWeight: isLiked ? 600 : 400, cursor: 'pointer', transition: 'all 120ms' }}>
            <Heart size={14} fill={isLiked ? '#dc2626' : 'none'} /> {post.like_count}
          </button>
          <button onClick={toggleComments}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: showComments ? 'var(--terracotta-50)' : 'var(--cream-50)', color: showComments ? 'var(--terracotta-600)' : 'var(--ink-500)', fontSize: 13, fontWeight: showComments ? 600 : 400, cursor: 'pointer' }}>
            <MessageCircle size={14} /> {post.comment_count}
          </button>
          <button onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => {}).catch(() => {})}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--cream-50)', color: 'var(--ink-500)', fontSize: 13, cursor: 'pointer' }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      )}

      {/* Comments */}
      {showComments && !isEditing && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--cream-200)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
            {comments.length === 0 && commentsLoaded && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)', fontStyle: 'italic' }}>
                No comments yet — be the first.
              </p>
            )}
            {comments.map(c => {
              const cName = c.profiles?.[0]?.name ?? 'GutHub member'
              const ca = avatarColor(cName)
              return (
                <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: ca.bg, color: ca.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
                    {cName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{cName}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>· {timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
              placeholder={`Comment as ${currentUserName ?? 'you'}…`}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--cream-200)', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none' }}
            />
            <button onClick={submitComment} disabled={postingComment || !commentText.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 8, border: 'none', background: !commentText.trim() ? 'var(--cream-200)' : 'var(--terracotta-500)', color: !commentText.trim() ? 'var(--ink-400)' : '#fff', fontSize: 13, fontWeight: 600, cursor: !commentText.trim() ? 'not-allowed' : 'pointer' }}>
              <Send size={13} /> {postingComment ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div onClick={() => !deleting && setConfirmDelete(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, maxWidth: 380, width: '90%' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--ink-900)' }}>Delete this post?</h3>
            <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.5 }}>
              This will permanently remove the post and all of its comments. This can&apos;t be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--cream-200)', background: '#fff', color: 'var(--ink-600)', fontSize: 13.5, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                Cancel
              </button>
              <button onClick={performDelete} disabled={deleting}
                style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Edit3, Calendar, Users, ChevronRight, Send } from 'lucide-react'
import PostCard from './PostCard'

export type Post = {
  id: string
  user_id: string
  title: string
  body: string
  tag: string
  pinned: boolean
  like_count: number
  comment_count: number
  created_at: string
  profiles: { name: string | null }[] | null
}

type Group = {
  id: string
  name: string
  description: string | null
  member_count: number
}

const TABS = [
  { id: 'all',     label: 'All posts' },
  { id: 'success', label: 'Success stories' },
  { id: 'ama',     label: 'Expert AMAs' },
  { id: 'tips',    label: 'Tips & tricks' },
  { id: 'ibs',     label: 'IBS support' },
]

const TAG_OPTIONS = ['Success story', 'Expert AMA', 'Tips & tricks', 'IBS support', 'Question', 'General']

const TAG_TAB_MAP: Record<string, string> = {
  'Success story': 'success',
  'Expert AMA':    'ama',
  'Tips & tricks': 'tips',
  'IBS support':   'ibs',
}

export default function CommunityClient({
  initialPosts,
  likedPostIds,
  groups,
  joinedGroupIds,
  userId,
  userName,
}: {
  initialPosts: Post[]
  likedPostIds: string[]
  groups: Group[]
  joinedGroupIds: string[]
  userId: string
  userName: string | null
}) {
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [liked, setLiked] = useState<Set<string>>(new Set(likedPostIds))
  const [joined, setJoined] = useState<Set<string>>(new Set(joinedGroupIds))
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Share modal state
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newTag, setNewTag] = useState('General')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const filteredPosts = posts.filter(p => {
    if (activeTab !== 'all') {
      const expectedTab = TAG_TAB_MAP[p.tag]
      if (expectedTab !== activeTab) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
    }
    return true
  })

  async function toggleLike(postId: string) {
    const isLiked = liked.has(postId)
    // Optimistic update
    setLiked(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) } : p
    ))
    if (isLiked) {
      await supabase.from('community_post_likes').delete().match({ post_id: postId, user_id: userId })
    } else {
      await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId })
    }
  }

  async function toggleGroup(groupId: string) {
    const isJoined = joined.has(groupId)
    setJoined(prev => {
      const next = new Set(prev)
      isJoined ? next.delete(groupId) : next.add(groupId)
      return next
    })
    if (isJoined) {
      await supabase.from('community_group_members').delete().match({ group_id: groupId, user_id: userId })
    } else {
      await supabase.from('community_group_members').insert({ group_id: groupId, user_id: userId })
    }
  }

  async function submitPost() {
    if (!newTitle.trim() || !newBody.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    const { data: inserted, error } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, title: newTitle.trim(), body: newBody.trim(), tag: newTag })
      .select('id, user_id, title, body, tag, pinned, like_count, comment_count, created_at, profiles!community_posts_user_id_fkey(name)')
      .single()
    setSubmitting(false)
    if (error || !inserted) {
      setSubmitError(error?.message ?? 'Could not post — please try again.')
      return
    }
    setPosts(prev => [inserted as unknown as Post, ...prev])
    setSubmitted(true)
    setTimeout(() => {
      setShowShareModal(false)
      setSubmitted(false)
      setNewTitle('')
      setNewBody('')
      setNewTag('General')
    }, 1800)
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta-500)', display: 'block', marginBottom: 6 }}>
            Community
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, margin: '0 0 8px', color: 'var(--ink-900)', lineHeight: 1.2 }}>
            People on the <em style={{ fontStyle: 'italic', color: 'var(--terracotta-500)' }}>same path</em>.
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-400)', lineHeight: 1.6 }}>
            Stories, tips, and moderated expert AMAs from the GutHub community.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {showSearch ? (
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setShowSearch(false) }}
              placeholder="Search posts…"
              style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 14, color: 'var(--ink-800)', background: '#fff', outline: 'none', width: 200 }}
            />
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: '1px solid var(--cream-200)', background: '#fff', fontSize: 14, fontWeight: 500, color: 'var(--ink-600)', cursor: 'pointer' }}
            >
              <Search size={15} /> Search
            </button>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: 'var(--terracotta-500)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            <Edit3 size={15} /> Share your story
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
        {/* Feed */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--cream-200)', marginBottom: 20, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: activeTab === t.id ? 600 : 400,
                  color: activeTab === t.id ? 'var(--terracotta-500)' : 'var(--ink-400)',
                  borderBottom: activeTab === t.id ? '2px solid var(--terracotta-500)' : '2px solid transparent',
                  marginBottom: -1, whiteSpace: 'nowrap', transition: 'all 120ms',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                  {searchQuery ? `No posts found for "${searchQuery}"` : 'No posts yet'}
                </div>
                <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 20px' }}>
                  {searchQuery ? 'Try a different search.' : 'Be the first to share your story with the community.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: 'var(--terracotta-500)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Share your story
                  </button>
                )}
              </div>
            ) : filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={liked.has(post.id)}
                currentUserId={userId}
                currentUserName={userName}
                supabase={supabase}
                onLike={() => toggleLike(post.id)}
                onUpdate={updated => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
                onDelete={() => setPosts(prev => prev.filter(p => p.id !== post.id))}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
          {/* Live event */}
          <div style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444' }}>Live right now</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.3, margin: '0 0 8px', fontWeight: 400, color: 'var(--ink-900)' }}>
              IBS &amp; stress — a conversation with <em>Dr. Parham Ahmadi</em>.
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 14 }}>
              Starts in 14 minutes · 240 attending
            </div>
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', borderRadius: 9, border: 'none', background: 'var(--forest-500)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <Calendar size={14} /> Add to calendar
            </button>
          </div>

          {/* Suggested groups */}
          {groups.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--ink-800)' }}>Suggested for you</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groups.map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {g.member_count.toLocaleString()} members
                      </div>
                    </div>
                    <button
                      onClick={() => toggleGroup(g.id)}
                      style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${joined.has(g.id) ? 'var(--forest-400)' : 'var(--cream-200)'}`, background: joined.has(g.id) ? 'var(--forest-50)' : '#fff', color: joined.has(g.id) ? 'var(--forest-600)' : 'var(--ink-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 120ms', flexShrink: 0 }}
                    >
                      {joined.has(g.id) ? 'Joined' : 'Join'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community guidelines */}
          <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--ink-800)' }}>Community guidelines</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.65, margin: 0 }}>
              Kind, specific, evidence-based. No supplement pitches. Every AMA is moderated by a licensed clinician.
            </p>
          </div>

          {/* User card */}
          {userName && (
            <div style={{ background: 'var(--forest-500)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #e07a5f, #f4b860)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: '#fff', fontWeight: 500 }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{userName}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>GutHub member</div>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxSizing: 'border-box' }}
              >
                Share your story <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share story modal */}
      {showShareModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowShareModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🌿</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 8 }}>Story shared!</div>
                <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>Your post is now live in the community.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, margin: '0 0 6px', color: 'var(--ink-900)' }}>
                  Share your story
                </h2>
                <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 22px', lineHeight: 1.5 }}>
                  Be specific — the more detail you share, the more helpful it is for others.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 6 }}>Title</label>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="What's your story about?"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 15, color: 'var(--ink-800)', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 6 }}>Your story</label>
                    <textarea
                      value={newBody}
                      onChange={e => setNewBody(e.target.value)}
                      placeholder="Share your experience, what you tried, what worked…"
                      rows={5}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 15, color: 'var(--ink-800)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 8 }}>Tag</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {TAG_OPTIONS.map(t => (
                        <button
                          key={t}
                          onClick={() => setNewTag(t)}
                          style={{
                            padding: '6px 13px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                            border: `1px solid ${newTag === t ? 'var(--terracotta-400)' : 'var(--cream-200)'}`,
                            background: newTag === t ? 'var(--terracotta-50)' : 'var(--cream-50)',
                            color: newTag === t ? 'var(--terracotta-600)' : 'var(--ink-600)',
                            fontWeight: newTag === t ? 600 : 400,
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {submitError && (
                  <div style={{
                    marginTop: 14, padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(180,66,44,0.08)', border: '1px solid rgba(180,66,44,0.2)',
                    color: 'var(--error)', fontSize: 13, lineHeight: 1.4,
                  }}>
                    {submitError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button
                    onClick={() => setShowShareModal(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid var(--cream-200)', background: '#fff', fontSize: 14, fontWeight: 600, color: 'var(--ink-600)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPost}
                    disabled={submitting || !newTitle.trim() || !newBody.trim()}
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 9, border: 'none', background: (!newTitle.trim() || !newBody.trim()) ? 'var(--cream-200)' : 'var(--terracotta-500)', color: (!newTitle.trim() || !newBody.trim()) ? 'var(--ink-400)' : '#fff', fontSize: 14, fontWeight: 600, cursor: (!newTitle.trim() || !newBody.trim()) ? 'not-allowed' : 'pointer', transition: 'background 150ms' }}
                  >
                    <Send size={14} /> {submitting ? 'Posting…' : 'Post to community'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, Search, Edit3, Pin, Calendar, Users, ChevronRight } from 'lucide-react'

type Post = {
  id: number
  author: string
  avatar: string
  avatarBg: string
  avatarColor: string
  time: string
  title: string
  body: string
  likes: number
  comments: number
  tag: string
  pinned?: boolean
  tab: string[]
}

const POSTS: Post[] = [
  {
    id: 1,
    author: 'Maria K.',
    avatar: 'M',
    avatarBg: '#d1fae5',
    avatarColor: '#065f46',
    time: '2h',
    title: 'Three months on GutHub: the trigger I never suspected',
    body: 'I\'d been convinced gluten was the problem for years. Turns out my bloating correlated almost perfectly with raw cruciferous veg — which I was eating three times a week for "health." The Coach spotted it in 9 days.',
    likes: 142,
    comments: 38,
    tag: 'Success story',
    tab: ['following', 'success'],
  },
  {
    id: 2,
    author: 'Dr. Hannah L.',
    avatar: 'H',
    avatarBg: '#fef3c7',
    avatarColor: '#92400e',
    time: '1d',
    title: 'Reflux 101: the small changes that actually matter',
    body: 'The most effective interventions for nocturnal reflux, ranked by the evidence. Hint: none of them are fancy supplements.',
    likes: 89,
    comments: 12,
    tag: 'Expert AMA',
    pinned: true,
    tab: ['following', 'ama'],
  },
  {
    id: 3,
    author: 'James R.',
    avatar: 'J',
    avatarBg: '#ede9fe',
    avatarColor: '#4c1d95',
    time: '2d',
    title: 'Down 18 lb in 60 days without tracking calories',
    body: 'All I did was follow my meal plan and log meals. The weight came off without me obsessing about it.',
    likes: 76,
    comments: 22,
    tag: 'Success story',
    tab: ['following', 'success'],
  },
  {
    id: 4,
    author: 'Priya S.',
    avatar: 'P',
    avatarBg: '#fce7f3',
    avatarColor: '#831843',
    time: '3d',
    title: 'My low-FODMAP grocery haul (with photos)',
    body: 'Trader Joe\'s and Whole Foods run. Sharing in case it helps someone who\'s just starting out.',
    likes: 54,
    comments: 16,
    tag: 'Tips & tricks',
    tab: ['following', 'tips'],
  },
  {
    id: 5,
    author: 'Carlos M.',
    avatar: 'C',
    avatarBg: '#dbeafe',
    avatarColor: '#1e3a5f',
    time: '4d',
    title: 'Managing IBS-D with a demanding travel schedule',
    body: 'I fly almost every week for work. Here\'s the system I built with my GutHub coach that finally keeps flares under control on the road.',
    likes: 63,
    comments: 29,
    tag: 'IBS support',
    tab: ['following', 'ibs'],
  },
  {
    id: 6,
    author: 'Dr. Yuki T.',
    avatar: 'Y',
    avatarBg: '#fef9c3',
    avatarColor: '#713f12',
    time: '5d',
    title: 'The gut-brain axis: what the latest research actually says',
    body: 'There\'s a lot of noise around "gut feelings." I\'ll walk through three recent RCTs and what they mean for daily practice.',
    likes: 112,
    comments: 8,
    tag: 'Expert AMA',
    tab: ['ama'],
  },
  {
    id: 7,
    author: 'Leila N.',
    avatar: 'L',
    avatarBg: '#d1fae5',
    avatarColor: '#065f46',
    time: '6d',
    title: '5 low-FODMAP breakfast ideas that actually taste good',
    body: 'Overnight oats, egg muffins, and three others I meal-prep every Sunday. Saves my week every time.',
    likes: 47,
    comments: 11,
    tag: 'Tips & tricks',
    tab: ['tips'],
  },
]

const TABS = [
  { id: 'following',  label: 'Following' },
  { id: 'success',    label: 'Success stories' },
  { id: 'ama',        label: 'Expert AMAs' },
  { id: 'tips',       label: 'Tips & tricks' },
  { id: 'ibs',        label: 'IBS support' },
]

const SUGGESTED_GROUPS = [
  { name: 'Low-FODMAP kitchen',  members: '3,240' },
  { name: 'Reflux recovery',     members: '1,890' },
  { name: 'Midlife metabolism',  members: '2,104' },
  { name: 'SIBO survivors',      members: '876' },
]

const TAG_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Success story': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Expert AMA':    { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  'Tips & tricks': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  'IBS support':   { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
}

export default function CommunityClient({ userName }: { userName: string | null }) {
  const [activeTab, setActiveTab] = useState('following')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const filteredPosts = POSTS.filter(p => {
    const matchesTab = p.tab.includes(activeTab)
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.body.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  function toggleLike(id: number) {
    setLikedPosts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-400)', fontSize: 14 }}>
                No posts found{searchQuery ? ` for "${searchQuery}"` : ''}.
              </div>
            ) : filteredPosts.map(post => {
              const tagStyle = TAG_COLORS[post.tag] ?? { bg: 'var(--cream-100)', color: 'var(--ink-600)', border: 'var(--cream-200)' }
              const liked = likedPosts.has(post.id)
              return (
                <div
                  key={post.id}
                  style={{
                    background: post.pinned ? 'var(--terracotta-50)' : '#fff',
                    border: `1px solid ${post.pinned ? 'var(--terracotta-300)' : 'var(--cream-200)'}`,
                    borderRadius: 16, padding: '20px 22px',
                    transition: 'box-shadow 160ms',
                  }}
                >
                  {/* Post header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: post.avatarBg, color: post.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, flexShrink: 0 }}>
                      {post.avatar}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)' }}>{post.author}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>· {post.time}</span>
                      {post.pinned && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, padding: '2px 8px' }}>
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, background: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}`, borderRadius: 999, padding: '2px 9px' }}>
                        {post.tag}
                      </span>
                    </div>
                  </div>

                  {/* Post body */}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', margin: '0 0 8px', lineHeight: 1.25, color: 'var(--ink-900)' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 16px', color: 'var(--ink-500)' }}>
                    {post.body}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: liked ? '#fef2f2' : 'var(--cream-50)', color: liked ? '#dc2626' : 'var(--ink-500)', fontSize: 13, fontWeight: liked ? 600 : 400, cursor: 'pointer', transition: 'all 120ms' }}
                    >
                      <Heart size={14} fill={liked ? '#dc2626' : 'none'} /> {post.likes + (liked ? 1 : 0)}
                    </button>
                    <button
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--cream-50)', color: 'var(--ink-500)', fontSize: 13, cursor: 'pointer' }}
                    >
                      <MessageCircle size={14} /> {post.comments}
                    </button>
                    <button
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--cream-50)', color: 'var(--ink-500)', fontSize: 13, cursor: 'pointer' }}
                    >
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
          {/* Live event */}
          <div style={{ background: 'var(--cream-100)', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px 20px' }}>
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
          <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px 20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--ink-800)' }}>Suggested for you</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SUGGESTED_GROUPS.map(g => (
                <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 2 }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={11} /> {g.members} members
                    </div>
                  </div>
                  <button
                    onClick={() => setJoinedGroups(prev => { const n = new Set(prev); n.has(g.name) ? n.delete(g.name) : n.add(g.name); return n })}
                    style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${joinedGroups.has(g.name) ? 'var(--forest-400)' : 'var(--cream-200)'}`, background: joinedGroups.has(g.name) ? 'var(--forest-50)' : '#fff', color: joinedGroups.has(g.name) ? 'var(--forest-600)' : 'var(--ink-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 120ms' }}
                  >
                    {joinedGroups.has(g.name) ? 'Joined' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Community guidelines */}
          <div style={{ background: '#fff', border: '1px solid var(--cream-200)', borderRadius: 16, padding: '20px 20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--ink-800)' }}>Community guidelines</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.65, margin: 0 }}>
              Kind, specific, evidence-based. No supplement pitches. Every AMA is moderated by a licensed clinician.
            </p>
          </div>

          {/* My profile in community */}
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
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
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, margin: '0 0 6px', color: 'var(--ink-900)' }}>
              Share your story
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 22px', lineHeight: 1.5 }}>
              Community posts are moderated before appearing. Be specific — the more detail you share, the more helpful it is for others.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 6 }}>Title</label>
                <input
                  placeholder="What's your story about?"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 15, color: 'var(--ink-800)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 6 }}>Your story</label>
                <textarea
                  placeholder="Share your experience, what you tried, what worked…"
                  rows={5}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--cream-200)', fontSize: 15, color: 'var(--ink-800)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-400)', display: 'block', marginBottom: 8 }}>Tag</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Success story', 'Tips & tricks', 'IBS support', 'Question'].map(t => (
                    <button key={t} style={{ padding: '6px 13px', borderRadius: 8, border: '1px solid var(--cream-200)', background: 'var(--cream-50)', fontSize: 13, color: 'var(--ink-600)', cursor: 'pointer' }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid var(--cream-200)', background: '#fff', fontSize: 14, fontWeight: 600, color: 'var(--ink-600)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { alert('Your story has been submitted for moderation. Thank you!'); setShowShareModal(false) }}
                style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: 'var(--terracotta-500)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Submit for review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

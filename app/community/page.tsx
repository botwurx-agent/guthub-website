import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app/AppShell'
import CommunityClient, { type Post } from './CommunityClient'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?auth=signin')

  const [
    { data: posts },
    { data: userLikes },
    { data: groups },
    { data: userGroups },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id, user_id, title, body, tag, pinned, like_count, comment_count, created_at, profiles!community_posts_user_id_fkey(name)')
      .eq('status', 'active')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', user.id),
    supabase
      .from('community_groups')
      .select('id, name, description, member_count')
      .order('member_count', { ascending: false })
      .limit(4),
    supabase
      .from('community_group_members')
      .select('group_id')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single(),
  ])

  const likedPostIds = new Set((userLikes ?? []).map(l => l.post_id))
  const joinedGroupIds = new Set((userGroups ?? []).map(m => m.group_id))

  return (
    <AppShell>
      <CommunityClient
        initialPosts={(posts ?? []) as unknown as Post[]}
        likedPostIds={[...likedPostIds]}
        groups={groups ?? []}
        joinedGroupIds={[...joinedGroupIds]}
        userId={user.id}
        userName={profile?.name ?? null}
      />
    </AppShell>
  )
}

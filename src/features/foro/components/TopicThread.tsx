'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatRelativeDate } from '@/features/foro/utils/format'
import { Button } from '@/ui/Button'
import ForoPagination from './Pagination'
import ThreadHeader from './TopicThread/ThreadHeader'
import ModerationMenu from './TopicThread/ModerationMenu'
import ReplyList from './TopicThread/ReplyList'
import { type UserCardStrings } from './TopicThread/ReplyList/UserCard'
import ReplyForm from './TopicThread/ReplyForm'
import { useTopicThread, type TopicThreadProps } from './TopicThread/useTopicThread'

export default function TopicThread(props: TopicThreadProps) {
  const { space, forum, topic, isModerator, page, pageSize, totalPosts, ownerBack } = props
  const t = useTranslations('foro')
  const {
    user,
    posts,
    isLocked,
    isPinned,
    editingPostId,
    replyRef,
    forumHref,
    topicHref,
    buildPageHref,
    moveCandidates,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleDeletePost,
    handleDeleteTopic,
    handleTogglePinned,
    handleToggleLocked,
    handleMove,
    handleQuote,
  } = useTopicThread(props)

  const userCardStrings: UserCardStrings = {
    rank: {
      legend: t('thread.rank.legend'),
      veteran: t('thread.rank.veteran'),
      senior: t('thread.rank.senior'),
      registered: t('thread.rank.registered'),
      newbie: t('thread.rank.newbie'),
    },
    opLabel: t('thread.rank.op'),
    messagesLabel: t('thread.userCard.messages'),
    memberLabel: t('thread.userCard.member'),
    locationLabel: t('thread.userCard.location'),
  }

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        onClick={() => replyRef.current?.focus()}
        disabled={isLocked}
        color="primary"
      >
        {isLocked ? t('thread.actions.topicLocked') : t('thread.actions.reply')}
      </Button>
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          <strong className="text-neutral-900 dark:text-neutral-100">{totalPosts}</strong>{' '}
          {totalPosts === 1 ? t('thread.messageOne') : t('thread.messageOther')}
        </span>
        <ForoPagination
          page={page}
          pageSize={pageSize}
          total={totalPosts}
          buildHref={buildPageHref}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <ThreadHeader
        title={topic.title}
        subtitle={t('thread.subtitle', {
          author: topic.author.displayName,
          date: formatRelativeDate(topic.createdAt),
          views: topic.viewCount,
          viewsLabel: topic.viewCount === 1 ? t('thread.viewOne') : t('thread.viewOther'),
        })}
        crumbs={[
          ...(ownerBack ? [{ href: ownerBack.href, label: `← ${ownerBack.label}` }] : []),
          { href: '/foro', label: t('crumbs.foros') },
          { href: `/foro/${space.slug}`, label: space.name },
          { href: forumHref, label: forum.name },
        ]}
        action={
          isModerator ? (
            <ModerationMenu
              isPinned={isPinned}
              isLocked={isLocked}
              moveCandidates={moveCandidates}
              onTogglePinned={handleTogglePinned}
              onToggleLocked={handleToggleLocked}
              onDelete={handleDeleteTopic}
              onMove={handleMove}
            />
          ) : null
        }
      />

      {toolbar}

      <ReplyList
        posts={posts}
        topicHref={String(topicHref)}
        isLocked={isLocked}
        isModerator={isModerator}
        currentUserId={user?.id}
        editingPostId={editingPostId}
        userCardStrings={userCardStrings}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onDeletePost={handleDeletePost}
        onQuote={handleQuote}
        onSaveEdit={handleSaveEdit}
      />

      {toolbar}

      <ReplyForm ref={replyRef} topicId={topic.id} isLocked={isLocked} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800">
        <Link
          href={forumHref}
          className="text-primary-700 hover:underline dark:text-primary-400"
        >
          {t('thread.backToForum', { forumName: forum.name })}
        </Link>
        <Link href="/foro" className="text-primary-700 hover:underline dark:text-primary-400">
          {t('thread.goToIndex')}
        </Link>
      </div>
    </div>
  )
}

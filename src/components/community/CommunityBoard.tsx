"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CommunityComment,
  CommunityCommentResponse,
  CommunityCommentsResponse,
  CommunityMediaResponse,
  CommunityPost,
  CommunityPostResponse,
  CommunityPostsResponse,
  CommunitySort,
  CommunityVoteResponse,
} from '@/types/community';
import MarkdownPreview from '@/components/community/MarkdownPreview';
import MediaPreview from '@/components/community/MediaPreview';

const TAG_PRESETS = ['AI', 'Research', 'Internships', 'Events', 'Projects', 'Career'];

const INITIAL_COMPOSER = {
  title: '',
  content: '',
  tags: '',
  embedUrl: '',
};

type Notice = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type ComposerMode = 'write' | 'preview';

type CommunityCommentNode = Omit<CommunityComment, 'replies'> & {
  replies: CommunityCommentNode[];
};

function ChevronUpIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function MessageIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h8m-8 4h5m7-2a8 8 0 11-3.37-6.52L21 4l-1.48 4.37A7.96 7.96 0 0120 12z"
      />
    </svg>
  );
}

function PinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 4h10l-1 6 3 3v2h-6v5l-1 1-1-1v-5H5v-2l3-3-1-6z"
      />
    </svg>
  );
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-1.99-1.86L5 7m5 4v6m4-6v6m1-10V4H9v3M4 7h16"
      />
    </svg>
  );
}

function FlagIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v16m0-16h11l-1.5 4L16 13H5" />
    </svg>
  );
}

function SearchIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (abs < 60) return rtf.format(diffSeconds, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diffSeconds / 86400), 'day');

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

function buildCommentTree(comments: CommunityComment[]): CommunityCommentNode[] {
  const lookup = new Map<string, CommunityCommentNode>();
  const roots: CommunityCommentNode[] = [];

  comments.forEach((comment) => {
    lookup.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    const node = lookup.get(comment.id);
    if (!node) return;

    if (comment.parentId && lookup.has(comment.parentId)) {
      lookup.get(comment.parentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function collectCommentTreeIds(comments: CommunityComment[], rootId: string) {
  const children = new Map<string, string[]>();
  comments.forEach((comment) => {
    if (!comment.parentId) return;
    const next = children.get(comment.parentId) || [];
    next.push(comment.id);
    children.set(comment.parentId, next);
  });

  const ids = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || ids.has(id)) continue;
    ids.add(id);
    stack.push(...(children.get(id) || []));
  }

  return ids;
}

export default function CommunityBoard() {
  const { session, isAdmin, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [sort, setSort] = useState<CommunitySort>('latest');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>('write');
  const [composer, setComposer] = useState(INITIAL_COMPOSER);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    TAG_PRESETS.forEach((tag) => tagSet.add(tag));
    posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).slice(0, 16);
  }, [posts]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const params = new URLSearchParams({ sort, limit: '60' });
      if (search.trim()) params.set('search', search.trim());
      if (activeTag) params.set('tag', activeTag);

      const data = await readJson<CommunityPostsResponse>(
        await fetch(`/api/community/posts?${params.toString()}`, { cache: 'no-store' })
      );

      if (data.success) {
        setPosts(data.posts);
      } else {
        setNotice({ tone: 'error', text: data.message || 'Failed to load posts.' });
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load posts.',
      });
    } finally {
      setLoadingPosts(false);
    }
  }, [activeTag, search, sort]);

  useEffect(() => {
    const timeout = window.setTimeout(fetchPosts, search.trim() ? 300 : 0);
    return () => window.clearTimeout(timeout);
  }, [fetchPosts, search]);

  useEffect(() => {
    if (session && !authLoading) {
      setComposerOpen(true);
    }
  }, [authLoading, session]);

  const requireInteraction = () => {
    if (session) return true;
    setNotice({ tone: 'info', text: 'Sign in with your UD email to post, comment, and vote.' });
    return false;
  };

  const updatePost = (postId: string, patch: Partial<CommunityPost>) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...patch } : post))
    );
  };

  const handlePostVote = async (post: CommunityPost) => {
    if (!requireInteraction()) return;

    try {
      const data = await readJson<CommunityVoteResponse>(
        await fetch('/api/community/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'post', targetId: post.id }),
        })
      );

      if (data.success) {
        updatePost(post.id, {
          viewerHasUpvoted: data.voted === true,
          voteCount: typeof data.voteCount === 'number' ? data.voteCount : post.voteCount,
        });
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not update vote.',
      });
    }
  };

  const handlePinPost = async (post: CommunityPost) => {
    if (!isAdmin) return;

    try {
      const data = await readJson<CommunityPostResponse>(
        await fetch(`/api/community/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPinned: !post.isPinned }),
        })
      );

      if (data.success && data.post) {
        updatePost(post.id, data.post);
        setNotice({ tone: 'success', text: data.post.isPinned ? 'Post pinned.' : 'Post unpinned.' });
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not update post.',
      });
    }
  };

  const handleDeletePost = async (post: CommunityPost) => {
    if (!post.viewerCanDelete || !window.confirm('Delete this post and its comments?')) return;

    try {
      await readJson<{ success: boolean; message?: string }>(
        await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' })
      );
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (expandedPostId === post.id) setExpandedPostId(null);
      setNotice({ tone: 'success', text: 'Post deleted.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not delete post.',
      });
    }
  };

  const handleReport = async (targetType: 'post' | 'comment', targetId: string) => {
    if (!requireInteraction()) return;

    const reason = window.prompt('What should admins know about this report?');
    if (reason === null) return;

    try {
      await readJson<{ success: boolean; message?: string }>(
        await fetch('/api/community/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId, reason }),
        })
      );
      setNotice({ tone: 'success', text: 'Report submitted.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not submit report.',
      });
    }
  };

  const toggleComposerTag = (tag: string) => {
    const current = composer.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const exists = current.some((item) => item.toLowerCase() === tag.toLowerCase());
    const next = exists ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase()) : [...current, tag];
    setComposer((value) => ({ ...value, tags: next.join(', ') }));
  };

  const handleMediaFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setMediaFile(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'video/mp4'].includes(file.type)) {
      setNotice({ tone: 'error', text: 'Only JPEG, PNG, and MP4 media are supported.' });
      event.target.value = '';
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setNotice({ tone: 'error', text: 'Media must be 25MB or smaller.' });
      event.target.value = '';
      return;
    }

    setMediaFile(file);
  };

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireInteraction()) return;

    const title = composer.title.trim();
    if (!title) {
      setNotice({ tone: 'error', text: 'Title is required.' });
      return;
    }

    try {
      setSubmittingPost(true);
      setNotice(null);

      let mediaPayload: Partial<CommunityPost> = {};

      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);

        const upload = await readJson<CommunityMediaResponse>(
          await fetch('/api/community/media', {
            method: 'POST',
            body: formData,
          })
        );

        if (!upload.success || !upload.mediaUrl || !upload.mediaType) {
          throw new Error(upload.message || 'Media upload failed.');
        }

        mediaPayload = {
          mediaUrl: upload.mediaUrl,
          mediaPath: upload.mediaPath || null,
          mediaType: upload.mediaType,
          mediaName: upload.mediaName || mediaFile.name,
        };
      } else if (composer.embedUrl.trim()) {
        mediaPayload = {
          mediaUrl: composer.embedUrl.trim(),
          mediaPath: null,
          mediaType: 'embed',
          mediaName: composer.embedUrl.trim(),
        };
      }

      const data = await readJson<CommunityPostResponse>(
        await fetch('/api/community/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content: composer.content,
            tags: composer.tags,
            mediaUrl: mediaPayload.mediaUrl,
            mediaPath: mediaPayload.mediaPath,
            mediaType: mediaPayload.mediaType,
            mediaName: mediaPayload.mediaName,
          }),
        })
      );

      if (data.success && data.post) {
        setPosts((current) => [data.post as CommunityPost, ...current]);
        setComposer(INITIAL_COMPOSER);
        setMediaFile(null);
        setComposerMode('write');
        setComposerOpen(false);
        setNotice({ tone: 'success', text: 'Post published.' });
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not publish post.',
      });
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleCommentDelta = (postId: string, delta: number) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, commentCount: Math.max(0, post.commentCount + delta) }
          : post
      )
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-blue-primary sm:text-4xl">Community</h1>
                {isAdmin && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Admin mode
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-gray-600">
                Discuss projects, research, internships, events, and the practical parts of doing data science at UD.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search posts"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
                />
              </div>

              <div className="inline-flex h-10 overflow-hidden rounded-lg border border-gray-300 bg-white p-1">
                {(['latest', 'popular'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSort(option)}
                    className={`rounded-md px-3 text-sm font-medium capitalize transition-colors ${
                      sort === option
                        ? 'bg-blue-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTag('')}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
                !activeTag
                  ? 'border-blue-primary bg-blue-primary text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-primary hover:text-blue-primary'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
                  activeTag === tag
                    ? 'border-blue-primary bg-blue-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-primary hover:text-blue-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${
              notice.tone === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : notice.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {session ? (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setComposerOpen((value) => !value)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-gray-950">Create a post</span>
                  <span className="text-sm font-medium text-blue-primary">
                    {composerOpen ? 'Close' : 'Open'}
                  </span>
                </button>

                {composerOpen && (
                  <form onSubmit={handleCreatePost} className="border-t border-gray-200 p-5">
                    <div className="space-y-4">
                      <input
                        value={composer.title}
                        onChange={(event) =>
                          setComposer((value) => ({ ...value, title: event.target.value }))
                        }
                        placeholder="Title"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold text-gray-950 focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                        maxLength={140}
                        required
                      />

                      <div className="overflow-hidden rounded-lg border border-gray-300">
                        <div className="flex border-b border-gray-200 bg-gray-50 p-1">
                          {(['write', 'preview'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setComposerMode(mode)}
                              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                                composerMode === mode
                                  ? 'bg-white text-blue-primary shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                        {composerMode === 'write' ? (
                          <textarea
                            value={composer.content}
                            onChange={(event) =>
                              setComposer((value) => ({ ...value, content: event.target.value }))
                            }
                            placeholder="Share details, questions, links, or notes..."
                            className="min-h-[180px] w-full resize-y border-0 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-0"
                            maxLength={12000}
                          />
                        ) : (
                          <div className="min-h-[180px] px-3 py-3">
                            <MarkdownPreview content={composer.content} />
                          </div>
                        )}
                      </div>

                      <input
                        value={composer.tags}
                        onChange={(event) =>
                          setComposer((value) => ({ ...value, tags: event.target.value }))
                        }
                        placeholder="Tags"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="flex flex-wrap gap-2">
                        {TAG_PRESETS.map((tag) => {
                          const selected = composer.tags
                            .split(',')
                            .map((item) => item.trim().toLowerCase())
                            .includes(tag.toLowerCase());
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleComposerTag(tag)}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                selected
                                  ? 'border-blue-primary bg-blue-primary text-white'
                                  : 'border-gray-300 text-gray-700 hover:border-blue-primary hover:text-blue-primary'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-sm font-medium text-gray-700">Upload media</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,video/mp4"
                            onChange={handleMediaFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-primary hover:file:bg-blue-100"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-sm font-medium text-gray-700">Embed link</span>
                          <input
                            value={composer.embedUrl}
                            onChange={(event) =>
                              setComposer((value) => ({ ...value, embedUrl: event.target.value }))
                            }
                            placeholder="https://youtube.com/..."
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-500">
                          Posting as {session.user.email}
                        </div>
                        <button
                          type="submit"
                          disabled={submittingPost}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingPost ? 'Publishing...' : 'Publish'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-primary">Join the conversation</h2>
                    <p className="mt-1 text-sm text-blue-900">
                      Visitors can read posts. DSSA members can post, comment, vote, and report.
                    </p>
                  </div>
                  <Link
                    href="/login?redirect=/community"
                    className="inline-flex justify-center rounded-lg bg-blue-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}

            {loadingPosts ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-primary" />
                <p className="text-gray-600">Loading community posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-950">No posts yet</h2>
                <p className="mt-2 text-gray-600">Start a thread when something useful or interesting comes up.</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  expanded={expandedPostId === post.id}
                  onToggleComments={() =>
                    setExpandedPostId((current) => (current === post.id ? null : post.id))
                  }
                  onVote={() => handlePostVote(post)}
                  onPin={() => handlePinPost(post)}
                  onDelete={() => handleDeletePost(post)}
                  onReport={() => handleReport('post', post.id)}
                  onCommentDelta={(delta) => handleCommentDelta(post.id, delta)}
                  sessionActive={Boolean(session)}
                  onCommentReport={(commentId) => handleReport('comment', commentId)}
                />
              ))
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-950">Community Pulse</h2>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs font-medium text-gray-500">Posts</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-950">{posts.length}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs font-medium text-gray-500">Comments</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-950">
                    {posts.reduce((total, post) => total + post.commentCount, 0)}
                  </dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs font-medium text-gray-500">Votes</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-950">
                    {posts.reduce((total, post) => total + post.voteCount, 0)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-950">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-primary"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: CommunityPost;
  expanded: boolean;
  sessionActive: boolean;
  onToggleComments: () => void;
  onVote: () => void;
  onPin: () => void;
  onDelete: () => void;
  onReport: () => void;
  onCommentDelta: (delta: number) => void;
  onCommentReport: (commentId: string) => void;
}

function PostCard({
  post,
  expanded,
  sessionActive,
  onToggleComments,
  onVote,
  onPin,
  onDelete,
  onReport,
  onCommentDelta,
  onCommentReport,
}: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-4 p-5">
        <div className="hidden sm:block">
          <button
            type="button"
            onClick={onVote}
            title="Upvote post"
            className={`flex min-w-[54px] flex-col items-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              post.viewerHasUpvoted
                ? 'border-blue-primary bg-blue-50 text-blue-primary'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-primary hover:text-blue-primary'
            }`}
          >
            <ChevronUpIcon />
            <span>{post.voteCount}</span>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                <PinIcon className="h-3 w-3" />
                Pinned
              </span>
            )}
            <span className="font-medium text-gray-700">{post.authorName}</span>
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>

          <h2 className="break-words text-2xl font-bold text-gray-950">{post.title}</h2>

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-primary">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4">
            <MarkdownPreview content={post.content || ''} compact={!expanded} />
          </div>

          <MediaPreview mediaUrl={post.mediaUrl} mediaType={post.mediaType} mediaName={post.mediaName} />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onVote}
              title="Upvote post"
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold sm:hidden ${
                post.viewerHasUpvoted
                  ? 'border-blue-primary bg-blue-50 text-blue-primary'
                  : 'border-gray-200 text-gray-700 hover:border-blue-primary hover:text-blue-primary'
              }`}
            >
              <ChevronUpIcon />
              {post.voteCount}
            </button>

            <button
              type="button"
              onClick={onToggleComments}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-blue-primary hover:text-blue-primary"
            >
              <MessageIcon />
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </button>

            {sessionActive && (
              <button
                type="button"
                onClick={onReport}
                title="Report post"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-700"
              >
                <FlagIcon />
                Report
              </button>
            )}

            {post.viewerCanModerate && (
              <button
                type="button"
                onClick={onPin}
                title={post.isPinned ? 'Unpin post' : 'Pin post'}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-700"
              >
                <PinIcon />
                {post.isPinned ? 'Unpin' : 'Pin'}
              </button>
            )}

            {post.viewerCanDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="Delete post"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-red-400 hover:text-red-700"
              >
                <TrashIcon />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <CommentsPanel
          postId={post.id}
          sessionActive={sessionActive}
          onCommentDelta={onCommentDelta}
          onReport={onCommentReport}
        />
      )}
    </article>
  );
}

interface CommentsPanelProps {
  postId: string;
  sessionActive: boolean;
  onCommentDelta: (delta: number) => void;
  onReport: (commentId: string) => void;
}

function CommentsPanel({ postId, sessionActive, onCommentDelta, onReport }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await readJson<CommunityCommentsResponse>(
        await fetch(`/api/community/posts/${postId}/comments`, { cache: 'no-store' })
      );
      setComments(data.comments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  const submitComment = async (parentId: string | null) => {
    if (!sessionActive) {
      setError('Sign in with your UD email to comment.');
      return;
    }

    const content = parentId ? replyText.trim() : newComment.trim();
    if (!content) return;

    try {
      setSubmitting(true);
      setError(null);
      const data = await readJson<CommunityCommentResponse>(
        await fetch(`/api/community/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, parentId }),
        })
      );

      if (data.success && data.comment) {
        setComments((current) => [...current, data.comment as CommunityComment]);
        onCommentDelta(1);
        if (parentId) {
          setReplyText('');
          setReplyingTo(null);
        } else {
          setNewComment('');
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const voteComment = async (comment: CommunityComment) => {
    if (!sessionActive) {
      setError('Sign in with your UD email to vote.');
      return;
    }

    try {
      const data = await readJson<CommunityVoteResponse>(
        await fetch('/api/community/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'comment', targetId: comment.id }),
        })
      );

      if (data.success) {
        setComments((current) =>
          current.map((item) =>
            item.id === comment.id
              ? {
                  ...item,
                  viewerHasUpvoted: data.voted === true,
                  voteCount: typeof data.voteCount === 'number' ? data.voteCount : item.voteCount,
                }
              : item
          )
        );
      }
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : 'Could not update vote.');
    }
  };

  const deleteComment = async (comment: CommunityComment) => {
    if (!comment.viewerCanDelete || !window.confirm('Delete this comment and its replies?')) return;

    try {
      await readJson<{ success: boolean; message?: string }>(
        await fetch(`/api/community/comments/${comment.id}`, { method: 'DELETE' })
      );

      const removedIds = collectCommentTreeIds(comments, comment.id);
      setComments((current) => current.filter((item) => !removedIds.has(item.id)));
      onCommentDelta(-removedIds.size);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete comment.');
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-5 py-5">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      {sessionActive && (
        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3">
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Add a comment"
            className="min-h-[88px] w-full resize-y border-0 text-sm text-gray-800 focus:outline-none focus:ring-0"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => submitComment(null)}
              disabled={submitting || !newComment.trim()}
              className="rounded-lg bg-blue-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Comment
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Loading comments...</p>
      ) : tree.length === 0 ? (
        <p className="text-sm text-gray-600">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              sessionActive={sessionActive}
              replyingTo={replyingTo}
              replyText={replyText}
              submitting={submitting}
              onVote={voteComment}
              onDelete={deleteComment}
              onReport={onReport}
              onReplyStart={setReplyingTo}
              onReplyTextChange={setReplyText}
              onReplySubmit={submitComment}
              onReplyCancel={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommunityCommentNode;
  depth: number;
  sessionActive: boolean;
  replyingTo: string | null;
  replyText: string;
  submitting: boolean;
  onVote: (comment: CommunityComment) => void;
  onDelete: (comment: CommunityComment) => void;
  onReport: (commentId: string) => void;
  onReplyStart: (commentId: string) => void;
  onReplyTextChange: (value: string) => void;
  onReplySubmit: (parentId: string) => void;
  onReplyCancel: () => void;
}

function CommentItem({
  comment,
  depth,
  sessionActive,
  replyingTo,
  replyText,
  submitting,
  onVote,
  onDelete,
  onReport,
  onReplyStart,
  onReplyTextChange,
  onReplySubmit,
  onReplyCancel,
}: CommentItemProps) {
  const isReplying = replyingTo === comment.id;

  return (
    <div className={`${depth > 0 ? 'border-l border-gray-200 pl-4' : ''}`}>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{comment.authorName}</span>
          <span>{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <MarkdownPreview content={comment.content} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(comment)}
            title="Upvote comment"
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              comment.viewerHasUpvoted
                ? 'border-blue-primary bg-blue-50 text-blue-primary'
                : 'border-gray-200 text-gray-700 hover:border-blue-primary hover:text-blue-primary'
            }`}
          >
            <ChevronUpIcon className="h-3.5 w-3.5" />
            {comment.voteCount}
          </button>

          {sessionActive && (
            <>
              <button
                type="button"
                onClick={() => onReplyStart(comment.id)}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-blue-primary hover:text-blue-primary"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => onReport(comment.id)}
                title="Report comment"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-700"
              >
                <FlagIcon className="h-3.5 w-3.5" />
                Report
              </button>
            </>
          )}

          {comment.viewerCanDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment)}
              title="Delete comment"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-red-400 hover:text-red-700"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>

        {isReplying && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <textarea
              value={replyText}
              onChange={(event) => onReplyTextChange(event.target.value)}
              placeholder="Write a reply"
              className="min-h-[78px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onReplyCancel}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onReplySubmit(comment.id)}
                disabled={submitting || !replyText.trim()}
                className="rounded-lg bg-blue-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={Math.min(depth + 1, 5)}
              sessionActive={sessionActive}
              replyingTo={replyingTo}
              replyText={replyText}
              submitting={submitting}
              onVote={onVote}
              onDelete={onDelete}
              onReport={onReport}
              onReplyStart={onReplyStart}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

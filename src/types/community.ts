export type CommunitySort = 'latest' | 'popular';

export type CommunityMediaType = 'image' | 'video' | 'embed';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
  mediaUrl: string | null;
  mediaPath: string | null;
  mediaType: CommunityMediaType | null;
  mediaName: string | null;
  isPinned: boolean;
  voteCount: number;
  commentCount: number;
  viewerHasUpvoted: boolean;
  viewerCanDelete: boolean;
  viewerCanModerate: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
  voteCount: number;
  viewerHasUpvoted: boolean;
  viewerCanDelete: boolean;
  replies?: CommunityComment[];
}

export interface CommunityPostsResponse {
  success: boolean;
  posts: CommunityPost[];
  message?: string;
}

export interface CommunityPostResponse {
  success: boolean;
  post?: CommunityPost;
  message?: string;
}

export interface CommunityCommentsResponse {
  success: boolean;
  comments: CommunityComment[];
  message?: string;
}

export interface CommunityCommentResponse {
  success: boolean;
  comment?: CommunityComment;
  message?: string;
}

export interface CommunityVoteResponse {
  success: boolean;
  voted?: boolean;
  voteCount?: number;
  message?: string;
}

export interface CommunityMediaResponse {
  success: boolean;
  mediaUrl?: string;
  mediaPath?: string;
  mediaType?: CommunityMediaType;
  mediaName?: string;
  message?: string;
}

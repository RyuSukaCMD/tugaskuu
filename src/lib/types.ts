export type UserRole = 'user' | 'owner';

export interface Profile {
  id: string;
  email: string;
  username: string;
  nickname: string;
  bio: string | null;
  avatar_url: string | null;
  school: string | null;
  education_level: string | null;
  class_level: string | null;
  favorite_subjects: string[] | null;
  social_links: {
    instagram?: string;
    twitter?: string;
    github?: string;
    website?: string;
  } | null;
  role: UserRole;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: number;
  user_id: string;
  type: 'question' | 'answer';
  title: string;
  content: string;
  slug: string;
  subject: string;
  education_level: string;
  class_level: string;
  tags: string[];
  images: string[];
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  answer_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  liked?: boolean;
  bookmarked?: boolean;
}

export interface QuestionAnswer {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  images: string[];
  upvote_count: number;
  downvote_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  user_vote?: number | null;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_id: number | null;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  liked?: boolean;
  replies?: Comment[];
}

export interface Notification {
  id: number;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: number | null;
  post_slug: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: Profile | null;
}

export interface ProfileStats {
  posts: number;
  questions: number;
  answers: number;
  question_answers: number;
  total_likes: number;
  total_upvotes: number;
}

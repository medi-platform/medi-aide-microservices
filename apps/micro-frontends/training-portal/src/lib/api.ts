/**
 * API client for training-service gamification
 * Routes through Kong gateway
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export interface GamificationProfile {
  id: string;
  userId: string;
  totalPoints: number;
  level: number;
  rank: string;
  lastAwardedAt?: string;
  createdAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  reason: string;
  source: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  points: number;
  iconUrl?: string;
  rarity: string;
  triggerEvent?: string;
  threshold?: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  earnedAt?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  level: number;
  rank: number;
}

// Gamification Profile
export async function getProfile(userId: string): Promise<GamificationProfile> {
  const res = await fetch(`${API_BASE}/gamification/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function getUserPoints(userId: string): Promise<{
  userId: string;
  totalPoints: number;
  level: number;
}> {
  const res = await fetch(`${API_BASE}/gamification/users/${userId}/points`);
  if (!res.ok) throw new Error('Failed to fetch points');
  return res.json();
}

export async function getPointsHistory(userId: string): Promise<PointsTransaction[]> {
  const res = await fetch(`${API_BASE}/gamification/users/${userId}/points/history`);
  if (!res.ok) throw new Error('Failed to fetch points history');
  return res.json();
}

// Badges
export async function getBadges(): Promise<BadgeDefinition[]> {
  const res = await fetch(`${API_BASE}/gamification/badges`);
  if (!res.ok) throw new Error('Failed to fetch badges');
  return res.json();
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const res = await fetch(`${API_BASE}/gamification/users/${userId}/badges`);
  if (!res.ok) throw new Error('Failed to fetch user badges');
  return res.json();
}

// Achievements
export async function getAchievements(): Promise<AchievementDefinition[]> {
  const res = await fetch(`${API_BASE}/gamification/achievements`);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const res = await fetch(`${API_BASE}/gamification/users/${userId}/achievements`);
  if (!res.ok) throw new Error('Failed to fetch user achievements');
  return res.json();
}

// Leaderboard
export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime' = 'alltime',
  limit = 10
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  params.set('period', period);
  params.set('limit', String(limit));
  const res = await fetch(`${API_BASE}/gamification/leaderboard?${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}


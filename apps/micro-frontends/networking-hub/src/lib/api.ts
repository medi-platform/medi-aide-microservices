/**
 * API client for care-network-service
 * Routes through Kong gateway
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export interface CommunityGroup {
  id: string;
  name: string;
  description?: string;
  category: 'wellness' | 'mentorship' | 'specialty' | 'location' | 'training' | 'general' | 'family';
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'active' | 'pending' | 'removed' | 'blocked';
  joinedAt?: string;
}

export interface CoffeeMeet {
  id: string;
  topic: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdBy: string;
  groupId?: string;
  meetingProvider: string;
  meetingUrl?: string;
  maxParticipants: number;
  createdAt: string;
}

export interface CoffeeMeetParticipant {
  id: string;
  coffeeMeetId: string;
  userId: string;
  status: 'invited' | 'accepted' | 'declined' | 'removed';
  joinedAt?: string;
}

// Groups API
export async function listGroups(options?: {
  category?: string;
  includePrivate?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data: CommunityGroup[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  if (options?.includePrivate) params.set('includePrivate', 'true');
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const res = await fetch(`${API_BASE}/care-network/groups?${params}`);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function getGroup(groupId: string): Promise<{ group: CommunityGroup }> {
  const res = await fetch(`${API_BASE}/care-network/groups/${groupId}`);
  if (!res.ok) throw new Error('Failed to fetch group');
  return res.json();
}

export async function createGroup(data: {
  name: string;
  description?: string;
  category?: string;
  isPrivate?: boolean;
  createdBy: string;
}): Promise<{ group: CommunityGroup }> {
  const res = await fetch(`${API_BASE}/care-network/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function joinGroup(groupId: string, userId: string): Promise<{ membership: GroupMember }> {
  const res = await fetch(`${API_BASE}/care-network/groups/${groupId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to join group');
  return res.json();
}

export async function leaveGroup(groupId: string, userId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/care-network/groups/${groupId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to leave group');
  return res.json();
}

export async function getGroupMembers(groupId: string): Promise<{ members: GroupMember[] }> {
  const res = await fetch(`${API_BASE}/care-network/groups/${groupId}/members`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

// CoffeeMeets API
export async function listCoffeeMeets(options?: {
  groupId?: string;
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: CoffeeMeet[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.groupId) params.set('groupId', options.groupId);
  if (options?.userId) params.set('userId', options.userId);
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const res = await fetch(`${API_BASE}/care-network/coffee-meets?${params}`);
  if (!res.ok) throw new Error('Failed to fetch coffee meets');
  return res.json();
}

export async function createCoffeeMeet(data: {
  topic: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  createdBy: string;
  groupId?: string;
  meetingUrl?: string;
  maxParticipants?: number;
}): Promise<{ meet: CoffeeMeet; participants: CoffeeMeetParticipant[] }> {
  const res = await fetch(`${API_BASE}/care-network/coffee-meets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create coffee meet');
  return res.json();
}

export async function joinCoffeeMeet(meetId: string, userId: string): Promise<{ participant: CoffeeMeetParticipant }> {
  const res = await fetch(`${API_BASE}/care-network/coffee-meets/${meetId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to join coffee meet');
  return res.json();
}

export async function getCoffeeMeetParticipants(meetId: string): Promise<{ participants: CoffeeMeetParticipant[] }> {
  const res = await fetch(`${API_BASE}/care-network/coffee-meets/${meetId}/participants`);
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}


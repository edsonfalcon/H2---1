export type WantedStatus = 'AT_LARGE' | 'CAPTURED' | 'MISSING'
export type FruitType = 'PARAMECIA' | 'ZOAN' | 'LOGIA' | 'NONE'
export type SortOption = 'bounty,desc' | 'name,asc' | 'updatedAt,desc'

export interface User { id: string; name: string; email: string }
export interface Team { code: string; name: string }
export interface Session { token: string; expiresAt: string; user: User; team: Team }
export interface MeResponse { user: User; team: Team; expiresAt: string }
export interface CrewRef { id: string; name: string }
export interface Crew { id: string; name: string; shipName: string; jollyRogerColor: string; memberCount: number; totalBounty: number }
export interface DevilFruit { name: string; type: Exclude<FruitType, 'NONE'> }
export interface WantedSummary {
  id: string; name: string; epithet: string; bounty: number; status: WantedStatus; crew: CrewRef
  role: string; devilFruit: DevilFruit | null; threatLevel: number; lastSeenIsland: string; updatedAt: string
}
export interface WantedDetail extends WantedSummary {
  age: number; heightCm: number; bio: string; lastSeen: { island: string; seenAt: string }
  bountyHistory: Array<{ amount: number; issuedAt: string }>
}
export interface WantedPage { content: WantedSummary[]; totalElements: number; totalPages: number; page: number; size: number }
export interface LogPose { status: 'LOCKED' | 'UNLOCKED'; grandLineUnlocked: boolean; unlockedAt: string | null; message: string }
export interface DashboardSummary {
  team: Team
  wanted: { total: number; totalBounty: number; averageBounty: number; byStatus: Record<WantedStatus, number>; byFruit: Record<FruitType, number> }
  crews: { total: number; mostWanted: Crew | null }
  topBounties: WantedSummary[]
  generatedAt: string
}

export interface ApiErrorBody { status: number; code: string; message: string; traceId: string; details?: Array<{ field: string; message: string }> }

import type { PageResponse } from './api'
import type { RequestResponse } from './request'

export type Paged<T> = PageResponse<T> | T[]
export type AssignedRequest = RequestResponse
export interface QuoteItemInput { category: string; description?: string; amount: number }
export interface QuoteInput { requestId: number; title?: string; startDate?: string; durationDays?: number; materialCost?: number; laborCost?: number; vat?: number; discount?: number; detailContent?: string; items: QuoteItemInput[] }
export type QuoteStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
export interface QuoteResponse { id: number; requestId: number; contractorId: number; contractorName: string; title?: string | null; startDate?: string | null; durationDays?: number | null; totalAmount: number; status: QuoteStatus; validUntil?: string | null; revisionRequestNote?: string | null; revisionCount: number; items: QuoteItemInput[] }
export interface ChatThread { requestId: number; contractorId: number; requestCode: string; counterpartName: string; requestStatus: string; lastMessage?: string | null; lastMessageAt?: string | null; unreadCount: number }
export interface ChatMessage { id: number; senderType: 'LANDLORD' | 'CONTRACTOR' | 'SYSTEM'; senderName: string; content: string; read: boolean; createdAt: string }
export type SiteVisitStatus = 'UNSCHEDULED' | 'SCHEDULED' | 'CHANGE_REQUESTED' | 'COMPLETED'
export interface SiteVisit { id: number; requestId: number; status: SiteVisitStatus; visitDate?: string | null; visitTime?: string | null; address?: string | null; managerName?: string | null; note?: string | null; completedAt?: string | null; requestedDate?: string | null; requestedTime?: string | null; requestReason?: string | null }
export interface VisitScheduleInput { visitDate: string; visitTime: string; managerName: string; note: string }
export interface VisitChangeRequestInput { requestedDate: string; requestedTime: string; reason: string }
export type ProjectStatus = 'VISIT_SCHEDULED' | 'START_SCHEDULED' | 'IN_PROGRESS' | 'COMPLETION_REQUESTED' | 'COMPLETED'
export interface ProjectChecklistItem { id: number; label: string; completed: boolean }
export interface Project { id: number; requestId: number; quoteId: number; requestCode?: string; customerName?: string; contractorId: number; contractorName?: string; address?: string; status: ProjectStatus; contractDate?: string; contractAmount?: number; startDate?: string; completionDate?: string | null; constructionItems?: string; customerRequest?: string; checklist?: ProjectChecklistItem[] }
export type ReviewFilter = 'all' | 'five' | 'four' | 'three_or_less'
export interface Review { id: number; requestId: number; contractorId: number; reviewerName: string; rating: number; content: string; keywords: string[]; createdAt: string }
export interface ReviewSummary { contractorId: number; contractorName: string; averageRating: number; totalCount: number; ratingCounts: Record<string, number> }

export interface RecommendedContractor {
  contractorId: number
  companyName: string
  rating: number
  reviewCount: number
  estimateMin?: number | null
  estimateMax?: number | null
  availableDate?: string | null
  reviewScore: number
  priceScore: number
  scheduleScore: number
  matchScore: number
  recommendationRank: number
}

export interface ContractorProfile {
  id: number
  memberId: number
  memberName: string
  businessRegistrationNumber?: string | null
  representativeName?: string | null
  businessRegistrationCertificateUrl?: string | null
  companyName?: string | null
  companyAddress?: string | null
  businessAddress?: string | null
  constructionExperienceMonths?: number | null
  activityRegions?: string | null
  specialties?: string | null
  portfolioUrl?: string | null
  introduction?: string | null
  rating?: number | null
  reviewCount?: number | null
  completedProjectCount?: number | null
  managerPosition?: string | null
  consultationHours?: string | null
  profilePublic?: boolean | null
  contactPublic?: boolean | null
  specialtyPublic?: boolean | null
  regionPublic?: boolean | null
  portfolioPublic?: boolean | null
  availableForConsult?: boolean | null
  estimateMin?: number | null
  estimateMax?: number | null
  availableFromDate?: string | null
  travelDistanceKm?: number | null
}

export interface ContractorDashboard {
  newLeadsCount: number
  quoteRequestedCount: number
  quoteSentCount: number
  contractPendingCount: number
  pendingSettlementAmount: number
}

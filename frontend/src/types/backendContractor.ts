import type { PageResponse } from './api'
import type { RequestResponse } from './request'

export type Paged<T> = PageResponse<T> | T[]
export type AssignedRequest = RequestResponse
export interface QuoteItemInput { category: string; description?: string; amount: number }
export interface QuoteInput { requestId: number; title?: string; startDate?: string; durationDays?: number; materialCost?: number; laborCost?: number; vat?: number; discount?: number; detailContent?: string; items: QuoteItemInput[] }
export interface QuoteResponse extends QuoteInput { id: number; contractorId?: number; totalAmount?: number; status?: string; validUntil?: string }
export interface ChatThread { requestId: number; requestCode: string; counterpartName: string; requestStatus: string; lastMessage?: string; lastMessageAt?: string; unreadCount: number }
export interface ChatMessage { id: number; senderType: 'LANDLORD' | 'CONTRACTOR' | 'SYSTEM'; senderName: string; content: string; read: boolean; createdAt: string }
export interface SiteVisit { id: number; requestId: number; status: string; visitDate?: string; visitTime?: string; address?: string; managerName?: string; note?: string; completedAt?: string; requestedDate?: string; requestedTime?: string; requestReason?: string }
export interface Project { id: number; requestId: number; quoteId: number; requestCode?: string; customerName?: string; contractorName?: string; address?: string; status: string; contractDate?: string; contractAmount?: number; startDate?: string; completionDate?: string; constructionItems?: string; customerRequest?: string; checklist?: { id: number; label: string; completed: boolean }[] }
export type ReviewFilter = 'all' | 'five' | 'four' | 'three_or_less'
export interface Review { id: number; requestId: number; contractorId: number; reviewerName: string; rating: number; content: string; keywords: string[]; createdAt: string }
export interface ReviewSummary { contractorId: number; contractorName: string; averageRating: number; totalCount: number; ratingCounts: Record<string, number> }

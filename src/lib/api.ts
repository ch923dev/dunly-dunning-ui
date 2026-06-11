export type Workspace = {
  id: string
  name: string
  slug: string
  role: string
  settings: {
    logoUrl: string | null
    brandColor: string | null
    replyTo: string | null
    timezone: string
  } | null
}

export type StripeConnection =
  | { connected: false }
  | {
      connected: boolean
      status: 'CONNECTED' | 'DISCONNECTED' | 'REVOKED'
      businessName: string | null
      livemode: boolean
      connectedAt: string
      disconnectedAt: string | null
    }

/** Session-cookie fetch against the same-origin /api (Vite proxies to :4000). */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export type CampaignStep = {
  id: string
  order: number
  delayHours: number
  subject: string
  templateKey: string
  bodyHtml: string | null
  isCustomized: boolean
  isEnabled: boolean
  sendWindowStart: number | null
  sendWindowEnd: number | null
  skipIfAmountBelow: number | null
}

export type Campaign = {
  id: string
  name: string
  isActive: boolean
  steps: CampaignStep[]
  reactivation: { subject: string; templateKey: string }
}

export type CaseStatus =
  | 'ACTIVE'
  | 'RECOVERED'
  | 'LOST_INVOLUNTARY'
  | 'LOST_VOLUNTARY'
  | 'SUPPRESSED'
  | 'PAUSED'

export type Metrics = {
  currency: string
  timezone: string
  periodStart: string
  recovered: { thisMonth: number; allTime: number; casesThisMonth: number }
  atRisk: { amount: number; openCases: number }
  recoveryRate: { rate: number | null; recovered: number; lostInvoluntary: number }
  avgDaysToRecover: number | null
  lostThisMonth: { involuntary: number; voluntary: number }
  trend: { weekStart: string; label: string; failed: number; recoveredSoFar: number }[]
  otherCurrencies: { openCases: number } | null
}

export type EmailPerformance = {
  stages: {
    stageOrder: number
    pending: number
    sent: number
    opened: number
    clicked: number
    recoveries: number
  }[]
  noEmailRecoveries: number
}

export type CaseListItem = {
  id: string
  customer: { name: string | null; email: string | null }
  amountDue: number
  currency: string
  failureCode: string | null
  status: CaseStatus
  failedAt: string
  attemptCount: number
  sentCount: number
  totalSteps: number
  nextSendAt: string | null
}

export type CasesResponse = {
  cases: CaseListItem[]
  nextCursor: string | null
  summary: { count: number; atRisk: number; currency: string }
}

export type TimelineEvent = {
  type:
    | 'failed'
    | 'sent'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'pending'
    | 'held'
    | 'canceled'
    | 'suppressed'
    | 'recovered'
    | 'lost'
  at: string
  title: string
  detail: string | null
  future?: boolean
}

export type CaseDetail = {
  id: string
  status: CaseStatus
  amountDue: number
  currency: string
  failureCode: string | null
  failureMessage: string | null
  attemptCount: number
  failedAt: string
  recoveredAt: string | null
  closedAt: string | null
  hostedInvoiceUrl: string | null
  customer: { name: string | null; email: string | null; since: string }
  subscription: { planName: string | null; status: string } | null
  sentCount: number
  totalSteps: number
  nextSend: {
    stageOrder: number
    stepId: string | null
    subject: string | null
    scheduledFor: string
    held: boolean
  } | null
  timeline: TimelineEvent[]
}

export const fetchWorkspace = () => api<Workspace>('/api/workspace')
export const fetchStripeConnection = () => api<StripeConnection>('/api/stripe/connection')
export const fetchCampaign = () => api<Campaign>('/api/campaign')
export const fetchMetrics = () => api<Metrics>('/api/metrics')
export const fetchEmailPerformance = () => api<EmailPerformance>('/api/metrics/email-performance')
export const fetchCases = (params: string) => api<CasesResponse>(`/api/cases?${params}`)
export const fetchCaseDetail = (id: string) => api<CaseDetail>(`/api/cases/${id}`)

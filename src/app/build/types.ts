export type SetupCategoryKey =
  | 'gaming'
  | 'laptop'
  | 'creator'
  | 'student'
  | 'work'
  | 'design_3d'
  | 'video_editing'
  | 'programming'
  | 'ai_ml'
  | 'streaming'
  | 'custom'

export interface SetupCategory {
  id: SetupCategoryKey
  title: string
  subtitle: string
  tagline: string
  iconName: string
  defaultBudget: number
  primaryFocus: string
}

export interface ProductItem {
  id: string
  title: string
  price: number
  category?: string
  brand?: string
  condition?: string
  images?: any
  specs?: any
  seller_id: string
  profiles?: {
    business_name?: string
    district?: string
    tech_trust_status?: string
    phone?: string
  }
}

export interface BuildComponent {
  slotKey: string
  slotName: string
  slotDescription: string
  category: string
  product: ProductItem
  reasonWhy: string
  alternatives: ProductItem[]
}

export interface BenchmarkEstimate {
  label: string
  target: string
  rating: string // e.g. "120+ FPS", "Fast 4K Playback", "Instant compile"
  icon: string
}

export interface GeneratedBuild {
  id: string
  title: string
  tagline: string
  category: SetupCategoryKey
  totalPrice: number
  targetBudget: number
  savings: number
  score: number // e.g. 92/100
  compatibilityScore: number // 100%
  badges: string[]
  components: BuildComponent[]
  performanceRatings: {
    gaming: number
    contentCreation: number
    streaming: number
    valueForMoney: number
    upgradeability: number
  }
  benchmarks: BenchmarkEstimate[]
  rationale: string
}

export interface QuestionnaireState {
  category: SetupCategoryKey
  budget: number
  useCaseDescription?: string // For Custom Setup
  selectedApps: string[] // Games or software
  performancePriority: 'maximum' | 'balanced' | 'value'
  formFactor: string
  powerPriority: string
  specificPreferences: string
}

export interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  timestamp: string
}
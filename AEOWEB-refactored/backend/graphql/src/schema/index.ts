import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Query {
    # Content queries
    content(id: ID!): Content
    contents(filter: ContentFilter, pagination: PaginationInput): ContentConnection!

    # AEO queries
    aeoScore(contentId: ID!, platform: AIPlatform!): AEOScore!
    aeoPerformance(contentId: ID!): AEOPerformance!

    # Analytics queries
    metrics(filter: MetricsFilter): Metrics!
    citations(contentId: ID!): [Citation!]!

    # User queries
    me: User
    user(id: ID!): User
  }

  type Mutation {
    # Content mutations
    createContent(input: CreateContentInput!): Content!
    updateContent(id: ID!, input: UpdateContentInput!): Content!
    deleteContent(id: ID!): Boolean!
    publishContent(id: ID!): Content!

    # AEO mutations
    optimizeContent(id: ID!, platform: AIPlatform!): OptimizationResult!
    generateContent(input: GenerateContentInput!): GeneratedContent!

    # Analytics mutations
    trackEvent(input: TrackEventInput!): Boolean!
    trackCitation(input: TrackCitationInput!): Citation!

    # Auth mutations
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
  }

  type Subscription {
    # Real-time metrics
    metricsUpdate(interval: Int!): Metrics!

    # Content updates
    contentUpdated(id: ID!): Content!

    # AEO alerts
    aeoAlert: AEOAlert!
  }

  # Types
  type Content {
    id: ID!
    title: String!
    slug: String!
    body: String!
    contentType: String!
    status: ContentStatus!
    authorId: ID!
    author: User!
    metadata: JSON
    aeoScores: [AEOScore!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime
  }

  type User {
    id: ID!
    email: String!
    username: String!
    role: UserRole!
    createdAt: DateTime!
  }

  type AEOScore {
    id: ID!
    contentId: ID!
    platform: AIPlatform!
    overallScore: Float!
    structureScore: Float!
    qualityScore: Float!
    platformScore: Float!
    readabilityScore: Float!
    improvements: [Improvement!]!
    calculatedAt: DateTime!
  }

  type AEOPerformance {
    contentId: ID!
    platforms: [PlatformPerformance!]!
    totalCitations: Int!
    citationRate: Float!
    visibility: Float!
  }

  type PlatformPerformance {
    platform: AIPlatform!
    citations: Int!
    avgPosition: Float!
    citationRate: Float!
    trend: [TrendPoint!]!
  }

  type TrendPoint {
    timestamp: DateTime!
    value: Float!
  }

  type Improvement {
    category: String!
    description: String!
    impact: ImpactLevel!
  }

  type OptimizationResult {
    score: Float!
    optimizedContent: String!
    improvements: [Improvement!]!
    platformTips: [String!]!
  }

  type GeneratedContent {
    title: String!
    body: String!
    outline: [String!]!
    metadata: JSON!
  }

  type Citation {
    id: ID!
    platform: AIPlatform!
    contentId: ID
    query: String!
    cited: Boolean!
    citationText: String
    position: Int
    createdAt: DateTime!
  }

  type Metrics {
    timestamp: DateTime!
    cpu: Float!
    memory: Float!
    requests: Int!
    errors: Int!
    responseTime: Float!
  }

  type AEOAlert {
    id: ID!
    type: AlertType!
    severity: Severity!
    message: String!
    contentId: ID
    timestamp: DateTime!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type ContentConnection {
    edges: [ContentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ContentEdge {
    cursor: String!
    node: Content!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Inputs
  input CreateContentInput {
    title: String!
    body: String!
    contentType: String!
    metadata: JSON
  }

  input UpdateContentInput {
    title: String
    body: String
    contentType: String
    metadata: JSON
  }

  input GenerateContentInput {
    topic: String!
    contentType: String!
    platform: AIPlatform!
    tone: String
    length: String
    keywords: [String!]
  }

  input TrackEventInput {
    eventType: String!
    userId: ID
    properties: JSON
  }

  input TrackCitationInput {
    platform: AIPlatform!
    contentId: ID
    query: String!
    cited: Boolean!
    citationText: String
    position: Int
  }

  input RegisterInput {
    email: String!
    username: String!
    password: String!
  }

  input ContentFilter {
    status: ContentStatus
    contentType: String
    authorId: ID
    search: String
  }

  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  input MetricsFilter {
    startDate: DateTime
    endDate: DateTime
    interval: String
  }

  # Enums
  enum AIPlatform {
    CHATGPT
    CLAUDE
    PERPLEXITY
    GEMINI
    BING
  }

  enum ContentStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  enum UserRole {
    ADMIN
    EDITOR
    VIEWER
  }

  enum ImpactLevel {
    HIGH
    MEDIUM
    LOW
  }

  enum AlertType {
    CITATION_SPIKE
    PERFORMANCE_DEGRADATION
    OPTIMIZATION_NEEDED
  }

  enum Severity {
    CRITICAL
    WARNING
    INFO
  }
`;

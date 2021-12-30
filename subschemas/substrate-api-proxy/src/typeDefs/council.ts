export default /* GraphQL */ `
  type CouncilMember {
    address: String!
    account: Account!
    backing: String
    voters: [String!]!
  }

  type CouncilCandidate {
    address: String!
    account: Account!
  }

  type TermProgress {
    termDuration: String
    termLeft: String
    percentage: Int
  }

  type Council {
    members: [CouncilMember!]!
    runnersUp: [CouncilMember!]!
    candidates: [CouncilCandidate!]!
    primeMember: CouncilMember
    desiredSeats: Int
    desiredRunnersUp: Int
    termProgress: TermProgress!
  }

  type MotionVotes {
    index: Int!
    threshold: Int!
    ayes: [String!]!
    nays: [String!]!
    end: String!
  }

  type MotionProposal {
    method: String!
    section: String!
    args: [ProposalArg!]!
    hash: String!
  }

  type CouncilMotion {
    hash: String!
    proposal: MotionProposal!
    votes: MotionVotes
  }

  type Query {
    council: Council!
    councilMotions: [CouncilMotion!]!
  }
`;
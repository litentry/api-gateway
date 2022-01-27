export default `
type Retweet {
  id: ID
  created_at: String
  in_reply_to_tweet_id: String
  in_reply_to_user_id: Int
  in_reply_to_screen_name: String
  retweeted_status: Tweet
  user: TwitterUser
}

# A tweet object
type Tweet {
  id: ID
  created_at: String
  text: String
  retweet_count: Int
  user: TwitterUser

  # Get a list of retweets
  retweets(limit: Int = 5): [Retweet]
}

# The Twitter API
type TwitterAPI {
  tweet(
    # Unique ID of tweet
    id: String!
  ): Tweet

  # Returns a collection of relevant Tweets matching a specified query.
  search(
    # A UTF-8, URL-encoded search query of 500 characters maximum, including
    # operators. Queries may additionally be limited by complexity.
    q: String!

    # The number of tweets to return per page, up to a maximum of 100. This was
    # formerly the “rpp” parameter in the old Search API.
    count: Int
  ): Viewer
}

# Twitter user
type TwitterUser {
  created_at: String
  description: String
  id: ID
  id_str: String
  screen_name: String
  name: String
  profile_image_url: String
  url: String

  # Get location of user
  location: String

  followers_count: Int
  friends_count: Int
  favourites_count: Int
  listed_count: Int
  statuses_count: Int

  verified: Boolean
  # Get a list of tweets for current user
  tweets(limit: Int = 10): [Tweet]
}

type Viewer {
  tweet: [Tweet]
}

type Query {
TwitterUserQuery(screen_name: String!): TwitterUser
}
`;

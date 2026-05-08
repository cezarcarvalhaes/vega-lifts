import PostHog from 'posthog-react-native'

let _client: PostHog | null = null

export function getPostHog(): PostHog {
  if (!_client) {
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_POSTHOG_API_KEY is not set')
    }
    _client = new PostHog(apiKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    })
  }
  return _client
}

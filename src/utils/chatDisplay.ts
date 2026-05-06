const BADGES = ['🐟', '🫧', '🌙', '🍀', '⭐', '🌿', '🔥', '🎧']

export function getFallbackNickname(uid: string) {
  const suffix = (uid || '0000').slice(-4)
  return `익명-${suffix}`
}

export function getDisplayNickname(nickname: string | undefined, uid: string) {
  const safe = nickname?.trim()
  return safe ? safe : getFallbackNickname(uid)
}

export function getUserBadge(uid: string) {
  const source = uid || 'guest'
  const sum = source.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return BADGES[sum % BADGES.length]
}

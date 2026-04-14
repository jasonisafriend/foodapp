// Canonical tag list — used by the Tags browse menu and by post creation/edit.
// Users cannot create free-form tags; posts may only be tagged with values from
// this list. Keep in sync with the Supabase `food_posts.tags` column.
//
// Stored as a bare slug (no `#`). The `#` is presentation-only.

export const FOOD_TAGS = [
  'pizza',
  'chinese',
  'mexican',
  'japanese',
  'korean',
  'italian',
  'sandwich',
  'burger',
  'tacos',
  'bbq',
  'thai',
  'vietnamese',
  'indian',
  'halal',
  'bakery',
  'dessert',
  'coffee',
  'breakfast',
  'seafood',
  'salad',
]

const TAG_SET = new Set(FOOD_TAGS)

export function isValidTag(tag) {
  return TAG_SET.has(tag)
}

/** Only keeps values that are in the canonical list. */
export function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return []
  const seen = new Set()
  const out = []
  for (const raw of tags) {
    const t = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/^#+/, '') : ''
    if (!t || seen.has(t) || !TAG_SET.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

/** Returns canonical tags whose slug starts with the query (case-insensitive). */
export function suggestTags(query, { exclude = [] } = {}) {
  const q = (query || '').trim().toLowerCase().replace(/^#+/, '')
  const excludeSet = new Set(exclude)
  const base = FOOD_TAGS.filter((t) => !excludeSet.has(t))
  if (!q) return base
  return base.filter((t) => t.includes(q))
}

export const withHash = (tag) => (tag.startsWith('#') ? tag : `#${tag}`)

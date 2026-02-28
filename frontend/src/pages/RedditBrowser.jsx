import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SUBREDDITS = [
  { value: 'tifu',                label: 'r/tifu' },
  { value: 'nosleep',             label: 'r/nosleep' },
  { value: 'AmITheAsshole',       label: 'r/AITA' },
  { value: 'relationship_advice', label: 'r/relationship_advice' },
  { value: 'MaliciousCompliance', label: 'r/MaliciousCompliance' },
  { value: 'ProRevenge',          label: 'r/ProRevenge' },
]

const SORTS = [
  { value: 'hot',  label: 'Hot' },
  { value: 'top',  label: 'Top (Week)' },
  { value: 'new',  label: 'New' },
]

function UpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4l8 8H4l8-8z"/>
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function fmtUpvotes(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtMins(secs) {
  const mins = Math.round(secs / 60)
  if (mins < 60) return `~${mins} min read`
  return `~${Math.round(mins / 60)}h read`
}

function wordCount(text) {
  return text.trim().split(/\s+/).length
}

export default function RedditBrowser() {
  const navigate = useNavigate()
  const [subreddit, setSubreddit] = useState('tifu')
  const [customSub, setCustomSub] = useState('')
  const [sort, setSort]           = useState('hot')
  const [stories, setStories]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [openId, setOpenId]       = useState(null)   // which card is expanded
  const [selected, setSelected]   = useState(null)   // which story is chosen for use

  const activeSub = customSub.trim() || subreddit

  async function fetchStories() {
    setLoading(true)
    setError(null)
    setOpenId(null)
    setSelected(null)
    try {
      const params = new URLSearchParams({ subreddit: activeSub, sort })
      const res    = await fetch(`/api/reddit/stories?${params}`)
      if (!res.ok) throw new Error(`Failed to fetch stories (${res.status})`)
      const data   = await res.json()
      setStories(data.stories || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStories() }, [subreddit, sort])

  function handleToggle(story) {
    if (openId === story.id) {
      // Clicking the open card closes it and deselects
      setOpenId(null)
      setSelected(null)
    } else {
      // Open this card and select it; close the previous
      setOpenId(story.id)
      setSelected(story)
    }
  }

  function handleContinue() {
    if (!selected) return
    navigate('/video', {
      state: {
        story: {
          text:      `${selected.title}\n\n${selected.body}`,
          source:    'reddit',
          title:     selected.title,
          author:    selected.author,
          subreddit: selected.subreddit,
          url:       selected.url,
          wordCount: wordCount(`${selected.title} ${selected.body}`),
        }
      }
    })
  }

  return (
    <main className="page-content fade-in">
      <div className="page-header">
        <h1>Browse Reddit</h1>
        <p>Click a story to read it in full, then hit "Use This Story" to continue.</p>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <span style={styles.controlLabel}>Subreddit</span>
          <div style={styles.pillRow}>
            {SUBREDDITS.map((s) => (
              <button
                key={s.value}
                className="btn btn-sm"
                style={{
                  ...styles.pill,
                  ...(subreddit === s.value && !customSub ? styles.pillActive : {})
                }}
                onClick={() => { setSubreddit(s.value); setCustomSub('') }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input
            className="input"
            style={styles.customInput}
            placeholder="Custom subreddit..."
            value={customSub}
            onChange={(e) => setCustomSub(e.target.value.replace(/^r\//, '').toLowerCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchStories()}
          />
        </div>

        <div style={styles.controlRow}>
          <span style={styles.controlLabel}>Sort by</span>
          <div className="tab-group" style={{ maxWidth: 260 }}>
            {SORTS.map((s) => (
              <button
                key={s.value}
                className={`tab-pill${sort === s.value ? ' active' : ''}`}
                onClick={() => setSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchStories}
            disabled={loading}
            style={{ marginLeft: 'auto' }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="divider" style={{ marginTop: 8 }} />

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-ghost" onClick={fetchStories} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingArea}>
          <div className="spinner" />
          <span style={{ color: '#9d9d9d', marginTop: 12 }}>Fetching stories from r/{activeSub}...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && stories.length === 0 && (
        <div style={styles.emptyArea}>
          <p style={{ color: '#9d9d9d' }}>No stories found. Try a different subreddit or sort.</p>
        </div>
      )}

      {/* Story list — accordion */}
      {!loading && stories.length > 0 && (
        <div style={styles.storyList}>
          {stories.map((story) => {
            const isOpen     = openId === story.id
            const isSelected = selected?.id === story.id
            const wc         = wordCount(`${story.title} ${story.body}`)
            const readSecs   = (wc / 130) * 60

            return (
              <div
                key={story.id}
                className={`card${isSelected ? ' card--selected' : ''}`}
                style={styles.storyCard}
              >
                {/* ── Clickable header ── */}
                <div
                  style={styles.cardHeader}
                  onClick={() => handleToggle(story)}
                >
                  <div style={styles.storyMeta}>
                    <span style={styles.upvotes}>
                      <UpIcon /> {fmtUpvotes(story.upvotes)}
                    </span>
                    <span className="text-muted text-sm">r/{story.subreddit}</span>
                    <span className="text-muted text-sm">by u/{story.author}</span>
                    <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
                      {fmtMins(readSecs)}
                    </span>
                    <ChevronIcon open={isOpen} />
                  </div>

                  <h3 style={styles.storyTitle}>{story.title}</h3>

                  {/* Collapsed preview */}
                  {!isOpen && (
                    <p style={styles.storyPreview}>
                      {story.body.slice(0, 220)}{story.body.length > 220 ? '…' : ''}
                    </p>
                  )}
                </div>

                {/* ── Expanded full body ── */}
                {isOpen && (
                  <div style={styles.fullBody}>
                    <div style={styles.fullBodyScroll}>
                      {story.body.split('\n').filter(Boolean).map((para, i) => (
                        <p key={i} style={styles.bodyPara}>{para}</p>
                      ))}
                    </div>
                    <div style={styles.selectedFooter}>
                      <span style={{ color: '#4fc1ff', fontSize: 12, fontWeight: 600 }}>
                        Selected — {wc} words
                      </span>
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.sourceLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Reddit
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          disabled={!selected}
          onClick={handleContinue}
        >
          Use This Story
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </main>
  )
}

const styles = {
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 8,
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  controlLabel: {
    fontSize: 12,
    color: '#6b6b6b',
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    minWidth: 72,
  },
  pillRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    background: '#2d2d2d',
    color: '#9d9d9d',
    border: '1px solid #3e3e42',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  pillActive: {
    background: 'rgba(0,122,204,0.15)',
    color: '#4fc1ff',
    borderColor: '#007acc',
  },
  customInput: {
    maxWidth: 200,
    padding: '5px 10px',
    fontSize: 13,
  },
  errorBox: {
    background: 'rgba(244,71,71,0.1)',
    border: '1px solid rgba(244,71,71,0.3)',
    borderRadius: 6,
    padding: '12px 16px',
    color: '#f44747',
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '64px 0',
  },
  emptyArea: {
    textAlign: 'center',
    padding: '48px 0',
  },
  storyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 24,
  },
  storyCard: {
    overflow: 'hidden',
  },
  cardHeader: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  storyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  upvotes: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#ce9178',
    fontSize: 12,
    fontWeight: 600,
  },
  storyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e2e2e2',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  storyPreview: {
    fontSize: 13,
    color: '#9d9d9d',
    lineHeight: 1.6,
  },
  fullBody: {
    marginTop: 14,
    borderTop: '1px solid #3e3e42',
    paddingTop: 14,
  },
  fullBodyScroll: {
    maxHeight: 400,
    overflowY: 'auto',
    paddingRight: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  bodyPara: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 1.8,
  },
  selectedFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid rgba(0,122,204,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceLink: {
    fontSize: 12,
    color: '#9d9d9d',
    textDecoration: 'none',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px solid #3e3e42',
    marginTop: 8,
  },
}

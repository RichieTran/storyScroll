import { useLocation, useNavigate } from 'react-router-dom'

export default function Result() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { story, video, jobId } = location.state || {}

  const videoUrl = jobId ? `/api/video/${jobId}.mp4` : null

  function handleDownload() {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `storyscroll-${jobId}.mp4`
    a.click()
  }

  if (!story && !jobId) {
    return (
      <main className="page-content fade-in">
        <div style={styles.emptyState}>
          <p style={{ color: '#9d9d9d' }}>No video to show. Start from the Home page.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-content fade-in">
      <div style={styles.container}>
        {/* Success banner */}
        <div style={styles.successBanner}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#4ec9b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span style={{ color: '#4ec9b0', fontWeight: 600 }}>Your video is ready!</span>
        </div>

        {/* Video player */}
        <div style={styles.playerWrap}>
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              style={styles.video}
              poster=""
            />
          ) : (
            <div style={styles.playerPlaceholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="#007acc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <p style={{ color: '#6b6b6b', fontSize: 13, marginTop: 12 }}>
                Video preview will appear here
              </p>
              <p style={{ color: '#4b4b4b', fontSize: 12, marginTop: 4 }}>
                Job ID: <code style={{ color: '#9cdcfe' }}>{jobId}</code>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDownload}
            disabled={!videoUrl}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Video
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/video', { state: { story } })}>
              Change Video
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Create Another
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="divider" />
        <div style={styles.meta}>
          <div className="card" style={styles.metaCard}>
            <div style={styles.metaLabel}>Story Source</div>
            <div style={styles.metaValue}>
              {story?.source === 'reddit'
                ? `r/${story.subreddit} — u/${story.author}`
                : story?.source === 'upload'
                ? story?.fileName
                : story?.source || 'Manual entry'}
            </div>
          </div>
          <div className="card" style={styles.metaCard}>
            <div style={styles.metaLabel}>Word Count</div>
            <div style={styles.metaValue}>{story?.wordCount || '—'} words</div>
          </div>
          <div className="card" style={styles.metaCard}>
            <div style={styles.metaLabel}>Background Video</div>
            <div style={styles.metaValue}>{video?.name || 'Custom upload'}</div>
          </div>
          <div className="card" style={styles.metaCard}>
            <div style={styles.metaLabel}>Job ID</div>
            <div style={{ ...styles.metaValue, fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>
              {jobId || '—'}
            </div>
          </div>
        </div>

        {/* Share tips */}
        <div style={styles.tipsSection}>
          <p style={styles.tipsSectionLabel}>Tips for posting</p>
          <div style={styles.tipCards}>
            {[
              { platform: 'TikTok',    tip: 'Post between 7–9pm for maximum reach. Use 3–5 trending hashtags.' },
              { platform: 'Instagram', tip: 'Reels perform best at 30–60 seconds. Add captions in your caption.' },
              { platform: 'YouTube',   tip: 'Upload as a YouTube Short for vertical videos under 60 seconds.' },
            ].map((t) => (
              <div key={t.platform} className="card" style={styles.tipCard}>
                <strong style={{ fontSize: 13, color: '#cccccc' }}>{t.platform}</strong>
                <p style={{ fontSize: 12, color: '#9d9d9d', marginTop: 6, lineHeight: 1.6 }}>{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

const styles = {
  emptyState: {
    textAlign: 'center',
    padding: '80px 0',
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(78,201,176,0.1)',
    border: '1px solid rgba(78,201,176,0.3)',
    borderRadius: 6,
    padding: '10px 16px',
    marginBottom: 24,
    fontSize: 14,
  },
  playerWrap: {
    background: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: '9/16',
    maxHeight: 540,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #3e3e42',
    marginBottom: 24,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  playerPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  meta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
    marginBottom: 32,
  },
  metaCard: {
    padding: '12px 14px',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6b6b6b',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    color: '#cccccc',
    fontWeight: 500,
  },
  tipsSection: {
    marginBottom: 32,
  },
  tipsSectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6b6b6b',
    marginBottom: 12,
  },
  tipCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
  },
  tipCard: {
    padding: '12px 14px',
  },
}

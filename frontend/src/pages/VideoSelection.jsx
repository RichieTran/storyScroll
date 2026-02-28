import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { id: 'minecraft',  label: 'Minecraft Parkour', color: '#4ec9b0' },
  { id: 'subway',     label: 'Subway Surfers',    color: '#ce9178' },
  { id: 'trackmania', label: 'Trackmania',         color: '#9cdcfe' },
  { id: 'gta',        label: 'GTA Driving',        color: '#f44747' },
  { id: 'satisfying', label: 'Satisfying / Slime', color: '#c586c0' },
  { id: 'nature',     label: 'Nature / Scenery',   color: '#6a9955' },
]

function VideoCard({ video, isSelected, onClick }) {
  const [thumbError, setThumbError] = useState(false)

  const filename = video.file_path?.split('/').pop()
  const videoUrl = filename ? `/api/library/${encodeURIComponent(filename)}` : null
  const showVideo = Boolean(videoUrl && !thumbError)

  return (
    <button
      className={`card card--clickable${isSelected ? ' card--selected' : ''}`}
      style={styles.videoCard}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div style={{
        ...styles.thumbnail,
        borderColor: video.color + '44',
        position: 'relative',
        overflow: 'hidden',
        background: '#1e1e1e',
      }}>
        {/* Video frame underneath */}
        {showVideo && (
          <video
            src={videoUrl}
            preload="metadata"
            muted
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onLoadedMetadata={(e) => { e.target.currentTime = 1 }}
            onError={() => setThumbError(true)}
          />
        )}

        {/* Color + icon overlay — always shown on top */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: video.color + (showVideo ? '99' : '22'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          {showVideo ? (
            <div style={{
              padding: '8px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span style={{ ...styles.thumbLabel, color: '#ffffff' }}>{video.category}</span>
            </div>
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={video.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span style={{ ...styles.thumbLabel, color: video.color }}>{video.category}</span>
            </>
          )}
        </div>
      </div>

      <div style={styles.videoInfo}>
        <span style={styles.videoName}>{video.name}</span>
        <span className="badge" style={{ background: video.color + '22', color: video.color }}>
          {video.category}
        </span>
        {video.duration && (
          <span className="text-muted text-sm">{video.duration}</span>
        )}
      </div>

      {isSelected && (
        <div style={styles.checkmark}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </button>
  )
}

export default function VideoSelection() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const story     = location.state?.story

  const [library, setLibrary]         = useState([])
  const [libLoading, setLibLoading]   = useState(true)
  const [filterCat, setFilterCat]     = useState(null)
  const [selected, setSelected]       = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [tab, setTab]                 = useState('library')
  const fileRef = useRef()

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/videos')
        const data = await res.json()
        setLibrary(data.videos || [])
      } catch {
        setLibrary(MOCK_VIDEOS)
      } finally {
        setLibLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filterCat
    ? library.filter((v) => v.categoryId === filterCat)
    : library

  function handleUpload(f) {
    if (!f) return
    if (!f.name.match(/\.(mp4|mov|webm)$/i)) {
      alert('Please upload a .mp4, .mov, or .webm file.')
      return
    }
    setUploadedFile(f)
    setSelected({ id: 'upload', name: f.name, source: 'upload' })
  }

  function handleGenerate() {
    if (!selected) return
    navigate('/loading', { state: { story, video: selected } })
  }

  return (
    <main className="page-content fade-in">
      {/* Header with story preview */}
      <div className="page-header">
        <h1>Choose Background Video</h1>
        <p>Select a video from the library or upload your own to use as the background.</p>
      </div>

      {story && (
        <div className="card" style={styles.storyPreview}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTag}>Your Story</span>
            {story.subreddit && (
              <span className="badge badge-blue">r/{story.subreddit}</span>
            )}
            <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
              {story.wordCount} words
            </span>
          </div>
          <p style={styles.previewText}>
            {story.text.slice(0, 180)}{story.text.length > 180 ? '…' : ''}
          </p>
        </div>
      )}

      {/* Tab: Library / Upload */}
      <div className="tab-group" style={{ maxWidth: 300, marginBottom: 20 }}>
        <button className={`tab-pill${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>
          Video Library
        </button>
        <button className={`tab-pill${tab === 'upload' ? ' active' : ''}`} onClick={() => setTab('upload')}>
          Upload My Own
        </button>
      </div>

      {tab === 'library' && (
        <>
          {/* Category filter */}
          <div style={styles.filterRow}>
            <button
              className="btn btn-sm"
              style={{ ...styles.pill, ...(filterCat === null ? styles.pillActive : {}) }}
              onClick={() => setFilterCat(null)}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="btn btn-sm"
                style={{ ...styles.pill, ...(filterCat === c.id ? styles.pillActive : {}) }}
                onClick={() => setFilterCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {libLoading ? (
            <div style={styles.loadingArea}>
              <div className="spinner" />
              <span style={{ color: '#9d9d9d', marginTop: 12 }}>Loading video library...</span>
            </div>
          ) : (
            <div style={styles.videoGrid}>
              {filtered.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSelected={selected?.id === video.id}
                  onClick={() => setSelected(video)}
                />
              ))}
              {filtered.length === 0 && (
                <p style={{ color: '#9d9d9d', gridColumn: '1/-1', padding: '24px 0' }}>
                  No videos in this category yet.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'upload' && (
        <div>
          {/* Portrait crop explainer */}
          <div style={styles.cropInfo}>
            <div style={styles.cropFrameWrap}>
              {/* Landscape source */}
              <div style={styles.cropItem}>
                <span style={styles.cropDimLabel}>Your video</span>
                <div style={styles.cropLandscape}>
                  {/* Portrait crop overlay */}
                  <div style={styles.cropOverlay} />
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}>
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              {/* Portrait result */}
              <div style={styles.cropItem}>
                <span style={styles.cropDimLabel}>Output</span>
                <div style={styles.cropPortrait} />
              </div>
            </div>
            <p style={styles.cropInfoText}>
              Upload any video: landscape, square, or vertical. We automatically
              center-crop it to portrait (9:16) so it's ready for TikTok and Reels.
              No editing needed on your end!
            </p>
          </div>

          <div
            className="dropzone"
            onClick={() => fileRef.current?.click()}
          >
            <div style={styles.uploadIcon}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="dropzone__label">
              {uploadedFile ? (
                <span style={{ color: '#4ec9b0', fontWeight: 600 }}>{uploadedFile.name}</span>
              ) : (
                <>Click to select a video file</>
              )}
            </p>
            <p className="dropzone__sub">Any resolution — .mp4, .mov, .webm (max 500MB)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".mp4,.mov,.webm,video/*"
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e.target.files[0])}
            />
          </div>

          {uploadedFile && (
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#4ec9b0', fontWeight: 600 }}>{uploadedFile.name}</span>
                <span className="text-muted text-sm">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => { setUploadedFile(null); setSelected(null) }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          disabled={!selected}
          onClick={handleGenerate}
        >
          Generate Video
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
      </div>
    </main>
  )
}

// Fallback mock data when backend is unavailable
const MOCK_VIDEOS = CATEGORIES.map((cat, i) => ({
  id:         `mock-${i}`,
  name:       `${cat.label} Clip ${i + 1}`,
  category:   cat.label,
  categoryId: cat.id,
  duration:   `${Math.floor(Math.random() * 8 + 2)}:${String(Math.floor(Math.random() * 60)).padStart(2,'0')}`,
  label:      cat.label,
  color:      cat.color,
}))

const styles = {
  cropInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    background: '#252526',
    border: '1px solid #3e3e42',
    borderRadius: 6,
    padding: '14px 18px',
    marginBottom: 16,
  },
  cropFrameWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  cropItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  cropLandscape: {
    width: 72,
    height: 40,
    background: '#3c3c3c',
    border: '1px solid #4a4a4f',
    borderRadius: 3,
    position: 'relative',
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 22,
    height: '100%',
    background: 'rgba(0,122,204,0.25)',
    border: '1.5px solid #007acc',
    borderRadius: 2,
  },
  cropPortrait: {
    width: 26,
    height: 46,
    background: '#3c3c3c',
    border: '1.5px solid #007acc',
    borderRadius: 3,
  },
  cropDimLabel: {
    fontSize: 9,
    color: '#9d9d9d',
    letterSpacing: 0.3,
    lineHeight: 1,
    fontWeight: 500,
  },
  cropInfoText: {
    fontSize: 12,
    color: '#9d9d9d',
    lineHeight: 1.7,
    flex: 1,
  },
  storyPreview: {
    marginBottom: 24,
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  previewTag: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#6b6b6b',
  },
  previewText: {
    fontSize: 13,
    color: '#9d9d9d',
    lineHeight: 1.7,
  },
  filterRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  pill: {
    background: '#2d2d2d',
    color: '#9d9d9d',
    border: '1px solid #3e3e42',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  pillActive: {
    background: 'rgba(0,122,204,0.15)',
    color: '#4fc1ff',
    borderColor: '#007acc',
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 10,
    marginBottom: 24,
  },
  videoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    position: 'relative',
    textAlign: 'left',
  },
  thumbnail: {
    aspectRatio: '16/9',
    borderRadius: 4,
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  thumbLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  videoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  videoName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#cccccc',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#007acc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    color: '#6b6b6b',
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'center',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 0',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px solid #3e3e42',
    marginTop: 24,
  },
}

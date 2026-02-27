import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MODES = ['write', 'paste', 'upload']
const MODE_LABELS = { write: 'Write', paste: 'Paste', upload: 'Upload File' }

const PLACEHOLDER_WRITE =
  'Start writing your story here...\n\nTip: Be expressive! The more detail you add, the more engaging your video narration will be.'
const PLACEHOLDER_PASTE =
  'Paste your story here...'

export default function StoryInput() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const initMode  = location.state?.mode || 'write'
  const [mode, setMode]   = useState(initMode === 'upload' ? 'upload' : initMode === 'paste' ? 'paste' : 'write')
  const [text, setText]   = useState('')
  const [file, setFile]   = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length
  const canContinue = mode === 'upload' ? !!file : text.trim().length >= 10

  // ── File handling ──────────────────────────────
  function handleFile(f) {
    if (!f) return
    if (!f.name.match(/\.(txt|md)$/i)) {
      alert('Please upload a .txt or .md file.')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setText(e.target.result)
    reader.readAsText(f)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  // ── Continue ───────────────────────────────────
  function handleContinue() {
    const storyData = {
      text: text.trim(),
      source: mode,
      fileName: file?.name || null,
      wordCount,
    }
    navigate('/video', { state: { story: storyData } })
  }

  return (
    <main className="page-content fade-in">
      <div className="page-header">
        <h1>Your Story</h1>
        <p>This text will be converted to narration audio and displayed as captions in your video.</p>
      </div>

      {/* Mode tabs */}
      <div style={styles.tabRow}>
        {MODES.map((m) => (
          <button
            key={m}
            className={`tab-pill${mode === m ? ' active' : ''}`}
            onClick={() => { setMode(m); setFile(null); }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div style={styles.editorPanel}>
        {mode !== 'upload' ? (
          <>
            <textarea
              className="textarea"
              style={styles.textarea}
              placeholder={mode === 'write' ? PLACEHOLDER_WRITE : PLACEHOLDER_PASTE}
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck
            />
            <div style={styles.counters}>
              <span className="text-muted text-sm">{wordCount} words</span>
              <span className="text-muted text-sm">{charCount} characters</span>
              {charCount > 0 && charCount < 10 && (
                <span style={{ color: '#f44747', fontSize: 12 }}>Minimum 10 characters</span>
              )}
            </div>
          </>
        ) : (
          <div>
            {/* Drop zone */}
            <div
              className={`dropzone${dragging ? ' drag-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <div style={styles.uploadIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="dropzone__label">
                {file ? (
                  <span style={{ color: '#4ec9b0', fontWeight: 600 }}>{file.name}</span>
                ) : (
                  <>Drag & drop a file, or <span style={{ color: '#007acc' }}>click to browse</ span></>
                )}
              </p>
              <p className="dropzone__sub">Supported: .txt, .md</p>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {/* Preview of file content */}
            {file && text && (
              <div style={styles.filePreview}>
                <div style={styles.filePreviewHeader}>
                  <span style={{ color: '#4ec9b0', fontSize: 13, fontWeight: 600 }}>{file.name}</span>
                  <span className="text-muted text-sm">{wordCount} words</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => { setFile(null); setText('') }}
                  >
                    Remove
                  </button>
                </div>
                <div style={styles.filePreviewBody}>
                  <pre style={styles.filePreviewText}>{text.slice(0, 400)}{text.length > 400 ? '...' : ''}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story tips */}
      {!canContinue && mode !== 'upload' && (
        <div className="card" style={styles.tipsCard}>
          <strong style={{ fontSize: 13, color: '#cccccc' }}>Tips for great videos</strong>
          <ul style={styles.tipsList}>
            <li>Aim for 200–800 words (1–4 minutes of narration)</li>
            <li>Use clear sentence structure — it helps with TTS quality</li>
            <li>Avoid special characters, symbols, or emojis in the story text</li>
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue to Video Selection
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
  tabRow: {
    display: 'flex',
    gap: 2,
    background: '#252526',
    border: '1px solid #3e3e42',
    borderRadius: 6,
    padding: 3,
    marginBottom: 16,
    maxWidth: 320,
  },
  editorPanel: {
    marginBottom: 20,
  },
  textarea: {
    minHeight: 280,
    fontFamily: "'Consolas', 'Fira Code', monospace",
    fontSize: 14,
    lineHeight: 1.7,
    resize: 'vertical',
  },
  counters: {
    display: 'flex',
    gap: 16,
    marginTop: 8,
    paddingLeft: 4,
  },
  uploadIcon: {
    color: '#6b6b6b',
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'center',
  },
  filePreview: {
    marginTop: 16,
    background: '#252526',
    border: '1px solid #3e3e42',
    borderRadius: 6,
    overflow: 'hidden',
  },
  filePreviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderBottom: '1px solid #3e3e42',
    background: '#2d2d2d',
  },
  filePreviewBody: {
    padding: 14,
    maxHeight: 180,
    overflow: 'auto',
  },
  filePreviewText: {
    fontFamily: "'Consolas', monospace",
    fontSize: 12,
    color: '#9d9d9d',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  tipsCard: {
    marginBottom: 24,
  },
  tipsList: {
    marginTop: 10,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    color: '#9d9d9d',
    fontSize: 13,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: '1px solid #3e3e42',
    marginTop: 24,
  },
}

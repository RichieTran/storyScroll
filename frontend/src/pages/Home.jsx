import { useNavigate } from 'react-router-dom'

function WriteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function PasteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}
function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
function RedditIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 11.5c.5 0 1 .4 1 1s-.4 1-1 1"/>
      <path d="M8 11.5c-.5 0-1 .4-1 1s.4 1 1 1"/>
      <path d="M9.5 15.5c.7.7 2.8.7 3.5 0"/>
      <circle cx="17.5" cy="7" r="1.5"/>
      <path d="M15 8l1.5-1.5"/>
    </svg>
  )
}

const PATHS = [
  {
    mode:     'write',
    to:       '/story',
    icon:     <WriteIcon />,
    label:    'Write a Story',
    desc:     'Compose your story from scratch using our editor. Great for original content.',
    badge:    'Original',
    badgeClass: 'badge-blue',
  },
  {
    mode:     'paste',
    to:       '/story',
    icon:     <PasteIcon />,
    label:    'Paste a Story',
    desc:     'Copy and paste text you already have — from notes, docs, or anywhere.',
    badge:    'Quick',
    badgeClass: 'badge-green',
  },
  {
    mode:     'upload',
    to:       '/story',
    icon:     <UploadIcon />,
    label:    'Upload a File',
    desc:     'Upload a .txt or .md file and we\'ll use that as your script.',
    badge:    'File',
    badgeClass: 'badge-orange',
  },
  {
    mode:     'reddit',
    to:       '/reddit',
    icon:     <RedditIcon />,
    label:    'Browse Reddit',
    desc:     'Pick a trending story from r/tifu, r/AITA, r/nosleep, and more.',
    badge:    'Trending',
    badgeClass: 'badge-red',
  },
]

export default function Home() {
  const navigate = useNavigate()

  function handleSelect(path) {
    navigate(path.to, { state: { mode: path.mode } })
  }

  return (
    <main className="page-content fade-in">
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroEyebrow}>
          <span className="badge badge-blue">Beta</span>
        </div>
        <h1 style={styles.heroTitle}>Turn any story into a&nbsp;video</h1>
        <p style={styles.heroSub}>
          Write, paste, upload, or grab a trending Reddit post. Then pair it
          with background footage and let StoryScroll generate your
          TikTok-ready video automatically!
        </p>
      </div>

      {/* Flow cards */}
      <div style={styles.sectionLabel}>Choose how you want to start</div>
      <div style={styles.grid}>
        {PATHS.map((path) => (
          <button
            key={path.mode}
            style={styles.pathCard}
            className="card card--clickable"
            onClick={() => handleSelect(path)}
          >
            <div style={styles.cardIcon}>{path.icon}</div>
            <div style={styles.cardBody}>
              <div style={styles.cardTop}>
                <span style={styles.cardLabel}>{path.label}</span>
                <span className={`badge ${path.badgeClass}`}>{path.badge}</span>
              </div>
              <p style={styles.cardDesc}>{path.desc}</p>
            </div>
            <div style={styles.cardArrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* How it works */}
      <div style={styles.howItWorks}>
        <div style={styles.sectionLabel}>How it works</div>
        <div style={styles.steps}>
          {[
            { num: '01', title: 'Pick a story',   desc: 'Write, paste, upload, or grab one from Reddit.' },
            { num: '02', title: 'Choose a video',  desc: 'Select background footage from the library or upload your own.' },
            { num: '03', title: 'Generate',        desc: 'We add narration, captions, and compose the final video.' },
            { num: '04', title: 'Download',        desc: 'Watch your video and download it ready for TikTok or Instagram.' },
          ].map((step) => (
            <div key={step.num} style={styles.step}>
              <span style={styles.stepNum}>{step.num}</span>
              <strong style={styles.stepTitle}>{step.title}</strong>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

const styles = {
  hero: {
    textAlign: 'center',
    padding: '40px 0 48px',
    maxWidth: 620,
    margin: '0 auto',
  },
  heroEyebrow: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: '2.4rem',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: 16,
    color: '#e2e2e2',
  },
  heroSub: {
    fontSize: '1rem',
    color: '#9d9d9d',
    lineHeight: 1.7,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6b6b6b',
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
    marginBottom: 48,
  },
  pathCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    textAlign: 'left',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    width: '100%',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    background: '#252526',
    border: '1px solid #3e3e42',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#007acc',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardLabel: {
    fontWeight: 600,
    fontSize: 15,
    color: '#e2e2e2',
  },
  cardDesc: {
    fontSize: 13,
    color: '#9d9d9d',
    lineHeight: 1.6,
  },
  cardArrow: {
    marginTop: 'auto',
    color: '#007acc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 0.7,
  },
  howItWorks: {
    borderTop: '1px solid #3e3e42',
    paddingTop: 40,
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  stepNum: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#007acc',
    fontWeight: 700,
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: 14,
    color: '#e2e2e2',
    fontWeight: 600,
  },
  stepDesc: {
    fontSize: 13,
    color: '#9d9d9d',
    lineHeight: 1.6,
  },
}

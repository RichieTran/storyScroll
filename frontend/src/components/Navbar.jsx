import { Link, useLocation } from 'react-router-dom'

const NAV_STEPS = [
  { path: '/',       label: 'Home'   },
  { path: '/story',  label: 'Story'  },
  { path: '/reddit', label: 'Reddit' },
  { path: '/video',  label: 'Video'  },
  { path: '/result', label: 'Result' },
]

function ScrollIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  )
}

export default function Navbar({ currentPath }) {
  const location = useLocation()
  const path = currentPath || location.pathname

  return (
    <nav style={styles.navbar}>
      {/* Brand */}
      <Link to="/" style={styles.brand}>
        <span style={styles.brandIcon}><ScrollIcon /></span>
        <span style={styles.brandName}>StoryScroll</span>
      </Link>

      {/* Nav tabs */}
      <div style={styles.tabRow}>
        {NAV_STEPS.map((step) => {
          const isActive = path === step.path
          return (
            <Link
              key={step.path}
              to={step.path}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
            >
              {step.label}
              {isActive && <span style={styles.tabUnderline} />}
            </Link>
          )
        })}
      </div>

      {/* Right side info */}
      <div style={styles.rightSlot}>
        <span style={styles.version}>v0.1</span>
      </div>
    </nav>
  )
}

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    background: '#252526',
    borderBottom: '1px solid #3e3e42',
    height: 48,
    padding: '0 16px',
    gap: 16,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    userSelect: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#cccccc',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    marginRight: 8,
    flexShrink: 0,
  },
  brandIcon: {
    color: '#007acc',
    display: 'flex',
    alignItems: 'center',
  },
  brandName: {
    letterSpacing: '-0.3px',
  },
  tabRow: {
    display: 'flex',
    alignItems: 'stretch',
    height: '100%',
    flex: 1,
    gap: 0,
  },
  tab: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0 18px',
    color: '#9d9d9d',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    height: '100%',
    borderRight: '1px solid #3e3e42',
    transition: 'color 0.15s, background 0.15s',
    letterSpacing: '0.1px',
  },
  tabActive: {
    color: '#cccccc',
    background: '#1e1e1e',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    background: '#007acc',
    borderRadius: '2px 2px 0 0',
  },
  rightSlot: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
  },
  version: {
    fontSize: 11,
    color: '#6b6b6b',
    background: '#3c3c3c',
    borderRadius: 3,
    padding: '2px 7px',
  },
}

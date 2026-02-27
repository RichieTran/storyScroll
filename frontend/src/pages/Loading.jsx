import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STEPS = [
  { id: 'story',   label: 'Processing story text',       duration: 1200 },
  { id: 'tts',     label: 'Generating audio narration',  duration: 3500 },
  { id: 'captions',label: 'Creating caption timing',     duration: 1800 },
  { id: 'video',   label: 'Compositing background video',duration: 4000 },
  { id: 'render',  label: 'Rendering final output',      duration: 2500 },
  { id: 'done',    label: 'Done!',                        duration: 0 },
]

const FUN_FACTS = [
  'The average TikTok story video is between 60 and 90 seconds long.',
  'Background gameplay footage can boost watch time by up to 30%.',
  'Adding captions can increase video views by up to 80%.',
  'Minecraft parkour is one of the most popular background loops on TikTok.',
  'r/tifu stories average 600 words — about 4 minutes of narration.',
  'Most viral story videos hook the viewer in the first 3 seconds.',
]

export default function Loading() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { story, video } = location.state || {}

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress]       = useState(0)
  const [jobId, setJobId]             = useState(null)
  const [factIndex, setFactIndex]     = useState(0)
  const [error, setError]             = useState(null)
  const intervalRef = useRef(null)
  const stepRef     = useRef(0)

  // Kick off the generation job
  useEffect(() => {
    async function startJob() {
      try {
        const res  = await fetch('/api/generate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ story, video }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Generation failed')
        setJobId(data.job_id)
      } catch (e) {
        setError(e.message)
      }
    }
    if (story && video) startJob()
  }, [])

  // Simulate step progress (real polling would use the job_id)
  useEffect(() => {
    let elapsed = 0
    const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0)

    intervalRef.current = setInterval(() => {
      elapsed += 100
      const pct = Math.min((elapsed / totalDuration) * 100, 99)
      setProgress(pct)

      let cumulative = 0
      for (let i = 0; i < STEPS.length - 1; i++) {
        cumulative += STEPS[i].duration
        if (elapsed < cumulative) {
          setCurrentStep(i)
          stepRef.current = i
          break
        }
        if (i === STEPS.length - 2) {
          setCurrentStep(STEPS.length - 1)
          stepRef.current = STEPS.length - 1
        }
      }
    }, 100)

    // When all steps done, navigate to result
    const total = STEPS.reduce((s, x) => s + x.duration, 0)
    const timer = setTimeout(() => {
      clearInterval(intervalRef.current)
      setProgress(100)
      setCurrentStep(STEPS.length - 1)
      setTimeout(() => {
        navigate('/result', { state: { story, video, jobId: jobId || 'demo-job' } })
      }, 800)
    }, total)

    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timer)
    }
  }, [])

  // Cycle fun facts
  useEffect(() => {
    const t = setInterval(() => {
      setFactIndex((i) => (i + 1) % FUN_FACTS.length)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  if (error) {
    return (
      <main className="page-content fade-in">
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="#f44747" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2>Something went wrong</h2>
          <p style={{ color: '#9d9d9d' }}>{error}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-content fade-in">
      <div style={styles.container}>
        {/* Animated icon */}
        <div style={styles.iconRing}>
          <div style={styles.spinner}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#007acc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>

        <h2 style={styles.title}>Generating your video</h2>
        <p style={styles.subtitle}>
          {story?.title
            ? `"${story.title.slice(0, 60)}${story.title.length > 60 ? '…' : ''}"`
            : 'Processing your story...'}
        </p>

        {/* Progress bar */}
        <div style={styles.progressWrap}>
          <div className="progress-bar" style={{ height: 6 }}>
            <div
              className="progress-bar__fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span style={styles.progressLabel}>{Math.round(progress)}%</span>
        </div>

        {/* Steps */}
        <div style={styles.stepList}>
          {STEPS.map((step, i) => {
            const done    = i < currentStep
            const active  = i === currentStep
            const pending = i > currentStep
            return (
              <div key={step.id} style={styles.stepRow}>
                <div style={{
                  ...styles.stepDot,
                  background: done ? '#4ec9b0' : active ? '#007acc' : '#3c3c3c',
                  borderColor: done ? '#4ec9b0' : active ? '#007acc' : '#3e3e42',
                }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {active && <div style={styles.dotPulse} />}
                </div>
                <span style={{
                  ...styles.stepLabel,
                  color: done ? '#4ec9b0' : active ? '#cccccc' : '#6b6b6b',
                }}>
                  {step.label}
                  {active && <span style={styles.ellipsis}>...</span>}
                </span>
              </div>
            )
          })}
        </div>

        {/* Fun fact */}
        <div style={styles.factBox}>
          <span style={styles.factLabel}>Did you know?</span>
          <p style={styles.factText}>{FUN_FACTS[factIndex]}</p>
        </div>
      </div>
    </main>
  )
}

const styles = {
  container: {
    maxWidth: 560,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 32,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    border: '3px solid #3e3e42',
    borderTopColor: '#007acc',
    animation: 'spin 1.2s linear infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  spinner: {
    animation: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9d9d9d',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  progressWrap: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  progressLabel: {
    fontSize: 12,
    color: '#007acc',
    fontWeight: 600,
    fontFamily: 'monospace',
    minWidth: 36,
    textAlign: 'right',
  },
  stepList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 36,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#007acc',
    animation: 'pulse 1s ease-in-out infinite',
  },
  stepLabel: {
    fontSize: 13,
    transition: 'color 0.3s ease',
  },
  ellipsis: {
    display: 'inline-block',
    animation: 'fadeIn 0.5s infinite alternate',
    marginLeft: 2,
  },
  factBox: {
    width: '100%',
    background: '#252526',
    border: '1px solid #3e3e42',
    borderRadius: 8,
    padding: '14px 18px',
    transition: 'all 0.3s ease',
  },
  factLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#007acc',
    display: 'block',
    marginBottom: 6,
  },
  factText: {
    fontSize: 13,
    color: '#9d9d9d',
    lineHeight: 1.6,
  },
  errorContainer: {
    maxWidth: 480,
    margin: '60px auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },
  errorIcon: {
    marginBottom: 8,
  },
}

import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import StoryInput from './pages/StoryInput'
import RedditBrowser from './pages/RedditBrowser'
import VideoSelection from './pages/VideoSelection'
import Loading from './pages/Loading'
import Result from './pages/Result'

export default function App() {
  const location = useLocation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentPath={location.pathname} />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/story"   element={<StoryInput />} />
        <Route path="/reddit"  element={<RedditBrowser />} />
        <Route path="/video"   element={<VideoSelection />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/result"  element={<Result />} />
      </Routes>
    </div>
  )
}

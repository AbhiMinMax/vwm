import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen.jsx'
import SessionScreen from './screens/SessionScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import DevScreen from './screens/DevScreen.jsx'

export default function App() {
  return (
    <BrowserRouter basename="/vwm">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/session" element={<SessionScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/dev" element={<DevScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

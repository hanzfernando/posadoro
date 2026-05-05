import { BreakOverlay } from './screens/BreakOverlay'
import { MiniTimer } from './screens/MiniTimer'
import { SettingsWindow } from './screens/SettingsWindow'

function App(): React.JSX.Element {
  const page = new URLSearchParams(window.location.search).get('window')

  if (page === 'overlay') return <BreakOverlay />
  if (page === 'settings') return <SettingsWindow />
  return <MiniTimer />
}

export default App

import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import MiCajaScreen from './components/MiCajaScreen'
import MiPanaScreen from './components/MiPanaScreen'
import MenuScreen from './components/MenuScreen'
import DeunaNegociosScreen from './components/DeunaNegociosScreen'

type Screen = 'login' | 'home' | 'mi-caja' | 'mi-pana' | 'menu'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login')

  // Login screen (DeunaNegociosScreen)
  if (currentScreen === 'login') {
    return <DeunaNegociosScreen onLogin={() => setCurrentScreen('home')} />
  }

  // Mi Caja screen
  if (currentScreen === 'mi-caja') {
    return <MiCajaScreen onBack={() => setCurrentScreen('home')} />
  }

  // Mi Pana screen (chatbot)
  if (currentScreen === 'mi-pana') {
    return <MiPanaScreen onBack={() => setCurrentScreen('home')} />
  }

  // Menu screen
  if (currentScreen === 'menu') {
    return (
      <MenuScreen
        onBack={() => setCurrentScreen('home')}
        onLogout={() => setCurrentScreen('login')}
      />
    )
  }

  // Home screen (default)
  return <HomeScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />
}

export default App

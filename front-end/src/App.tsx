import { useState } from "react";
import DeunaNegociosScreen from "./components/DeunaNegociosScreen";
import HomeScreen from "./components/HomeScreen";
import MenuScreen from "./components/MenuScreen";
import MiCajaScreen from "./components/MiCajaScreen";
import MiPanaScreen from "./components/MiPanaScreen";
import SaludFinancieraScreen from "./components/SaludFinancieraScreen";
import { setComercioId } from "./services/backendService";

type Screen = "login" | "home" | "mi-caja" | "mi-pana" | "menu" | "salud";

const MERCHANT_NAMES: Record<string, string> = {
  "COM-001": "Tienda Don Aurelio",
  "COM-002": "Fonda Don Jorge",
  "COM-003": "Salón Belleza Total",
};

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [comercioId, setComercioIdState] = useState("COM-001");
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const handleLogin = (destination: "home" | "mi-pana" = "home", id = "COM-001") => {
    setComercioIdState(id);
    setComercioId(id);
    setCurrentScreen(destination);
  };

  const goToMiPana = (message?: string) => {
    setInitialMessage(message);
    setCurrentScreen("mi-pana");
  };

  if (currentScreen === "login") {
    return <DeunaNegociosScreen onLogin={handleLogin} />;
  }

  if (currentScreen === "mi-caja") {
    return <MiCajaScreen onBack={() => setCurrentScreen("home")} />;
  }

  if (currentScreen === "mi-pana") {
    return (
      <MiPanaScreen
        onBack={() => { setInitialMessage(undefined); setCurrentScreen("home"); }}
        comercioId={comercioId}
        initialMessage={initialMessage}
      />
    );
  }

  if (currentScreen === "menu") {
    return (
      <MenuScreen
        onBack={() => setCurrentScreen("home")}
        onLogout={() => setCurrentScreen("login")}
      />
    );
  }

  if (currentScreen === "salud") {
    return (
      <SaludFinancieraScreen
        onBack={() => setCurrentScreen("home")}
        onMiPana={goToMiPana}
        comercioId={comercioId}
        merchantName={MERCHANT_NAMES[comercioId] ?? "Mi Negocio"}
      />
    );
  }

  return (
    <HomeScreen
      onNavigate={(screen) => setCurrentScreen(screen as Screen)}
      comercioId={comercioId}
      merchantName={MERCHANT_NAMES[comercioId] ?? "Mi Negocio"}
    />
  );
}

export default App;

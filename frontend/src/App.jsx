import { useState } from "react"; // 1. Import the state hook
import Login from "./pages/Login/Login";
import LoginAdmin from "./pages/LoginAdmin/LoginAdmin"; // 2. Import the new page
import LoginScout from "./pages/LoginScout/LoginScout"; // 2. Import the new page

function App() {
  // 3. Create a state called 'view'. Default is 'home'
  const [view, setView] = useState("home");

  // 4. Logic to decide which component to show
  if (view === "admin") {
    return <LoginAdmin onBack={() => setView("home")} />;
  }
  if (view === "scout") {
      return <LoginScout onBack={() => setView("home")} />;
  }
  return <Login
  onAdminClick={() => setView("admin")}
  onScoutClick={() => setView("scout")}

   />;
}

export default App;
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "./store/theme";
import Header from "./components/Header";
import useAuth from "./store/auth";

export default function App() {
  const { theme } = useTheme();
  const hydrate = useAuth((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="app-shell">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Header />
          <main className="mt-12 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

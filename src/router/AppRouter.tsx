import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { MainLayout } from "../layout/Main";

import { GalaxyDefense } from "../features/galaxy-defense";

function HomePage() {
  return (
    <div className="app margin-top-20">
      <MainLayout />
    </div>
  );
}

function AppRouter() {
  const configuredBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const hasConfiguredBase =
    window.location.pathname === configuredBase ||
    window.location.pathname.startsWith(`${configuredBase}/`);
  const basename = hasConfiguredBase ? configuredBase : "";

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/game" element={<GalaxyDefense />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

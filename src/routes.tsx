import { Routes, Route } from "react-router-dom";
import BaseLayout from "./components/layout/base-layout";
import {
  EditorPage,
  ContentPage,
  MeasurePage,
  DashboardPage,
} from "@components/pages";

/* ---------------------------------------------------------------------------- */

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<BaseLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/write" element={<EditorPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/measure" element={<MeasurePage />} />
      </Route>
    </Routes>
  );
}

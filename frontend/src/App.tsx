import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import CoordBlitz from "./features/coord-blitz/CoordBlitz";
import PlayBoard from "./features/play-board/PlayBoard";
import Appearance from "./features/appearance/Appearance";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/play" replace />} />
        <Route path="/play" element={<PlayBoard />} />
        <Route path="/coord-blitz" element={<CoordBlitz />} />
        <Route path="/appearance" element={<Appearance />} />
      </Route>
    </Routes>
  );
}

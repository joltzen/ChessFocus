import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLAyout";
import CoordBlitz from "./features/coord-blitz/CoordBlitz";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/coord-blitz" replace />} />
        <Route path="/coord-blitz" element={<CoordBlitz />} />
        {/* Platz für weitere Trainings: */}
        {/* <Route path="/pattern-vision" element={<PatternVision />} /> */}
        {/* <Route path="/endgame-trainer" element={<EndgameTrainer />} /> */}
      </Route>
    </Routes>
  );
}

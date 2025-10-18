import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">♟️ Chess Trainer</div>

        <nav className="nav">
          <NavLink
            to="/coord-blitz"
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            🧭 Coord Blitz
          </NavLink>

          {/* weitere Buttons/Links */}
          {/* <NavLink to="/pattern-vision" className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>🧩 Pattern Vision</NavLink> */}
          {/* <NavLink to="/endgame-trainer" className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>🏁 Endgame Trainer</NavLink> */}
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

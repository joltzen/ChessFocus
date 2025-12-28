import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">♟️ Chess Trainer</div>
        <nav className="nav">
          <NavLink
            to="/play"
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            ♟️ Freies Spiel
          </NavLink>
          <NavLink
            to="/coord-blitz"
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            🧭 Coord Blitz
          </NavLink>
          <NavLink
            to="/appearance"
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            🎨 Appearance
          </NavLink>
          <NavLink
            to="/blind"
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            🕶 Blind Chess
          </NavLink>
          <NavLink
            to="/color-guesser"
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            ⬜⬛ Color Guesser
          </NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

import "./styles.css";
import Board from "./components/Board";

export default function App() {
  return (
    <main>
      <h1 style={{ textAlign: "center", marginBottom: 16 }}>
        React Schachbrett
      </h1>
      <Board />
    </main>
  );
}

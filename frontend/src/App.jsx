import { useState } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { MotionConfig } from "motion/react";
import useGame from "./hooks/useGame";
import Brand from "./components/Brand";
import ConfirmDialog from "./components/ConfirmDialog";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import CompletionPage from "./pages/CompletionPage";
import StatisticsPage from "./pages/StatisticsPage";

export default function App() {
  const controller = useGame();
  const [view, setView] = useState("home");
  const [difficulty, setDifficulty] = useState("EASY");
  const [confirm, setConfirm] = useState(null);
  const { game, busy, error, notice } = controller;
  const completed = view === "game" && game?.status === "completed";
  function navigate(next) {
    controller.pause();
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function play() {
    if (await controller.start(difficulty)) {
      setView("game");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function requestPlay() {
    if (game && game.status !== "completed") setConfirm("replace");
    else play();
  }
  async function resume() {
    if (await controller.resume()) {
      setView("game");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <header className="site-header">
          <Brand onClick={() => navigate("home")} />
          <nav aria-label="Main navigation">
            <button
              className={view !== "statistics" ? "active" : ""}
              onClick={() => navigate("home")}
            >
              The playground
            </button>
            <button
              className={view === "statistics" ? "active" : ""}
              onClick={() => navigate("statistics")}
            >
              Your progress <ArrowUpRight size={14} />
            </button>
          </nav>
          <span className="header-note">
            <span className="live-dot" /> A GOOD PLACE TO PAUSE
          </span>
        </header>
        {error && (
          <div className="message-banner error-banner" role="alert">
            <TriangleAlert size={18} />
            <span>{error}</span>
            <button
              onClick={
                view === "game"
                  ? completed
                    ? controller.exportSolution
                    : controller.retryValidation
                  : controller.loadCatalog
              }
              disabled={busy}
            >
              <RotateCcw size={15} /> Try again
            </button>
          </div>
        )}
        {controller.loadingCatalog && (
          <div className="loading-banner" role="status">
            <LoaderCircle size={16} className="spin" /> Finding your next
            possibility…
          </div>
        )}
        {view === "home" && (
          <HomePage
            controller={controller}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onPlay={requestPlay}
            onResume={resume}
          />
        )}
        {view === "statistics" && (
          <StatisticsPage
            statistics={controller.statistics}
            onPlay={() => navigate("home")}
          />
        )}
        {view === "game" &&
          game &&
          (completed ? (
            <CompletionPage
              controller={controller}
              onPlayAgain={() => navigate("home")}
              onStatistics={() => navigate("statistics")}
            />
          ) : (
            <GamePage
              controller={controller}
              onNewGame={() => navigate("home")}
              onRestart={() => setConfirm("restart")}
            />
          ))}
        <footer className="site-footer">
          <Brand onClick={() => navigate("home")} />
          <span>A little play goes a long way.</span>
          <span>
            MADE FOR A CLEARER MIND <span className="footer-star">✳</span>
          </span>
        </footer>
        <div className="sr-only" role="status" aria-live="polite">
          {notice}
        </div>
        {confirm && (
          <ConfirmDialog
            title={
              confirm === "restart" ? "A fresh start?" : "Start a new chapter?"
            }
            confirmLabel={
              confirm === "restart" ? "Restart puzzle" : "Start new game"
            }
            onClose={() => setConfirm(null)}
            onConfirm={async () => {
              const action = confirm;
              setConfirm(null);
              if (action === "restart") await controller.restart();
              else await play();
            }}
          >
            {confirm === "restart"
              ? "This resets the current puzzle, timer, hints, and mistakes. Your completed-game statistics will stay."
              : "Your saved puzzle will be replaced. You can keep it and resume whenever you like."}
          </ConfirmDialog>
        )}
      </div>
    </MotionConfig>
  );
}

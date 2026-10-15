import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Feather,
  Flame,
  Layers3,
  Play,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatTime } from "../hooks/useGame";
import ScoreRules from "../components/ScoreRules";

const levels = [
  {
    id: "EASY",
    label: "Easy",
    title: "Find your feet.",
    description: "Simple discoveries. A gentle way in.",
    Icon: Feather,
    className: "easy",
  },
  {
    id: "MEDIUM",
    label: "Medium",
    title: "Find your rhythm.",
    description: "A little more thought. A lovely little win.",
    Icon: Layers3,
    className: "medium",
  },
  {
    id: "HARD",
    label: "Hard",
    title: "Find your edge.",
    description: "Go deeper. Make the pieces click.",
    Icon: Flame,
    className: "hard",
  },
];
const illustration = [
  "050703060",
  "007000800",
  "000816000",
  "000030000",
  "005000100",
  "730040086",
  "906000204",
  "840572093",
  "000409000",
];

export default function HomePage({
  controller,
  difficulty,
  setDifficulty,
  onPlay,
  onResume,
}) {
  const { catalog, loadingCatalog, game, statistics, busy } = controller;
  const reduced = useReducedMotion();
  const best = statistics.length
    ? Math.max(...statistics.map((item) => item.score))
    : null;
  return (
    <motion.main
      className="home-page"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" /> YOUR DAILY DOSE OF CLARITY
          </span>
          <h1>
            A little focus.
            <br />A lot of{" "}
            <span className="flow-word">
              flow
              <svg viewBox="0 0 220 20" aria-hidden="true">
                <path d="M4 13 Q105 -1 211 10 M20 18 Q110 6 198 14" />
              </svg>
            </span>
          </h1>
          <p>
            Nine squares. Endless little discoveries.
            <br />
            Give your mind a moment to play.
          </p>
          <a className="text-link" href="#choose-your-challenge">
            Find your next challenge <ArrowRight size={17} />
          </a>
          <div className="hero-note">
            <span className="tiny-grid" aria-hidden="true">
              ✳
            </span>
            <span>
              No rush. No noise.
              <br />
              <strong>Just you and the next possibility.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="visual-star">✳</span>
          <div className="preview-label">
            <span className="live-dot" /> A MOMENT FOR YOUR MIND
          </div>
          <div className="preview-board">
            {illustration.map((row, r) =>
              [...row].map((value, c) => (
                <span
                  key={`${r}-${c}`}
                  className={`${c === 2 || c === 5 ? "preview-right" : ""} ${r === 2 || r === 5 ? "preview-bottom" : ""} ${r === 4 || c === 4 ? "preview-peer" : ""} ${r === 4 && c === 4 ? "preview-selected" : ""}`}
                >
                  {r === 4 && c === 4 ? (
                    <span className="preview-entry">9</span>
                  ) : value === "0" ? (
                    ""
                  ) : (
                    value
                  )}
                </span>
              )),
            )}
          </div>
          <div className="floating-note">
            <span>
              <Check size={18} strokeWidth={3} />
            </span>
            <div>
              That satisfying click.<small>One cell closer.</small>
            </div>
            <Sparkles size={19} />
          </div>
          <span className="visual-caption">SMALL MOVES. GOOD FEELINGS.</span>
        </div>
      </section>

      <section className="challenge-section" id="choose-your-challenge">
        <div className="section-title">
          <div>
            <span className="eyebrow">01 / MAKE IT YOURS</span>
            <h2>What’s your pace today?</h2>
          </div>
          <p>A good challenge meets you where you are.</p>
        </div>
        <div
          className="difficulty-cards"
          role="radiogroup"
          aria-label="Difficulty"
          onKeyDown={(event) => {
            if (
              !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            )
              return;
            event.preventDefault();
            const step = ["ArrowRight", "ArrowDown"].includes(event.key)
              ? 1
              : -1;
            const index =
              (levels.findIndex((level) => level.id === difficulty) +
                step +
                levels.length) %
              levels.length;
            setDifficulty(levels[index].id);
            event.currentTarget
              .querySelectorAll('[role="radio"]')
              [index].focus();
          }}
        >
          {levels.map(({ id, label, title, description, Icon, className }) => {
            const count = catalog.filter(
              (puzzle) => puzzle.difficulty === id,
            ).length;
            return (
              <button
                key={id}
                role="radio"
                tabIndex={difficulty === id ? 0 : -1}
                aria-checked={difficulty === id}
                className={`difficulty-card ${className} ${difficulty === id ? "active" : ""}`}
                onClick={() => setDifficulty(id)}
              >
                <div className="difficulty-top">
                  <span className="difficulty-symbol">
                    <Icon size={25} strokeWidth={1.5} />
                  </span>
                  <span className="difficulty-radio">
                    {difficulty === id && <Check size={14} />}
                  </span>
                </div>
                <span className="difficulty-label">{label}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="difficulty-bottom">
                  <span>
                    {loadingCatalog
                      ? "Finding your puzzles…"
                      : `${count} rated puzzles`}
                  </span>
                  <span
                    className="level-bars"
                    aria-label={`${label} difficulty`}
                  >
                    {[0, 1, 2].map((bar) => (
                      <i
                        key={bar}
                        className={
                          bar <= levels.findIndex((level) => level.id === id)
                            ? "filled"
                            : ""
                        }
                      />
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="start-row">
          <span>
            <Check size={15} /> Thoughtfully rated. Uniquely solvable.
          </span>
          <button
            className="button primary play-button"
            disabled={
              busy ||
              loadingCatalog ||
              !catalog.some((puzzle) => puzzle.difficulty === difficulty)
            }
            onClick={onPlay}
          >
            {busy ? "Preparing your puzzle…" : "Let’s play"}
            <ArrowRight size={19} />
          </button>
        </div>
        <ScoreRules />
      </section>

      {!loadingCatalog && !catalog.length && (
        <div className="empty-catalog" role="status">
          <p>
            No playable puzzles are available yet. Check the game server, then
            try again.
          </p>
          <button className="text-link" onClick={controller.loadCatalog}>
            Reload puzzle catalog <ArrowRight size={16} />
          </button>
        </div>
      )}
      {game && game.status !== "completed" && (
        <section className="resume-card">
          <span className="resume-icon">
            <Play size={22} />
          </span>
          <div>
            <span className="eyebrow">A LITTLE UNFINISHED BUSINESS</span>
            <h3>
              Your {game.puzzle.difficulty.toLowerCase()} puzzle is waiting.
            </h3>
            <p>
              {formatTime(Math.floor(game.elapsedMs / 1000))} played · Progress
              saved on this device
            </p>
          </div>
          <button
            className="button secondary"
            onClick={onResume}
            disabled={busy}
          >
            Pick up where you left off <ArrowUpRight size={18} />
          </button>
        </section>
      )}

      <section className="home-bottom">
        <div className="mindful-note">
          <span className="eyebrow">MORE THAN NUMBERS</span>
          <h3>
            A small ritual.
            <br />A clearer head.
          </h3>
          <p>
            Find a pattern. Follow a possibility.
            <br />
            Enjoy the feeling of figuring it out.
          </p>
        </div>
        <div className="home-stat">
          <span className="stat-icon">
            <Check size={20} />
          </span>
          <strong>{statistics.length.toString().padStart(2, "0")}</strong>
          <span>grids made whole</span>
        </div>
        <div className="home-stat">
          <span className="stat-icon">
            <Sparkles size={20} />
          </span>
          <strong>{best?.toLocaleString() || "—"}</strong>
          <span>your personal best</span>
        </div>
        <div className="home-stat ritual">
          <Clock3 size={23} />
          <h4>A moment well spent.</h4>
          <p>
            Pause whenever you need.
            <br />
            Your progress comes with you.
          </p>
        </div>
      </section>
    </motion.main>
  );
}

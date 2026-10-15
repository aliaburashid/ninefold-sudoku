import { ArrowRight, BarChart3, Check, Sparkles, Timer } from "lucide-react";
import { formatTime } from "../hooks/useGame";

export default function StatisticsPage({ statistics, onPlay }) {
  const completed = statistics.length;
  const bestScore = completed
    ? Math.max(...statistics.map((item) => item.score))
    : null;
  const fastest = completed
    ? Math.min(...statistics.map((item) => item.elapsedSeconds))
    : null;
  return (
    <main className="statistics-page">
      <span className="eyebrow">YOUR OWN KIND OF PROGRESS</span>
      <h1>
        Small moments.
        <br />
        <span>Growing possibilities.</span>
      </h1>
      <p>Every finished grid is something you figured out.</p>
      <div className="statistics-overview">
        {[
          { Icon: Check, value: completed, label: "grids completed" },
          {
            Icon: Sparkles,
            value: bestScore?.toLocaleString() || "—",
            label: "best score",
          },
          {
            Icon: Timer,
            value: fastest !== null ? formatTime(fastest) : "—",
            label: "quickest finish",
          },
        ].map(({ Icon, value, label }) => (
          <div key={label}>
            <Icon size={22} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="section-title">
        <h2>A rhythm for every level.</h2>
        <span className="eyebrow">PERSONAL BESTS</span>
      </div>
      <div className="difficulty-statistics">
        {["EASY", "MEDIUM", "HARD"].map((difficulty) => {
          const games = statistics.filter(
            (item) => item.difficulty === difficulty,
          );
          return (
            <article key={difficulty}>
              <span className={`level-badge ${difficulty.toLowerCase()}`}>
                {difficulty.toLowerCase()}
              </span>
              <h3>
                {games.length}{" "}
                <span>
                  {games.length === 1 ? "grid completed" : "grids completed"}
                </span>
              </h3>
              <dl>
                <div>
                  <dt>Best score</dt>
                  <dd>
                    {games.length
                      ? Math.max(
                          ...games.map((item) => item.score),
                        ).toLocaleString()
                      : "Your first is waiting"}
                  </dd>
                </div>
                <div>
                  <dt>Best time</dt>
                  <dd>
                    {games.length
                      ? formatTime(
                          Math.min(...games.map((item) => item.elapsedSeconds)),
                        )
                      : "—"}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
      {!completed && (
        <div className="statistics-empty">
          <BarChart3 size={30} />
          <h2>Your story starts with one cell.</h2>
          <p>
            Complete your first puzzle and your personal bests will appear here.
          </p>
          <button className="button primary" onClick={onPlay}>
            Find a puzzle <ArrowRight size={17} />
          </button>
        </div>
      )}
      <p className="statistics-footnote">
        Your progress stays in this browser. Clearing browser storage clears
        these records.
      </p>
    </main>
  );
}

import {
  ArrowRight,
  Check,
  Download,
  Lightbulb,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { formatTime } from "../hooks/useGame";

export default function CompletionPage({
  controller,
  onPlayAgain,
  onStatistics,
}) {
  const { game, busy, exportSolution } = controller;
  const result = game.result;
  const reduced = useReducedMotion();
  const [displayScore, setDisplayScore] = useState(reduced ? result.score : 0);
  useEffect(() => {
    if (reduced) {
      setDisplayScore(result.score);
      return;
    }
    const start = performance.now();
    let frame;
    function tick(now) {
      const progress = Math.min(1, (now - start) / 1100);
      setDisplayScore(Math.round(result.score * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [result.score, reduced]);
  return (
    <motion.main
      className="completion-page"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="victory-art" aria-hidden="true">
        {!reduced &&
          Array.from({ length: 20 }, (_, index) => (
            <motion.i
              key={index}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: Math.cos((index * Math.PI) / 10) * 145,
                y: Math.sin((index * Math.PI) / 10) * 105,
                opacity: 0,
                rotate: index * 29,
              }}
              transition={{ duration: 1.8, delay: 0.15 }}
            />
          ))}
        <motion.span
          initial={reduced ? false : { scale: 0.6, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
        >
          <Trophy size={46} strokeWidth={1.5} />
        </motion.span>
      </div>
      <span className="eyebrow">EVERY LITTLE POSSIBILITY. FOUND.</span>
      <h1>
        Look at you <span>flow.</span>
      </h1>
      <p>Nine rows. Nine columns. One very satisfying finish.</p>
      <div className="victory-score">
        <span className="eyebrow">YOUR FINAL SCORE</span>
        <strong aria-label={`Final score ${result.score}`}>
          {displayScore.toLocaleString()}
        </strong>
        <span className="level-badge">
          {game.puzzle.difficulty.toLowerCase()} · {game.puzzle.title}
        </span>
      </div>
      <div className="completion-stats">
        <div>
          <Timer size={20} />
          <strong>{formatTime(result.elapsedSeconds)}</strong>
          <span>time well spent</span>
        </div>
        <div>
          <Lightbulb size={20} />
          <strong>{result.hints}</strong>
          <span>little hints</span>
        </div>
        <div>
          <Check size={20} />
          <strong>{result.mistakes}</strong>
          <span>mistakes overcome</span>
        </div>
      </div>
      <details className="score-rules victory-breakdown">
        <summary>Your score, explained</summary>
        <dl>
          <div>
            <dt>Difficulty points</dt>
            <dd>+{result.basePoints.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Time bonus</dt>
            <dd>+{result.timeBonus}</dd>
          </div>
          <div>
            <dt>Hints</dt>
            <dd>−{result.hintDeduction}</dd>
          </div>
          <div>
            <dt>Mistakes</dt>
            <dd>−{result.mistakeDeduction}</dd>
          </div>
        </dl>
        <p>Minimum final score: 100 points.</p>
      </details>
      <div className="victory-actions">
        <button className="button primary" onClick={onPlayAgain}>
          Find your next flow <ArrowRight size={18} />
        </button>
        <button
          className="button secondary"
          onClick={exportSolution}
          disabled={busy}
        >
          <Download size={17} /> {busy ? "Preparing…" : "Export solution"}
        </button>
      </div>
      <button className="text-link" onClick={onStatistics}>
        See your progress <Sparkles size={16} />
      </button>
    </motion.main>
  );
}

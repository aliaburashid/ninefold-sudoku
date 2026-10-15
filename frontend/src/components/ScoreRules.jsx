export default function ScoreRules() {
  return (
    <details className="score-rules">
      <summary>How your score works</summary>
      <div>
        <p>Finish at your own pace. Every completed grid earns points.</p>
        <dl>
          <div>
            <dt>Difficulty points</dt>
            <dd>Easy 1,000 · Medium 2,000 · Hard 3,000</dd>
          </div>
          <div>
            <dt>Time bonus</dt>
            <dd>600 points, minus 1 per 5 active seconds, down to 0</dd>
          </div>
          <div>
            <dt>Hints / mistakes</dt>
            <dd>−100 per hint · −25 per incorrect entry</dd>
          </div>
        </dl>
        <p>
          Your score never falls below 100. Pauses don’t count. Personal scores
          stay on this device.
        </p>
      </div>
    </details>
  );
}

export default function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Ninefold home">
      <span className="brand-mark" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <span>
        ninefold<span className="brand-dot">.</span>
      </span>
    </button>
  );
}

export default function NumberPad({ disabled, onInput }) {
  return (
    <div className="number-pad" aria-label="Number keypad">
      {Array.from({ length: 9 }, (_, index) => (
        <button
          disabled={disabled}
          key={index}
          onClick={() => onInput(index + 1)}
          aria-label={`Enter ${index + 1}`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}

import { useId, useState } from "react";

export default function StarRating({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover,  setHover]  = useState(0);
  const [comment, setComment] = useState("");
  const commentId = useId();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" aria-label="Choose a rating">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={rating === star}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl transition ${(hover || rating) >= star ? "border-[#e7cf87] bg-[#fff7df] text-[#b5831d]" : "border-[#16372d]/10 bg-white/78 text-[#b9c0bd]"}`}
          >
            ★
          </button>
        ))}
      </div>
      <label htmlFor={commentId} className="sr-only">Optional feedback comment</label>
      <textarea
        id={commentId}
        rows={2}
        placeholder="Optional comment..."
        className="min-h-28 w-full rounded-[1.2rem] border border-[#16372d]/10 bg-white/82 px-4 py-3 text-sm text-[#16372d]"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button
        type="button"
        disabled={rating === 0}
        onClick={() => onSubmit({ rating, comment })}
        className="civic-button-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Submit Feedback
      </button>
    </div>
  );
}
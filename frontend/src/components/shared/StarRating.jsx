import { useState } from "react";

export default function StarRating({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover,  setHover]  = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`text-3xl ${(hover || rating) >= star ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Optional comment..."
        className="w-full border rounded-lg px-3 py-2 text-sm"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button
        disabled={rating === 0}
        onClick={() => onSubmit({ rating, comment })}
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
      >
        Submit Feedback
      </button>
    </div>
  );
}
const colors = {
  PENDING:     "border-[#e7cf87] bg-[#fff7df] text-[#87671d]",
  VALIDATED:   "border-[#9ec8e1] bg-[#e7f4fb] text-[#175a7c]",
  ASSIGNED:    "border-[#b7b4e7] bg-[#efedff] text-[#4d4393]",
  IN_PROGRESS: "border-[#f3c18f] bg-[#fff0df] text-[#9a5b19]",
  RESOLVED:    "border-[#a7d5bd] bg-[#ebfbf0] text-[#1f6942]",
  ARCHIVED:    "border-[#e7bcc4] bg-[#fff0f3] text-[#8d4556]",
  CLOSED:      "border-[#d5d7d8] bg-[#f3f4f4] text-[#526160]",
  REJECTED:    "border-[#e0aaaa] bg-[#fdeceb] text-[#8e362a]",
  CANCELLED:   "border-[#d5d7d8] bg-[#f0f1f1] text-[#667373]",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.14em] ${colors[status] ?? "border-[#d5d7d8] bg-[#f3f4f4] text-[#526160]"}`}>
      {status}
    </span>
  );
}
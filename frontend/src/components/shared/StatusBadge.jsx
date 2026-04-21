const colors = {
  PENDING:     "bg-yellow-100 text-yellow-800",
  VALIDATED:   "bg-blue-100 text-blue-800",
  ASSIGNED:    "bg-purple-100 text-purple-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  RESOLVED:    "bg-green-100 text-green-800",
  ARCHIVED:    "bg-rose-100 text-rose-800",
  CLOSED:      "bg-gray-100 text-gray-800",
  REJECTED:    "bg-red-200 text-red-900",
  CANCELLED:   "bg-gray-200 text-gray-600",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] ?? "bg-gray-100"}`}>
      {status}
    </span>
  );
}
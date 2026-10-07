// Maps a record status (or an active flag) to a badge colour class.
export function statusBadgeClass(value) {
  if (value === true || value === "Posted" || value === "Active" || value === "Reconciled") {
    return "badge badge-success";
  }
  if (value === "Cancelled") {
    return "badge badge-danger";
  }
  return "badge badge-neutral";
}

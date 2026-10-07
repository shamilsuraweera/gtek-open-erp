export function getDisplayName(user) {
  if (!user) {
    return "";
  }
  return user.displayName || (user.email ? user.email.split("@")[0] : "User");
}

export function getInitials(user) {
  const name = getDisplayName(user).trim();
  if (!name) {
    return "?";
  }
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({ user, size = 34 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {getInitials(user)}
    </span>
  );
}


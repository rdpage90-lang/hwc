"use client";

import { useEffect, useState } from "react";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

/**
 * A driver name field that can optionally be linked to a real login
 * account. Type a name — if it matches an existing user, pick them from
 * the dropdown to link the driver to that account. If nobody matches (a
 * kid, a guest, anyone without a login), just keep typing and the driver
 * is created freeform, same as before.
 */
export function UserLinkedNameField({
  name,
  userId,
  onChange,
  placeholder = "Driver name",
}: {
  name: string;
  userId: string | null;
  onChange: (name: string, userId: string | null) => void;
  placeholder?: string;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoaded(true));
  }, []);

  const linkedUser = userId ? users.find((u) => u.id === userId) : null;

  const matches =
    !linkedUser && name.trim().length > 0
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(name.trim().toLowerCase()) ||
            u.email.toLowerCase().includes(name.trim().toLowerCase()),
        )
      : [];

  if (linkedUser) {
    return (
      <div className="flex items-center gap-2 bg-volt/5 border border-volt/40 px-3 py-2">
        <span className="text-sm text-white flex-1 truncate">{linkedUser.name}</span>
        <span className="hud-tick text-volt-bright">Linked</span>
        <button
          type="button"
          onClick={() => onChange(linkedUser.name, null)}
          className="text-[11px] font-mono uppercase tracking-wideish text-track-500 hover:text-signal-red"
        >
          Unlink
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={name}
        onChange={(e) => {
          onChange(e.target.value, null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="input"
      />
      {open && loaded && matches.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-track-850 border border-track-600 shadow-card max-h-48 overflow-y-auto">
          {matches.map((u) => (
            <button
              type="button"
              key={u.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(u.name, u.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-track-800 flex items-center justify-between gap-2"
            >
              <span className="text-sm text-white">{u.name}</span>
              <span className="text-xs text-track-500 truncate">{u.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

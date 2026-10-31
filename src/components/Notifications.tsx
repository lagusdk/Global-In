"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Level } from "@/lib/types";
import { IconBell, IconChevron } from "./icons";
import { LevelTag } from "./ui";

export type Note = { id: string; level?: Level; tag?: string; title: string; sub?: string; href?: string };

/** 홈 상단 알림 버튼 + 펼침 목록 */
export function Notifications({ notes }: { notes: Note[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const unread = seen ? 0 : notes.length;

  return (
    <div ref={wrapRef} style={{ position: "relative", marginRight: -10 }}>
      <button
        className="icon-btn"
        aria-label={unread ? `알림 ${unread}개` : "알림"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((o) => !o);
          setSeen(true);
        }}
        style={{ position: "relative" }}
      >
        <IconBell />
        {unread > 0 && (
          <span aria-hidden="true" style={{ position: "absolute", top: 8, right: 8, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "#c42b1c", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="알림" style={{ position: "absolute", right: 0, top: 48, width: "min(340px, calc(100vw - 32px))", background: "#fff", border: "1.5px solid #111", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.12)", zIndex: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1.5px solid #111" }}>
            <span className="h2">알림</span>
            <button onClick={() => setOpen(false)} className="small" style={{ background: "none", border: 0, cursor: "pointer", padding: 8, margin: -8 }}>
              닫기
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="small muted" style={{ padding: 16 }}>
              새 알림이 없어요.
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {notes.map((n) => {
                const body = (
                  <>
                    {n.level ? <LevelTag level={n.level}>{n.tag}</LevelTag> : <span className="tag-info">{n.tag ?? "알림"}</span>}
                    <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{n.title}</span>
                      {n.sub && <span className="small muted">{n.sub}</span>}
                    </span>
                    {n.href && <IconChevron size={16} />}
                  </>
                );
                const style = { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #dadad6" } as const;
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} style={style} onClick={() => setOpen(false)}>
                        {body}
                      </Link>
                    ) : (
                      <div style={style}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/onboarding" className="small" style={{ display: "block", padding: "12px 16px", background: "#f4f4f2", fontWeight: 600 }}>
            체류 정보 수정
          </Link>
        </div>
      )}
    </div>
  );
}

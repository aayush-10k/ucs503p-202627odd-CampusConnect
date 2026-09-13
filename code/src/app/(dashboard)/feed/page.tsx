export default function FeedPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "1rem",
      fontFamily: "var(--font-heading)",
      background: "var(--color-background)",
    }}>
      <div style={{ fontSize: "3rem" }}>🚀</div>
      <h1 style={{ fontSize: "1.5rem", color: "var(--color-primary)", fontWeight: 900 }}>
        You're logged in!
      </h1>
      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
        The social feed is coming in Phase 4. Auth is working correctly ✅
      </p>
    </div>
  );
}

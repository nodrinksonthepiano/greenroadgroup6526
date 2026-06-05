"use client";

export function CommandSearch() {
  return (
    <footer
      id="join-section"
      className="command-search"
      aria-label="Explore search"
    >
      <div className="command-search__inner">
        <input
          type="search"
          className="command-search__input"
          placeholder="What do you want to explore, learn, or buy?"
          aria-label="What do you want to explore, learn, or buy?"
          readOnly
        />
        <p className="command-search__hint">
          Search coming soon — explore · learn · buy
        </p>
      </div>
    </footer>
  );
}

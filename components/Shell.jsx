export default function Shell({ children, kicker = "Waiting list · First access" }) {
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="https://jobhackers.global" target="_blank" rel="noreferrer">
          <img src="/jhg-logo.png" alt="JobHackers Global" />
        </a>
        <div className="kicker">
          <span className="dot" />
          {kicker}
        </div>
      </header>

      <main className="stage">{children}</main>

      <img className="handprint" src="/jhg-hand.png" alt="" aria-hidden="true" />

      <footer className="footbar">
        <span>© {new Date().getFullYear()} JobHackers Global</span>
        <span>Get a job you love</span>
      </footer>
    </div>
  );
}

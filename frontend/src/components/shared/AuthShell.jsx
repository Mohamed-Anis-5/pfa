import { Link } from "react-router-dom";
import PublicHeader from "./PublicHeader";

export default function AuthShell({
  eyebrow,
  title,
  description,
  highlights,
  children,
  footer,
}) {
  return (
    <div className="civic-page">
      <PublicHeader />
      <main className="civic-shell auth-layout">
        <section className="auth-aside civic-panel">
          <p className="civic-kicker">{eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-5xl leading-[1.04] tracking-[-0.05em] text-[#16372d] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 civic-text-soft sm:text-lg">
            {description}
          </p>

          <div className="auth-highlight-list">
            {highlights.map((item) => (
              <div key={item.title} className="auth-highlight-item">
                <span className="auth-highlight-dot" />
                <div>
                  <p className="text-sm font-semibold text-[#16372d]">{item.title}</p>
                  <p className="mt-1 text-sm leading-7 text-[#5e746d]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-[#16372d] px-5 py-5 text-[#f7f2e8] shadow-[0_20px_40px_rgba(22,55,45,0.18)]">
            <p className="civic-kicker !text-[#c7d7d0]">Need to look around first?</p>
            <p className="mt-3 text-sm leading-7 text-[#deebe5]">
              You can browse the platform structure from the public home page before creating an account.
            </p>
            <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-[#f5cb72] hover:text-[#ffd989]">
              Return to public overview
            </Link>
          </div>
        </section>

        <section className="auth-form-panel civic-panel">
          {children}
          {footer}
        </section>
      </main>
    </div>
  );
}
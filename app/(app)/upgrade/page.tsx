export default function UpgradePage() {
  return (
    <div className="page-shell space-y-8 pb-20">
      <div className="page-header">
        <p className="page-subtitle page-kicker">Plans</p>
        <h1 className="page-title mt-4">Upgrade to Pro</h1>
      </div>

      <div className="page-content-stack space-y-6">
        <section
          className="panel-surface rounded-[24px] p-6 sm:p-8"
          style={{ border: '1px solid rgba(245,166,35,0.18)' }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="page-subtitle" style={{ color: 'var(--amber)' }}>Free vs Pro</p>
            <h2 className="form-card-title mt-3">Unlock the full cashflow operating system</h2>
            <p className="form-card-copy mt-3">
              Free keeps the core workflow lightweight. Pro is where forecasting, AI insight, and unlimited growth live.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div
              className="rounded-[20px] p-5"
              style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}
            >
              <p className="section-label">Free</p>
              <h3 className="dashboard-card-title mt-3">Stay operational</h3>
              <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text2)' }}>
                <li>Up to 2 clients</li>
                <li>Projects, payment history, and schedule tracking</li>
                <li>Manual cashflow management without AI or forecast unlocks</li>
              </ul>
            </div>

            <div
              className="rounded-[20px] p-5"
              style={{
                border: '1px solid rgba(245,166,35,0.22)',
                background: 'linear-gradient(180deg, rgba(245,166,35,0.10) 0%, rgba(10,14,33,0.72) 100%)',
                boxShadow: '0 0 30px rgba(245,166,35,0.10)',
              }}
            >
              <p className="section-label" style={{ color: 'var(--amber)' }}>Pro</p>
              <h3 className="dashboard-card-title mt-3">Operate with predictability</h3>
              <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text2)' }}>
                <li>Unlimited clients and future upgrade gates removed</li>
                <li>Forecast surfaces and AI insight cards</li>
                <li>Shared upsell and plan-gate flows ready for checkout wiring</li>
              </ul>
            </div>
          </div>

          <div
            className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[18px] px-5 py-4 text-center sm:flex-row sm:text-left"
            style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}
          >
            <div>
              <p className="dashboard-card-title">Checkout is the next build step</p>
              <p className="dashboard-card-copy mt-1">
                Stripe billing and customer portal flow are next after the current polish pass is complete.
              </p>
            </div>
            <span className="upgrade-link">Billing coming soon</span>
          </div>
        </section>
      </div>
    </div>
  )
}

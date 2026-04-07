export default function UpgradePage() {
  return (
    <div className="page-shell space-y-8 pb-20">
      <div className="page-header">
        <p className="page-subtitle page-kicker">Plans</p>
        <h1 className="page-title mt-4">Upgrade to Pro</h1>
      </div>
      <div className="page-content-stack page-content-copy">
        <p className="text-center text-sm" style={{ color: 'var(--text2)' }}>
          Stripe checkout will be available in Phase 4.
        </p>
      </div>
    </div>
  )
}

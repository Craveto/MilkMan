import React from 'react';
import '../styles/UserModules.css';

function UserOffersPage({ authUser }) {
  const referralCode = `MM-${String(authUser?.id || 0).padStart(4, '0')}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
    } catch (error) {
      // Clipboard fallback is intentionally omitted for minimal UI noise.
    }
  };

  return (
    <div className="user-module">
      <header className="user-module-header">
        <h1>Offers & Referrals</h1>
        <p>Use offers and referral rewards to save more on subscriptions.</p>
      </header>

      <div className="module-grid">
        <article className="module-card">
          <h3>Referral Program</h3>
          <div className="module-meta">Share your code and earn INR 100 after each successful signup.</div>
          <div className="module-actions">
            <button type="button" onClick={copyCode}>{referralCode}</button>
          </div>
        </article>

        <article className="module-card">
          <h3>Monthly Offer</h3>
          <div className="module-meta">Get 10% off on yearly plan upgrades this month.</div>
          <div className="module-actions">
            <button type="button">Apply Offer</button>
          </div>
        </article>
      </div>
    </div>
  );
}

export default UserOffersPage;

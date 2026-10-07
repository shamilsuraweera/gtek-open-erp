import "../layout/account.css";
import { CURRENCIES, usePreferences } from "../context/PreferencesContext";

const DENSITIES = [
  { value: "comfortable", label: "Comfortable", hint: "Roomier rows and controls" },
  { value: "compact", label: "Compact", hint: "More data on screen" },
];

function GeneralSettings() {
  const { prefs, setPref, resetPrefs } = usePreferences();

  return (
    <div className="settings-page">
      <section className="card">
        <h2 className="card-title">Display</h2>
        <p className="card-sub">How tables and forms are laid out on this device.</p>

        <div className="choice-group" role="radiogroup" aria-label="Density">
          {DENSITIES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={prefs.density === option.value}
              className={`choice${prefs.density === option.value ? " selected" : ""}`}
              onClick={() => setPref("density", option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Regional</h2>
        <p className="card-sub">Currency symbol used for dashboard figures.</p>

        <div className="field">
          <label htmlFor="setting-currency">Currency</label>
          <select id="setting-currency" value={prefs.currency} onChange={(event) => setPref("currency", event.target.value)}>
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} — {currency.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">About</h2>
        <dl className="about-list">
          <dt>Application</dt>
          <dd>G-TEK ERP</dd>
          <dt>API endpoint</dt>
          <dd>{process.env.REACT_APP_API_URL || "http://localhost:3000"}</dd>
        </dl>
      </section>

      <div className="form-actions">
        <button type="button" onClick={resetPrefs}>
          Reset all preferences
        </button>
      </div>
    </div>
  );
}

export default GeneralSettings;

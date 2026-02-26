import { useState, useEffect } from "react";
import { api } from "../api/client";
import "./WizardLayout.css";

const BACKEND_PENDING_MESSAGES = [
  "Connecting to the server…",
  "Waking up the service. First load may take up to a minute.",
  "Getting access to building data…",
  "Please wait. The server is starting up…",
  "Loading calculator service…",
  "Almost there. Preparing your data…",
  "Connecting to HeatMyKiez backend…",
];

interface Step1AddressProps {
  onAdd: (postcode: string, address: string) => void;
  loading?: boolean;
  error?: string;
  backendStatus?: "pending" | "ready" | "error";
}

export function Step1Address({ onAdd, loading, error, backendStatus = "pending" }: Step1AddressProps) {
  const [postcode, setPostcode] = useState("");
  const [streets, setStreets] = useState<string[]>([]);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [streetsLoading, setStreetsLoading] = useState(false);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [pendingMessageIndex, setPendingMessageIndex] = useState(0);

  useEffect(() => {
    if (!postcode || postcode.length < 3) {
      setStreets([]);
      setStreet("");
      setNumbers([]);
      setNumber("");
      return;
    }
    setStreetsLoading(true);
    api.getStreets(postcode).then((r) => {
      setStreets(r.streets || []);
      setStreet("");
      setNumbers([]);
      setNumber("");
    }).catch(() => setStreets([])).finally(() => setStreetsLoading(false));
  }, [postcode]);

  useEffect(() => {
    if (!postcode || !street) {
      setNumbers([]);
      setNumber("");
      return;
    }
    setNumbersLoading(true);
    api.getNumbers(postcode, street).then((r) => {
      setNumbers(r.numbers || []);
      setNumber("");
    }).catch(() => setNumbers([])).finally(() => setNumbersLoading(false));
  }, [postcode, street]);

  useEffect(() => {
    if (backendStatus !== "pending") return;
    const interval = setInterval(() => {
      setPendingMessageIndex((i) => (i + 1) % BACKEND_PENDING_MESSAGES.length);
    }, 10_000);
    return () => clearInterval(interval);
  }, [backendStatus]);

  const address = [street, number].filter(Boolean).join(" ");
  const canAdd = postcode && address && !loading;

  return (
    <div className="wizard-step step1-address">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
        <button type="button" className="menu-icon" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className="step1-address-layout">
        <div className="step1-address-copy">
          <p className="step-desc">To understand your situation, we need some data from you.</p>
          <p className="step-desc-secondary">First, let us know where do you live.</p>
          <div className="stepper" role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={4}>
            <span className="step-connector" aria-hidden="true" />
            <span className="step active">1</span>
            <span className="step">2</span>
            <span className="step">3</span>
            <span className="step">4</span>
          </div>
        </div>

        <div className="step1-address-form-col">
          <div className="form form-address">
            <div className="field field-city">
              <label>City</label>
              <input type="text" value="Berlin" readOnly className="autofill" />
            </div>
            <div className="field field-postcode">
              <label>Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. 13593"
              />
            </div>
            <div className="field field-street">
              <label>Street</label>
              <select
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={!postcode || streetsLoading}
              >
                <option value="">Select street</option>
                {streets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field field-number">
              <label>Number</label>
              <select
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                disabled={!street || numbersLoading}
              >
                <option value="">Select number</option>
                {numbers.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="backend-connection-status" aria-live="polite">
            {backendStatus === "pending" && (
              <p className="backend-connection-pending">
                {BACKEND_PENDING_MESSAGES[pendingMessageIndex]}
              </p>
            )}
            {backendStatus === "ready" && (
              <p className="backend-connection-ready">
                <span className="backend-connection-check" aria-hidden="true">✓</span>
                Connection established. You can use the service.
              </p>
            )}
            {backendStatus === "error" && (
              <p className="backend-connection-error">
                Server unreachable. You can still try; it may respond after a short delay.
              </p>
            )}
          </div>
        </div>

        <div className="step1-address-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canAdd}
            onClick={() => onAdd(postcode, address)}
          >
            {loading ? "Loading…" : "Next"}
          </button>
          <p className="mock-data-disclaimer">
            <span className="mock-data-disclaimer-attention">Attention:</span> This demo uses test data only. Addresses and results are not from real databases.
          </p>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

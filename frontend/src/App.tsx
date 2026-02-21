import { useState, useCallback, useEffect } from "react";
import { api, type BuildingSearchResult, type CalculatorMeasure } from "./lib/api";
import "./App.css";

/** Figma design: https://www.figma.com/design/TT6j8piAz9amjVWhXdzBVK/Untitled--Copy-?node-id=0-1 */

function App() {
  const [step, setStep] = useState(1);
  const [postalCode, setPostalCode] = useState("");
  const [streets, setStreets] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [buildings, setBuildings] = useState<BuildingSearchResult[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingSearchResult | null>(null);
  const [city, setCity] = useState("Berlin");
  const [buildingDetails, setBuildingDetails] = useState<Record<string, unknown> | null>(null);
  const [calculator, setCalculator] = useState<{ building: Record<string, unknown>; measures: CalculatorMeasure[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const loadStreets = useCallback(async () => {
    if (!postalCode.trim()) return;
    setError("");
    setLoading(true);
    try {
      const list = await api.getStreets(postalCode.trim());
      setStreets(list);
      setStreet("");
      setBuildings([]);
      setSelectedBuilding(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load streets");
    } finally {
      setLoading(false);
    }
  }, [postalCode]);

  const loadBuildings = useCallback(async () => {
    if (!postalCode.trim() || !street.trim()) return;
    setError("");
    setLoading(true);
    try {
      const list = await api.getBuildings(postalCode.trim(), street.trim());
      setBuildings(list);
      if (list.length === 1) setSelectedBuilding(list[0]);
      else setSelectedBuilding(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }, [postalCode, street]);

  useEffect(() => {
    if (postalCode.trim() && street.trim()) {
      loadBuildings();
    } else {
      setBuildings([]);
      setSelectedBuilding(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadBuildings stable for postalCode+street
  }, [street, postalCode]);

  const onNextFromStep1 = () => {
    if (selectedBuilding) {
      setCity((selectedBuilding.display_address || "").split(" ").slice(0, -2).join(" ") || "");
      setStep(2);
      loadBuildingAndCalculator();
    } else setError("Please select a building (street and number).");
  };

  const loadBuildingAndCalculator = useCallback(async () => {
    if (!selectedBuilding?.address_slug) return;
    setError("");
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        api.getBuilding(selectedBuilding.address_slug),
        api.getCalculator(selectedBuilding.address_slug),
      ]);
      setBuildingDetails(b);
      setCalculator(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedBuilding?.address_slug]);

  const goToStep = (s: number) => {
    setError("");
    if (s === 2 && selectedBuilding && !calculator) loadBuildingAndCalculator();
    setStep(s);
  };

  const handleRegister = async () => {
    if (!selectedBuilding || !userName.trim() || !userEmail.trim()) {
      setError("Name and email required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await api.createUser({
        name: userName.trim(),
        email: userEmail.trim(),
        building_id: selectedBuilding.building_id,
      });
      setUserId((user as { id?: string }).id || null);
      await api.createRequest({
        user_id: (user as { id?: string }).id!,
        building_id: selectedBuilding.building_id,
        status: "pending",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const diyMeasures = calculator?.measures.filter((m) => !m.requires_whole_building_landlord) ?? [];
  const wholeBuildingMeasures = calculator?.measures.filter((m) => m.requires_whole_building_landlord) ?? [];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">ViabCheck</div>
        <p className="app-tagline">
          Figure out how to finance insulating your building without losing money.
        </p>
        <button type="button" className="app-menu" aria-label="Menu">
          ☰
        </button>
      </header>

      <div className="stepper">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              className={`stepper-step ${step === s ? "active" : "inactive"}`}
              onClick={() => goToStep(s)}
              aria-current={step === s ? "step" : undefined}
            >
              {s}
            </button>
            {s < 4 && <span className="stepper-line" />}
          </div>
        ))}
      </div>

      <main className="step-content">
        {step === 1 && (
          <>
            <p>To understand your situation, we need some data from you.</p>
            <p>First, let us know where do you live.</p>
            <div className="form-group">
              <label>Postcode</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                onBlur={loadStreets}
                placeholder="e.g. 10317"
              />
            </div>
            <div className="form-group">
              <label>Street</label>
              <select
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  setBuildings([]);
                  setSelectedBuilding(null);
                }}
                onFocus={postalCode ? loadStreets : undefined}
              >
                <option value="">Select street</option>
                {streets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {street && (
              <>
                <div className="form-group">
                  <label>Number</label>
                  <select
                    value={selectedBuilding?.building_id ?? ""}
                    onChange={(e) => {
                      const b = buildings.find((x) => x.building_id === e.target.value);
                      setSelectedBuilding(b ?? null);
                    }}
                    onFocus={() => postalCode && street && loadBuildings()}
                  >
                    <option value="">Select number</option>
                    {buildings.length === 0 && street && (
                      <option value="" disabled>Loading…</option>
                    )}
                    {buildings.map((b) => (
                      <option key={b.building_id} value={b.building_id}>
                        {b.display_address?.split(" ").pop() ?? b.building_id}
                      </option>
                    ))}
                  </select>
                </div>
                {buildings.length === 0 && street && !loading && (
                  <button type="button" className="btn" onClick={loadBuildings}>
                    Load addresses
                  </button>
                )}
              </>
            )}
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Berlin"
              />
            </div>
            <button
              type="button"
              className="btn"
              onClick={onNextFromStep1}
              disabled={!selectedBuilding || loading}
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Viability calculator</h2>
            <p>Define retrofits needed</p>
            <div className="form-group">
              <label>Address</label>
              <p>{selectedBuilding?.display_address ?? ""}, {postalCode} {city || ""}</p>
            </div>
            {buildingDetails && (
              <div className="form-group">
                <label>Building details</label>
                <p>Construction year: {String(buildingDetails.construction_year ?? "-")}</p>
                <p>Type: {String(buildingDetails.building_type ?? "-")}</p>
                <p>Units: {String(buildingDetails.num_units ?? "-")}</p>
                <p>Floors: {String(buildingDetails.num_floors ?? "-")}</p>
                <p>Total area: {buildingDetails.total_area_m2 != null ? `${Number(buildingDetails.total_area_m2)} m²` : "-"}</p>
                <p>Heating: {String(buildingDetails.heating_system ?? "-")}{buildingDetails.heating_age != null && buildingDetails.heating_age !== "" ? ` (${buildingDetails.heating_age} yr)` : ""}</p>
                <p>Windows: {String(buildingDetails.window_type ?? "-")}</p>
                <p>Roof: {String(buildingDetails.roof_type ?? "-")}</p>
                <p>Roof insulation: {String(buildingDetails.insulation_roof ?? "-")}</p>
                <p>Wall insulation: {String(buildingDetails.insulation_walls ?? "-")}</p>
                <p>Basement insulation: {String(buildingDetails.insulation_basement ?? "-")}</p>
                <p>Facade: {String(buildingDetails.facade_material ?? "-")}</p>
                <p>EPC: {String(buildingDetails.epc_rating ?? "-")}</p>
                <p>Energy: {buildingDetails.energy_consumption_kwh_m2 != null ? `${Number(buildingDetails.energy_consumption_kwh_m2)} kWh/m²` : "-"}</p>
                {buildingDetails.last_renovation_year != null && buildingDetails.last_renovation_year !== "" && (
                  <p>Last renovation: {String(buildingDetails.last_renovation_year)}</p>
                )}
                {(buildingDetails.listed_building === true || buildingDetails.listed_building === "True") && (
                  <p>Listed building</p>
                )}
              </div>
            )}
            <div className="form-group">
              <label>Apartment details / Kaltmiete</label>
              <p>Edit in profile after registration if needed.</p>
            </div>
            <button type="button" className="btn" onClick={() => setStep(3)}>
              Next
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Retrofit suggestion</h2>
            <p>Retrofit calculator</p>
            {loading && <p>Loading…</p>}
            {calculator && (
              <>
                {diyMeasures.length > 0 && (
                  <section>
                    <h3>DIY / apartment measures</h3>
                    <ul className="measures-list">
                      {diyMeasures.map((m) => (
                        <li key={m.measure_id} className="measure-card">
                          <h4>{m.measure_name}</h4>
                          <div className="meta">
                            Cost: {m.estimated_cost} € · Savings: {m.estimated_savings_pct}% ·{" "}
                            {m.estimated_savings_eur_per_year} €/year · Subsidy: {m.subsidy_eur} €
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {wholeBuildingMeasures.length > 0 && (
                  <section>
                    <h3>Whole building (landlord involvement)</h3>
                    <ul className="measures-list">
                      {wholeBuildingMeasures.map((m) => (
                        <li key={m.measure_id} className="measure-card whole-building">
                          <h4>{m.measure_name}</h4>
                          <div className="meta">
                            Cost: {m.estimated_cost} € · Savings: {m.estimated_savings_pct}% ·{" "}
                            This work should be done for the whole building with landlord involvement.
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <div className="we-get">
                  <strong>We get:</strong> Construction year:{" "}
                  {String(calculator.building?.construction_year ?? "-")} · Yearly heat demand:{" "}
                  {String(calculator.building?.energy_consumption_kwh_m2 ?? "-")} kWh/m²
                </div>
              </>
            )}
            <button type="button" className="btn" onClick={() => setStep(4)} style={{ marginTop: "1rem" }}>
              Next
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Register & submit request</h2>
            {userId ? (
              <p>Thank you. Your request has been submitted.</p>
            ) : (
              <>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <p>Building: {selectedBuilding?.display_address ?? ""}</p>
                <button
                  type="button"
                  className="btn"
                  onClick={handleRegister}
                  disabled={loading || !userName.trim() || !userEmail.trim()}
                >
                  {loading ? "Submitting…" : "Submit request"}
                </button>
              </>
            )}
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </main>
    </div>
  );
}

export default App;

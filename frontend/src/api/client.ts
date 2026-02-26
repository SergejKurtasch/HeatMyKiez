/**
 * API client for HeatMyKiez backend. All field names match Excel/plan.
 */
const BASE = import.meta.env.VITE_API_URL || "";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  health: () => get<{ status: string }>("/health"),
  getStreets: (postcode: string) => get<{ postcode: string; streets: string[] }>(`/addresses/streets?postcode=${encodeURIComponent(postcode)}`),
  getNumbers: (postcode: string, street: string) =>
    get<{ postcode: string; street: string; numbers: string[] }>(`/addresses/numbers?postcode=${encodeURIComponent(postcode)}&street=${encodeURIComponent(street)}`),
  searchBuilding: (postcode: string, address: string) =>
    get<Building>(`/buildings/search?postcode=${encodeURIComponent(postcode)}&address=${encodeURIComponent(address)}`),
  getBuilding: (buildingId: string) => get<Building>(`/buildings/${encodeURIComponent(buildingId)}`),
  runCalculator: (body: { building_id: string; sub_type_of_retrofit: string; overrides?: Record<string, unknown> }) =>
    post<CalculatorResult>("/calculator", body),
  getContractors: (specialization = "window") =>
    get<{ contractors: Contractor[] }>(`/contractors?specialization=${encodeURIComponent(specialization)}`),
};

export interface Building {
  building_id?: string;
  district?: string;
  postal_code?: string;
  address?: string;
  street?: string;
  number?: string;
  city?: string;
  total_area_m2?: number;
  num_units?: number;
  window_type?: string;
  roof_type?: string;
  heating_system?: string;
  facade_material?: string;
  insulation_walls?: string;
  insulation_roof?: string;
  insulation_basement?: string;
  heating_age?: number;
  num_floors?: number;
  building_type?: string;
  RentPerUnit?: number;
  EnergyCostsPerMonth?: number;
  facade_sqm_suggestion?: number;
  [key: string]: unknown;
}

export interface CalculatorResult {
  TotalSqm: number;
  NrUnits: number;
  WindowType: string;
  EnergyCostsPerMonth: number;
  RentPerUnit: number;
  SubTypeOfRetrofit: string;
  RetrofitCostTotal: number;
  RetrofitCostTotalAfterSubsidy: number;
  EnergySavingsPerMonth: number;
  YearUntilBreakeven: number;
  SavingsPerUnit: number;
  RentIncreasePerUnit: number;
  TenantSavingsPerUnit: number;
  YearlyExtraIncome: number;
  YearsUntilBreakeventRentIncrease: number;
  EnergySavingsPct: number;
  years_until_break_even?: number;
  months_until_break_even?: number;
}

export interface Contractor {
  contractor_id?: string;
  company_name?: string;
  specialization?: string;
  district_served?: string;
  avg_rating?: number;
  num_reviews?: number;
  [key: string]: unknown;
}

import {
  User,
  Asset,
  Liability,
  DashboardResponse,
  CurrencyItem,
  FireScenario,
  FireScenarioSummary,
  FireCalculateRequest,
} from "@/types";

const API_BASE_URL =
  process.env.PIGGYBANK_API_URL || "http://localhost:8000/api/v1";

interface TokenAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string | null) => void)[] = [];

  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("piggybank_access_token");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("piggybank_refresh_token");
  }

  private getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private onTokenRefreshed(newToken: string | null) {
    this.refreshSubscribers.forEach((cb) => cb(newToken));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string | null) => void) {
    this.refreshSubscribers.push(cb);
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const data: TokenAuthResponse = await res.json();
      this.saveSession(data.access_token, data.refresh_token, data.user);
      return data.access_token;
    } catch {
      this.clearSession();
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeader(),
      ...(options.headers || {}),
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized with token refresh if possible
    if (res.status === 401 && !endpoint.includes("/auth/")) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);

          if (newToken) {
            // Retry original request with new token
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers: retryHeaders,
            });
            if (retryRes.ok) {
              if (retryRes.status === 204) return null as unknown as T;
              return retryRes.json();
            }
          }
        } else {
          // Wait for concurrent refresh to complete
          return new Promise<T>((resolve, reject) => {
            this.addRefreshSubscriber(async (newToken) => {
              if (!newToken) {
                reject(new Error("Session expired. Please log in again."));
                return;
              }
              try {
                const retryHeaders = {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                };
                const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
                  ...options,
                  headers: retryHeaders,
                });
                if (retryRes.ok) {
                  if (retryRes.status === 204) resolve(null as unknown as T);
                  else resolve(await retryRes.json());
                } else {
                  reject(new Error("Request failed after token refresh"));
                }
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      }

      this.clearSession();
      throw new Error("Session expired or unauthorized");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "API request failed");
    }

    if (res.status === 204) {
      return null as unknown as T;
    }

    return res.json();
  }

  private clearSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("piggybank_access_token");
      localStorage.removeItem("piggybank_refresh_token");
      localStorage.removeItem("piggybank_user");
      // Clean legacy keys
      localStorage.removeItem("networth_token");
      localStorage.removeItem("networth_user");
      window.dispatchEvent(new Event("auth_logout"));
    }
  }

  // --- Auth Endpoints ---
  async loginWithGoogle(credential: string): Promise<TokenAuthResponse> {
    const data = await this.request<TokenAuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    this.saveSession(data.access_token, data.refresh_token, data.user);
    return data;
  }

  async devLogin(email = "john.doe@example.com", name = "John Doe"): Promise<TokenAuthResponse> {
    const data = await this.request<TokenAuthResponse>("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
    this.saveSession(data.access_token, data.refresh_token, data.user);
    return data;
  }

  saveSession(accessToken: string, refreshToken: string, user: User) {
    if (typeof window !== "undefined") {
      localStorage.setItem("piggybank_access_token", accessToken);
      localStorage.setItem("piggybank_refresh_token", refreshToken);
      localStorage.setItem("piggybank_user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth_login"));
    }
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  }

  getSavedUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const userStr = localStorage.getItem("piggybank_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("piggybank_access_token");
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async updateUserPreferences(baseCurrency: string): Promise<User> {
    const updated = await this.request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ base_currency: baseCurrency }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("piggybank_user", JSON.stringify(updated));
    }
    return updated;
  }

  // --- Dashboard ---
  async getDashboard(currency?: string): Promise<DashboardResponse> {
    const query = currency ? `?currency=${currency}` : "";
    return this.request<DashboardResponse>(`/dashboard/summary${query}`);
  }

  // --- Assets ---
  async getAssets(category?: string, subCategory?: string): Promise<Asset[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (subCategory) params.append("sub_category", subCategory);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Asset[]>(`/assets${query}`);
  }

  async createAsset(asset: Partial<Asset>): Promise<Asset> {
    return this.request<Asset>("/assets", {
      method: "POST",
      body: JSON.stringify(asset),
    });
  }

  async updateAsset(id: string, asset: Partial<Asset>): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(asset),
    });
  }

  async deleteAsset(id: string): Promise<void> {
    return this.request<void>(`/assets/${id}`, {
      method: "DELETE",
    });
  }

  // --- Liabilities ---
  async getLiabilities(category?: string): Promise<Liability[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return this.request<Liability[]>(`/liabilities${query}`);
  }

  async createLiability(liability: Partial<Liability>): Promise<Liability> {
    return this.request<Liability>("/liabilities", {
      method: "POST",
      body: JSON.stringify(liability),
    });
  }

  async updateLiability(id: string, liability: Partial<Liability>): Promise<Liability> {
    return this.request<Liability>(`/liabilities/${id}`, {
      method: "PUT",
      body: JSON.stringify(liability),
    });
  }

  async deleteLiability(id: string): Promise<void> {
    return this.request<void>(`/liabilities/${id}`, {
      method: "DELETE",
    });
  }

  // --- Currencies ---
  async getSupportedCurrencies(): Promise<CurrencyItem[]> {
    return this.request<CurrencyItem[]>("/currencies/supported");
  }

  async getExchangeRates(base = "INR"): Promise<{ base: string; rates: Record<string, number> }> {
    return this.request<{ base: string; rates: Record<string, number> }>(
      `/currencies/rates?base=${encodeURIComponent(base.toUpperCase())}`
    );
  }

  // --- Users ---
  async updateUserProfile(data: Partial<User>): Promise<User> {
    return this.request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // --- FIRE Endpoints ---
  async getFireScenarios(): Promise<FireScenarioSummary[]> {
    return this.request<FireScenarioSummary[]>("/fire/scenarios");
  }

  async getFireScenario(id: string): Promise<FireScenario> {
    return this.request<FireScenario>(`/fire/scenarios/${id}`);
  }

  async createFireScenario(data: Partial<FireScenario>): Promise<FireScenario> {
    return this.request<FireScenario>("/fire/scenarios", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateFireScenario(id: string, data: Partial<FireScenario>): Promise<FireScenario> {
    return this.request<FireScenario>(`/fire/scenarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteFireScenario(id: string): Promise<void> {
    return this.request<void>(`/fire/scenarios/${id}`, {
      method: "DELETE",
    });
  }

  async setDefaultFireScenario(id: string): Promise<FireScenario> {
    return this.request<FireScenario>(`/fire/scenarios/${id}/set-default`, {
      method: "POST",
    });
  }

  async compareFireScenarios(scenarioIds: string[]): Promise<{ scenarios: FireScenario[] }> {
    return this.request<{ scenarios: FireScenario[] }>("/fire/scenarios/compare", {
      method: "POST",
      body: JSON.stringify({ scenario_ids: scenarioIds }),
    });
  }

  async calculateFire(data: FireCalculateRequest): Promise<FireScenario> {
    return this.request<FireScenario>("/fire/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

// JANGRUEANG TU – admin frontend configuration & API client.
// Update API_URL with the deployed API Gateway invoke URL (no trailing slash).
window.APP_CONFIG = {
    API_URL: "https://ulrx8z669l.execute-api.us-east-1.amazonaws.com/prod/submit"
};

// Departments shown on the forward page. These are organisational units (config),
// not mock case data – cases pulled from DynamoDB are still the source of truth.
window.DEPARTMENT_OPTIONS = [
    "กองบริการการศึกษา",
    "ฝ่ายบุคคล",
    "กองกลาง (งานพัสดุและโสตฯ)",
    "กองอาคารสถานที่",
    "ศูนย์บริหารจัดการทรัพย์สิน",
    "สำนักงานนวัตกรรมดิจิทัล (IT)",
    "กองจัดการความปลอดภัย (รปภ.)",
    "หน่วยงานขนส่ง (EV Shuttle)",
    "อื่นๆ"
];

(function () {
    const cache = { items: null, promise: null };

    // ---- Cognito Hosted UI token capture --------------------------------
    // After the Hosted UI redirects back, the URL contains the tokens in the
    // fragment (implicit flow): #id_token=...&access_token=...&...
    // We pull them out, store them in sessionStorage, and scrub the URL so the
    // tokens don't linger in browser history.
    (function captureHostedUITokens() {
        if (!window.location.hash || window.location.hash.length < 2) return;
        const params = new URLSearchParams(window.location.hash.slice(1));
        const idToken = params.get("id_token");
        const accessToken = params.get("access_token");
        const expiresIn = parseInt(params.get("expires_in") || "0", 10);
        if (!idToken && !accessToken) return;
        if (idToken) sessionStorage.setItem("idToken", idToken);
        if (accessToken) sessionStorage.setItem("accessToken", accessToken);
        if (expiresIn) sessionStorage.setItem("tokenExpiresAt", String(Date.now() + expiresIn * 1000));
        console.log("[AppAPI] Stored Cognito Hosted UI tokens.");
        history.replaceState(null, "", window.location.pathname + window.location.search);
    })();

    function authHeaders() {
        const token = sessionStorage.getItem("id_token")
            || sessionStorage.getItem("idToken")
            || sessionStorage.getItem("accessToken")
            || localStorage.getItem("id_token")
            || localStorage.getItem("idToken")
            || "";
        if (!token) {
            console.warn("[AppAPI] No Cognito token found in sessionStorage. Admin requests will be unauthenticated.");
        }
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    window.AdminAuth = {
        getToken: () => sessionStorage.getItem("idToken") || "",
        clearToken: () => {
            sessionStorage.removeItem("idToken");
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("tokenExpiresAt");
        },
        isExpired: () => {
            const exp = parseInt(sessionStorage.getItem("tokenExpiresAt") || "0", 10);
            return exp > 0 && Date.now() > exp;
        }
    };

    async function loadCases({ refresh = false } = {}) {
        if (!refresh && cache.items) return cache.items;
        if (cache.promise) return cache.promise;
        const url = window.APP_CONFIG && window.APP_CONFIG.API_URL;
        if (!url || url.includes("YOUR-API-ID")) {
            console.warn("[AppAPI] APP_CONFIG.API_URL is not configured.");
            cache.items = [];
            return cache.items;
        }
        cache.promise = (async () => {
            console.log("[AppAPI] GET", url);
            let response;
            try {
                response = await fetch(url, { method: "GET", headers: { ...authHeaders() } });
            } catch (err) {
                console.error("[AppAPI] Network/CORS failure on GET:", err);
                throw new Error("ติดต่อเซิร์ฟเวอร์ไม่ได้ (ตรวจสอบ CORS / Invoke URL)");
            }
            const text = await response.text();
            console.log("[AppAPI] GET status=", response.status, "body=", text.slice(0, 200));
            if (!response.ok) throw new Error(`API ${response.status}: ${text}`);
            let body;
            try { body = text ? JSON.parse(text) : []; } catch (e) { throw new Error("Invalid JSON from API: " + text); }
            const items = Array.isArray(body) ? body : (body.items || []);
            cache.items = items;
            cache.promise = null;
            return items;
        })().catch(err => { cache.promise = null; throw err; });
        return cache.promise;
    }

    async function updateCase(payload) {
        const url = window.APP_CONFIG && window.APP_CONFIG.API_URL;
        if (!url) throw new Error("APP_CONFIG.API_URL is not configured");
        console.log("[AppAPI] PUT", url, payload);
        let response;
        try {
            response = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("[AppAPI] Network/CORS failure on PUT:", err);
            throw new Error("ติดต่อเซิร์ฟเวอร์ไม่ได้ (ตรวจสอบ CORS / Invoke URL)");
        }
        const text = await response.text();
        console.log("[AppAPI] PUT status=", response.status, "body=", text.slice(0, 200));
        if (!response.ok) throw new Error(`API ${response.status}: ${text}`);
        const result = text ? JSON.parse(text) : {};
        if (cache.items) {
            const idx = cache.items.findIndex(it => it.complaint_id === payload.complaint_id);
            if (idx >= 0) cache.items[idx] = { ...cache.items[idx], ...payload };
        }
        return result;
    }

    // The DynamoDB partition key is `complaint_id` for every record; the `type`
    // field distinguishes complaints from incidents. Fall back to the ID prefix
    // (EMG- = incident, GU- = complaint) for legacy rows that pre-date `type`.
    function isComplaint(item) {
        const t = (item.type || "").toLowerCase();
        if (t === "complaint") return true;
        if (t === "incident") return false;
        return !String(item.complaint_id || "").toUpperCase().startsWith("EMG-");
    }
    function isIncident(item) {
        const t = (item.type || "").toLowerCase();
        if (t === "incident") return true;
        if (t === "complaint") return false;
        return String(item.complaint_id || "").toUpperCase().startsWith("EMG-");
    }

    window.AppAPI = {
        loadCases,
        updateCase,
        isComplaint,
        isIncident,
        getCases: () => cache.items || [],
        invalidate: () => { cache.items = null; cache.promise = null; }
    };
})();

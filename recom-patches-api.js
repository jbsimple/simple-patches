// api fetch
async function fetchAPI(route, { params = {}, body = null } = {}, options = {}) {

    if (!["meta", "reports"].includes(route)) {
        throw new Error("Invalid route");
    }

    let url = `https://simple-patches.vercel.app/api/fetch?route=${route}`;

    if (route === "meta" && params && Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        url += `&${query}`;
    }

    const fetchOptions = {
        method: route === "meta" ? "GET" : "POST",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (route === "reports") {
        if (!body || !body.type) {
            throw new Error("Missing report body or type");
        }

        body.filters = Array.isArray(body.filters) ? body.filters : [];

        fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
        const text = await res.text();
        console.error("API Error:", res.status, text);
        throw new Error(`API Error ${res.status}`);
    }

    const data = await res.json();

    console.log("API Response:", data);

    return data;
}

async function meta() { return await fetchAPI("meta"); }

async function api_test() {
    const metaRes = await meta();
    const reports = metaRes.data?.data || {};

    const results = {};

    const promises = Object.entries(reports).map(async ([key, report]) => {

        try {
            const filters = (report.required_filters || []).map(field => {

                if (field.includes("date") || field.includes("created") || field.includes("updated")) {
                    return {
                        field,
                        operator: "between",
                        value: ["2026-03-21", "2026-03-23"]
                    };
                }

                if (field.includes("status")) {
                    return {
                        field,
                        operator: "not_null"
                    };
                }

                if (field.includes("in_stock")) {
                    return {
                        field,
                        operator: "gte",
                        value: 0
                    };
                }

                if (field.includes("id")) {
                    return {
                        field,
                        operator: "not_null"
                    };
                }

                return {
                    field,
                    operator: "not_null"
                };
            });

            const columns = (report.columns || [])
                .slice(0, 5)
                .map(c => c.id);

            const res = await fetchAPI("reports", {
                body: {
                    type: key,
                    limit: 10,
                    filters,
                    columns
                }
            });

            console.log(`PATCHES - Success with ${key}`, res);

            results[key] = {
                success: true,
                count: res?.data?.meta?.count ?? 0
            };

        } catch (err) {

            console.error(`PATCHES - API test Failed for ${key}`, err.message);

            results[key] = {
                success: false,
                error: err.message
            };
        }

    });

    await Promise.all(promises);

    console.log("FINAL RESULTS:", results);

    return results;
}
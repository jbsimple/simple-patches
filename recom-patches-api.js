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

async function api_test(type = null) {
    const metaRes = await fetchAPI("meta");
    const reports = metaRes.data?.data || {};

    let entries = Object.entries(reports);

    if (type) {
        if (Array.isArray(type)) {
            entries = entries.filter(([key]) => type.includes(key));
        } else {
            entries = entries.filter(([key]) => key === type);
        }
    }

    if (entries.length === 0) {
        console.warn("PATCHES - No matching report types");
        return {};
    }

    const results = {};

    const DELAY = 800;
    const MAX_RETRIES = 5;
    const COLUMN_CHUNK = 10;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function buildFilter(field) {
        if (field.includes("date") || field.includes("created") || field.includes("updated")) {
            return {
                field,
                operator: "between",
                value: ["2026-03-21", "2026-03-23"]
            };
        }

        if (field.includes("status")) {
            return { field, operator: "not_null" };
        }

        if (field.includes("in_stock")) {
            return { field, operator: "gte", value: 0 };
        }

        if (field.includes("id")) {
            return { field, operator: "not_null" };
        }

        return { field, operator: "not_null" };
    }

    async function fetchWithRetry(body, attempt = 1) {
        try {
            return await fetchAPI("reports", { body });
        } catch (err) {
            const isRetryable =
                err.message.includes("429") ||
                err.message.includes("500") ||
                err.message.includes("fetch");

            if (isRetryable && attempt < MAX_RETRIES) {
                const wait = 500 * attempt;
                console.warn(`PATCHES - Retry ${attempt} (${wait}ms)`);
                await sleep(wait);
                return fetchWithRetry(body, attempt + 1);
            }

            throw err;
        }
    }

    for (const [key, report] of entries) {

        results[key] = {
            base: null,
            filters: {},
            columns: {}
        };

        const requiredFilters = (report.required_filters || []).map(buildFilter);
        const allColumns = (report.columns || []).map(c => c.id);

        try {
            await fetchWithRetry({
                type: key,
                limit: 10,
                filters: requiredFilters,
                columns: allColumns.slice(0, 5)
            });

            console.log(`PATCHES - Success base ${key}`);
            results[key].base = true;

        } catch (err) {
            console.error(`PATCHES - Fail base ${key}`, err.message);
            results[key].base = false;
        }

        await sleep(DELAY);

        const filterFields = report.required_filters || [];

        for (const field of filterFields) {
            try {
                await fetchWithRetry({
                    type: key,
                    limit: 10,
                    filters: [buildFilter(field)],
                    columns: allColumns.slice(0, 5)
                });

                console.log(`PATCHES - Success filter ${key} ${field}`);
                results[key].filters[field] = true;

            } catch (err) {
                console.error(`PATCHES - Fail filter ${key} ${field}`, err.message);
                results[key].filters[field] = false;
            }

            await sleep(DELAY);
        }

        for (let i = 0; i < allColumns.length; i += COLUMN_CHUNK) {
            const chunk = allColumns.slice(i, i + COLUMN_CHUNK);

            try {
                await fetchWithRetry({
                    type: key,
                    limit: 10,
                    filters: requiredFilters,
                    columns: chunk
                });

                console.log(`PATCHES - Success columns ${key} [${i}-${i + chunk.length}]`);
                results[key].columns[`${i}-${i + chunk.length}`] = true;

            } catch (err) {
                console.error(`PATCHES - Fail columns ${key} [${i}-${i + chunk.length}]`, err.message);
                results[key].columns[`${i}-${i + chunk.length}`] = false;
            }

            await sleep(DELAY);
        }
    }

    console.log("PATCHES - FINAL RESULTS", results);

    return results;
}
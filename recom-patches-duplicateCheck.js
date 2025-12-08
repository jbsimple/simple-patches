async function duplicateMPN(mpn_input) {
    if (!mpn_input) return false;
    console.debug('PATCHES - MPN Duplicate Check Attached:', mpn_input);

    let timeout = null;
    mpn_input.addEventListener('input', () => {
        mpn_input.style.outline = "";
        mpn_input.style.backgroundColor = "";

        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const value = mpn_input.value.trim();
            try {
                const mpn_check = await fetchExistingMPN(value);

                let products = [];
                if (Array.isArray(mpn_check)) {
                    products = products.concat(mpn_check);
                }
                console.debug(`PATCHES - MPN Check, Value: ${value}, Results:`, products);
                if (products.length > 0) {
                    mpn_input.style.outline = "2px solid var(--bs-danger)";
                    mpn_input.style.backgroundColor = "color-mix(in srgb, var(--bs-danger) 15%, rgb(255,255,255,0))";
                    let productListHTML = "<p>" +
                        products
                            .map(product =>
                                `<a class="text-info fw-bold fs-7" href="/products/${product.SID}" target="_blank">${product.SID}</a>`
                            )
                            .join("<br>") +
                        "</p>";
                    fireSwal('MPN CHECK?', ["Duplicate MPN Alert!", "This MPN appears on the products below:", productListHTML]);
                }
            } catch (err) {
                console.error("Error fetching MPN data:", err);
            }
        }, 1500);
    });

    async function fetchExistingMPN(mpn) {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            let request = {
                report: {
                    type: "catalog_report",
                    columns: [
                        "products.sid",
                        "products.name",
                        "products.mpn",
                        "products.created_at"
                    ],
                    filters: [
                        {
                            column: "products.mpn",
                            opr: "{0} LIKE '%{1}%'",
                            value: `${mpn}`
                        }
                    ]
                },
                csrf_recom: csrfToken
            };

            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/reports/create",
                    data: request
                })
                .done(function(data) {
                    if (data.success === true && Array.isArray(data.results?.results)) {
                        resolve(data.results.results);
                    } else {
                        console.warn("Unexpected response format or no results", data);
                        resolve(null);
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.error("AJAX request failed:", textStatus, errorThrown);
                    reject(new Error("AJAX request failed: " + textStatus + ", " + errorThrown));
                });
            });
        } else {
            console.error('Unable to get CSRF');
            return null;
        }
    }
}

async function duplicateAsin(asin_field) {
    if (!asin_field) return false;
    console.debug('PATCHES - MPN Duplicate Check Attached:', asin_field);

    let timeout = null;
    asin_field.addEventListener('input', () => {
        asin_field.style.outline = "";
        asin_field.style.backgroundColor = "";

        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const value = asin_field.value.trim();
            if (value.length === 10) {
                try {
                    const main_asin = await fetchExistingAsins(value);
                    const renewed_asin = await fetchExistingRenewedAsins(value);

                    let products = [];
                    if (Array.isArray(main_asin)) {
                        products = products.concat(main_asin);
                    }
                    if (Array.isArray(renewed_asin)) {
                        products = products.concat(renewed_asin);
                    }
                    console.debug(`PATCHES - Asin Check, Value: ${value}, Results:`, products);
                    if (products.length > 0) {
                        asin_field.style.outline = "2px solid var(--bs-danger)";
                        asin_field.style.backgroundColor = "color-mix(in srgb, var(--bs-danger) 15%, rgb(255,255,255,0))";
                        let productListHTML = "<p>" +
                            products
                                .map(product =>
                                    `<a class="text-info fw-bold fs-7" href="/products/${product.SID}" target="_blank">${product.SID}</a>`
                                )
                                .join("<br>") +
                            "</p>";
                        fireSwal('ASIN CHECK?', ["Duplicate ASIN Alert!", "This ASIN appears on the products below:", productListHTML]);
                    }
                } catch (err) {
                    console.error("Error fetching ASIN data:", err);
                }
            }
        }, 1500);
    });

    async function fetchExistingAsins(asin) {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            let request = {
                report: {
                    type: "catalog_report",
                    columns: [
                        "products.sid",
                        "products.name",
                        "products.asin",
                        "products.created_at"
                    ],
                    filters: [
                        {
                            column: "products.asin",
                            opr: "{0} LIKE '%{1}%'",
                            value: `${asin}`
                        }
                    ]
                },
                csrf_recom: csrfToken
            };

            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/reports/create",
                    data: request
                })
                .done(function(data) {
                    if (data.success === true && Array.isArray(data.results?.results)) {
                        resolve(data.results.results);
                    } else {
                        console.warn("Unexpected response format or no results", data);
                        resolve(null);
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.error("AJAX request failed:", textStatus, errorThrown);
                    reject(new Error("AJAX request failed: " + textStatus + ", " + errorThrown));
                });
            });
        } else {
            console.error('Unable to get CSRF');
            return null;
        }
    }

    async function fetchExistingRenewedAsins(asin) {
        const csrfMeta = document.querySelector('meta[name="X-CSRF-TOKEN"]');
        if (csrfMeta && csrfMeta.getAttribute('content').length > 0) {
            const csrfToken = csrfMeta.getAttribute('content');
            let request = {
                report: {
                    type: "catalog_report",
                    columns: [
                        "products.sid",
                        "products.name",
                        "products.asin",
                        "products.created_at"
                    ],
                    filters: [
                        {
                            column: "metafield|products.id|1",
                            opr: "{0} LIKE '%{1}%'",
                            value: `${asin}`
                        }
                    ]
                },
                csrf_recom: csrfToken
            };

            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: "/reports/create",
                    data: request
                })
                .done(function(data) {
                    if (data.success === true && Array.isArray(data.results?.results)) {
                        const modifiedResults = data.results.results.map(row => {
                            return {
                                ...row,
                                "ASIN_Renewed": asin
                            };
                        });
                        resolve(modifiedResults);
                    } else {
                        console.warn("Unexpected response format or no results", data);
                        resolve(null);
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    console.error("AJAX request failed:", textStatus, errorThrown);
                    reject(new Error("AJAX request failed: " + textStatus + ", " + errorThrown));
                });
            });
        } else {
            console.error('Unable to get CSRF');
            return null;
        }
    }
}
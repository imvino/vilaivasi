// Define the API endpoint URL for Algolia search
const algoliaUrl = "https://3yp0hp3wsh-dsn.algolia.net/1/indexes/*/queries";

// Set up the request headers
const headers = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded",
    "sec-ch-ua": "\"Brave\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "sec-gpc": "1",
    "x-algolia-api-key": "aace3f18430a49e185d2c1111602e4b1",
    "x-algolia-application-id": "3YP0HP3WSH",
    "Referer": "https://www.jiomart.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

// Human-readable parameters
const paramsObject = {
    "analyticsTags": ["Category PLP"],
    "attributesToHighlight": [],
    "attributesToRetrieve": [
        "*",
        "-algolia_facet",
        "-alt_class_keywords",
        "-available_stores",
        "-avg_discount",
        "-avg_discount_pct",
        "-avg_discount_rate",
        "-avg_mrp",
        "-avg_selling_price",
        "-search_keywords"
    ],
    "clickAnalytics": true,
    "distinct": false,
    "enableRules": true,
    "facets": [
        "algolia_facet.*",
        "avg_discount_pct",
        "avg_selling_price",
        "brand",
        "category_level.level4"
    ],
    "filters": "category_ids:36175 AND " +
        "(mart_availability:JIO OR mart_availability:JIO_WA) AND " +
        "(available_stores:2051 OR available_stores:PANINDIAGROCERIES) AND " +
        "((inventory_stores:ALL OR inventory_stores:U1IV OR " +
        "inventory_stores_3p:ALL OR " +
        "inventory_stores_3p:groceries_zone_non-essential_services OR " +
        "inventory_stores_3p:general_zone OR " +
        "inventory_stores_3p:groceries_zone_essential_services))",
    "highlightPostTag": "__/ais-highlight__",
    "highlightPreTag": "__ais-highlight__",
    "hitsPerPage": 12,
    "maxValuesPerFacet": 50,
    "page": 0,
    "query": "",
    "ruleContexts": ["PLP"],
    "tagFilters": ""
};

// Function to convert the parameter object to URL-encoded string
function encodeParams(params) {
    // Convert arrays to JSON strings and encode them
    for (const key in params) {
        if (Array.isArray(params[key])) {
            params[key] = JSON.stringify(params[key]);
        }
    }

    // Create a URLSearchParams object and return as string
    const searchParams = new URLSearchParams();
    for (const key in params) {
        searchParams.append(key, params[key]);
    }
    return searchParams.toString();
}

// Create the request body with encoded parameters
const requestBody = {
    "requests": [{
        "indexName": "prod_mart_master_vertical_products_popularity",
        "params": encodeParams(paramsObject)
    }]
};

// Function to make the API call
function fetchJiomartProducts() {
    const userAgent = "Algolia for JavaScript (4.5.1); Browser; instantsearch.js (4.59.0); JS Helper (3.15.0)";

    return fetch(`${algoliaUrl}?x-algolia-agent=${encodeURIComponent(userAgent)}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody)
    })
        .then(response => response.json())
        .then(data => {
            console.log("Products retrieved:", data);
            return data;
        })
        .catch(error => {
            console.error("Error fetching products:", error);
        });
}

// Call the function to execute the API request
fetchJiomartProducts();
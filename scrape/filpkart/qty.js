/**
 * Extracts and calculates the total quantity from a product title string.
 * Uses regex and keyword matching to find potential quantity numbers and multiplies them.
 *
 * @param {string} title The product title string.
 * @returns {number} The calculated total quantity, defaults to 1 if no quantity is found.
 */
function extractQuantity(title) {
    if (!title || typeof title !== 'string') {
        return 1; // Return 1 for invalid or empty titles
    }

    // Normalize the title for easier processing (lowercase, remove some noise)
    let processedTitle = title.toLowerCase();
    processedTitle = processedTitle.replace(/[-|,\/()]/g, ' '); // Replace common separators with space
    processedTitle = processedTitle.replace(/\s+/g, ' ').trim(); // Reduce multiple spaces

    // Keywords indicating a number is likely a quantity
    const quantityKeywords = [
        'unit', 'units', 'pack', 'packs', 'pkg', 'pkgs', 'ct', 'count', 'qty',
        'piece', 'pieces', 'box', 'boxes', 'case', 'cases', 'bundle', 'bundles',
        'roll', 'rolls', 'sheet', 'sheets', 'pair', 'pairs', 'set', 'sets',
        'diaper', 'diapers', 'wipe', 'wipes', // Specific to your example
        // Add more as needed based on your product types
    ];

    // Keywords indicating a number is NOT a quantity for multiplication
    // (e.g., size, weight, volume, duration, model numbers - be careful with these)
    const exclusionKeywords = [
        'kg', 'kgs', 'g', 'grams', 'lb', 'lbs', 'oz', 'ounces', // Weight
        'ml', 'l', 'liter', 'liters', 'gallon', 'gallons', // Volume
        'cm', 'inch', 'inches', 'ft', 'feet', 'm', 'meter', 'meters', // Length
        'mah', 'volt', 'v', 'watt', 'w', 'hz', // Electrical
        'hr', 'hrs', 'hour', 'hours', 'min', 'mins', 'minute', 'minutes', // Duration
        'size', 'large', 'medium', 'small', 'xl', 'xxl', // Size indicators
        'pack of', // Handle this pattern specifically if needed, or rely on 'pack' keyword
        // Add more exclusion keywords as you encounter them
    ];

    let quantitiesToMultiply = [];

    // --- Strategy 1: Look for "NUMBER x NUMBER" pattern (e.g., 24 x 3, 100X5) ---
    // This is common for packs within packs
    const xPattern = /(\d+)\s*[xX]\s*(\d+)/g;
    let xMatch;
    while ((xMatch = xPattern.exec(processedTitle)) !== null) {
        const num1 = parseInt(xMatch[1], 10);
        const num2 = parseInt(xMatch[2], 10);
        if (!isNaN(num1) && num1 > 0) quantitiesToMultiply.push(num1);
        if (!isNaN(num2) && num2 > 0) quantitiesToMultiply.push(num2);
    }
    // Note: This doesn't remove the matched part, could lead to double counting
    // if the numbers are also found by other patterns, but often "X" is unique.
    // A more robust version would process and remove/mark handled parts.

    // --- Strategy 2: Look for "NUMBER WORD" or "WORD NUMBER" patterns ---
    // Use a regex that finds a number near a word
    const numWordPattern = /(\d+)\s*([a-z]+)|([a-z]+)\s*(\d+)/g;
    let nwMatch;
    while ((nwMatch = numWordPattern.exec(processedTitle)) !== null) {
        let numStr, word;
        // Determine which group captured the number and word
        if (nwMatch[1] !== undefined) { // Pattern: NUMBER WORD
            numStr = nwMatch[1];
            word = nwMatch[2];
        } else if (nwMatch[3] !== undefined) { // Pattern: WORD NUMBER
            word = nwMatch[3];
            numStr = nwMatch[4];
        } else {
            continue; // Should not happen with this regex, but safety check
        }

        const number = parseInt(numStr, 10);

        if (!isNaN(number) && number > 0) {
            // Check if the word is a quantity keyword AND NOT an exclusion keyword
            const isQuantityWord = quantityKeywords.some(keyword => word.includes(keyword));
            const isExclusionWord = exclusionKeywords.some(keyword => word.includes(keyword));

            if (isQuantityWord && !isExclusionWord) {
                // Add the number if it seems relevant and not an exclusion
                // Avoid adding numbers already captured by the 'x' pattern if possible,
                // but for simplicity here, we might add duplicates.
                // A real-world system might need more complex deduplication or processing order.
                quantitiesToMultiply.push(number);
            }
            // Optional: Add logic here to handle patterns like "Pack of 10" where "of" is the connecting word
        }
    }

    // --- Strategy 3: Simple standalone numbers (Use with caution!) ---
    // This can catch quantities like "Product A - 100" but also random numbers.
    // It's safer to rely on keywords, but adding this can increase recall.
    // Only enable if necessary and you can accept potential false positives.
    /*
    const standaloneNumPattern = /(?:\s|^)(\d+)(?:\s|$)/g; // Number surrounded by space or start/end
     let snMatch;
     while ((snMatch = standaloneNumPattern.exec(processedTitle)) !== null) {
         const number = parseInt(snMatch[1], 10);
         // Add checks here to ensure this number isn't part of a word or exclusion pattern already
         // This requires more sophisticated context checking than simple regex loops.
         // For now, let's omit this unless proven necessary and false positives are acceptable.
     }
     */


    // --- Calculation ---
    if (quantitiesToMultiply.length === 0) {
        // If no specific quantity numbers were found, assume 1 unit
        return 1;
    }

    // Multiply all identified quantity numbers
    const totalQuantity = quantitiesToMultiply.reduce((product, num) => product * num, 1);

    return totalQuantity;
}



// Example demonstrating a number near an exclusion keyword
const title9 = "So Good Soy Beverage Unsweetened 1.2L (6 x 200ml)";
console.log(`Title: "${title9}" -> Quantity: ${extractQuantity(title9)}`); // Expected: 1 (should ignore 12 month)
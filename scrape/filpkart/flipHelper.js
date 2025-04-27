// fixed-flipHelper.js - Safe version that handles null pricePerUnit
function calculateSmartQuantity(product) {
  // Handle case where pricePerUnit is null
  if (!product.pricePerUnit) {
    // Return a default quantity or extract from title if possible
    const title = product.title || '';
    const qtyInfo = product.qtyInfo || '';

    // Try to extract quantity from title or qtyInfo
    const qtyMatch = (title + ' ' + qtyInfo).match(/(\d+(\.\d+)?\s*(kg|g|ml|l|L))/i);
    if (qtyMatch) {
      return qtyMatch[0];
    }

    // Return a placeholder if no quantity can be determined
    return 'N/A';
  }

  const { price } = product;
  const { pivotQualifier, pivotValue, pricePerUnit: ppu } = product.pricePerUnit;

  // Additional safety check for required values
  if (!price || !pivotValue || !ppu) {
    return 'N/A';
  }

  // Calculate total raw units (ml or g)
  const totalUnits = (price / ppu) * pivotValue;

  let quantity;
  let unit;

  switch (pivotQualifier) {
    case 'L':
      // If less than 1L, convert to ml
      if (totalUnits < 1) {
        quantity = totalUnits * 1000;
        unit = 'ml';
      } else {
        quantity = totalUnits;
        unit = 'L';
      }
      break;

    case 'ml':
      if (totalUnits >= 1000) {
        quantity = totalUnits / 1000;
        unit = 'L';
      } else {
        quantity = totalUnits;
        unit = 'ml';
      }
      break;

    case 'kg':
      // If less than 1kg, convert to g
      if (totalUnits < 1) {
        quantity = totalUnits * 1000;
        unit = 'g';
      } else {
        quantity = totalUnits;
        unit = 'kg';
      }
      break;

    case 'g':
      if (totalUnits >= 1000) {
        quantity = totalUnits / 1000;
        unit = 'kg';
      } else {
        quantity = totalUnits;
        unit = 'g';
      }
      break;

    default:
      quantity = totalUnits;
      unit = pivotQualifier || 'unit'; // fallback
  }

  return `${quantity.toFixed(2)} ${unit}`;
}

function getProductInfo(jsonData) {
  try {
    const info = {};

    // Safety check for required data
    if (!jsonData || !jsonData.productSwatch || !jsonData.productSwatch.products) {
      console.error('Invalid product data structure');
      return null;
    }

    let productVariant = Object.keys(jsonData.productSwatch.products);

    // Check if there are any variants
    if (!productVariant || productVariant.length === 0) {
      console.error('No product variants found');
      return null;
    }

    info.product = productVariant.map((variantId, itm) => {
      try {
        let prod = jsonData.productSwatch.products[variantId];

        // Safety check for product data
        if (!prod || !prod.titles) {
          console.error(`Invalid product data for variant ${variantId}`);
          return null;
        }

        let attriOpt = jsonData.productSwatch.attributeOptions || [];

        // Extract the quantity options (safely)
        let qtyOptions = (attriOpt.length > 0) ? attriOpt[0] : [];

        // Extract the full title (safely)
        const fullTitle = (prod.titles.title || '') + ' ' + (prod.titles.subtitle || '');

        // Extract quantity from the title using regex
        let extractedQty = '';
        const qtyMatch = fullTitle.match(
            /(\d+(\.\d+)?\s*(kg|g|ml|l|x\s*\d+\s*(kg|g|ml|l)))/i
        );
        if (qtyMatch) {
          extractedQty = qtyMatch[0];
        }

        // Find the matching quantity option
        let qtyInfo = null;
        if (qtyOptions && qtyOptions.length > 0) {
          for (let option of qtyOptions) {
            if (!option || !option.value) continue;

            // Normalize both strings for comparison
            const normalizedOption = option.value.toLowerCase().replace(/\s+/g, '');
            const normalizedExtracted = extractedQty
                .toLowerCase()
                .replace(/\s+/g, '');

            if (
                normalizedOption.includes(normalizedExtracted) ||
                normalizedExtracted.includes(normalizedOption.replace(/box/i, ''))
            ) {
              qtyInfo = option.value;
              break;
            }
          }

          // If still no match, try a more direct approach
          if (!qtyInfo) {
            for (let option of qtyOptions) {
              if (!option || !option.value) continue;

              if (
                  fullTitle
                      .toLowerCase()
                      .includes(option.value.toLowerCase().replace(/box/i, '').trim())
              ) {
                qtyInfo = option.value;
                break;
              }
            }
          }
        }

        // Safely extract price per unit information
        let pricePerUnit = null;
        if (prod.pricing && prod.pricing.pricePerUnit) {
          const { bestValue, ...otherValues } = prod.pricing.pricePerUnit;
          pricePerUnit = otherValues;
        }

        // Build product info object with safe defaults
        let productInfo = {
          id: variantId,
          image: prod.images && prod.images.length > 0 ? prod.images[0].url.replace('rukmini1', 'rukminim2') : '',
          url: prod.productUrl || '',
          mrp: prod.productAction?.tracking?.mrp || '0',
          price: prod.pricing?.finalPrice?.value || 0,
          pricePerUnit: pricePerUnit,
          title: fullTitle,
          qtyInfo: qtyInfo || (qtyOptions.length > 0 && qtyOptions[0].value ? qtyOptions[0].value : ''),
          variant: attriOpt.length > 1 && attriOpt[1] && attriOpt[1][itm] ? attriOpt[1][itm].value : null,
          category: prod.tracking?.category || '',
          offer:
              prod.offerTitle ||
              (prod?.offers?.length && prod?.offers[0]?.value?.title) ||
              null,
        };

        // Calculate smart quantity with error handling
        try {
          productInfo.smartQty = calculateSmartQuantity(productInfo);
        } catch (error) {
          console.error('Error calculating smart quantity:', error);
          productInfo.smartQty = 'N/A';
        }

        return productInfo;
      } catch (variantError) {
        console.error(`Error processing variant ${variantId}:`, variantError);
        return null;
      }
    }).filter(p => p !== null); // Remove any null products

    // If no valid products, return null
    if (!info.product || info.product.length === 0) {
      return null;
    }

    info.brand = jsonData.productBrand || 'Unknown';
    info.analyticsData = jsonData.analyticsData || {};
    return info;
  } catch (error) {
    console.error('Error in getProductInfo:', error);
    return null;
  }
}

module.exports = { getProductInfo, calculateSmartQuantity };
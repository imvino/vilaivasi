// const json = require('./flipkart_data_100031.json');

function calculateSmartQuantity(product) {
  const { price, pricePerUnit } = product;
  const { pivotQualifier, pivotValue, pricePerUnit: ppu } = pricePerUnit;

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
      unit = pivotQualifier; // fallback
  }

  return `${quantity.toFixed(2)} ${unit}`;
}

function getProductInfo(jsonData) {
  const info = {};
  let productVariant = Object.keys(jsonData.productSwatch.products);

  info.product = productVariant.map((variantId, itm) => {
    let prod = jsonData.productSwatch.products[variantId];
    let attriOpt = jsonData.productSwatch.attributeOptions;
    // Extract the quantity options
    let qtyOptions = attriOpt[0];

    // Extract the full title
    const fullTitle = prod.titles.title + ' ' + prod.titles.subtitle;

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
    for (let option of qtyOptions) {
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

    let pricePerUnit = null;
    if (prod.pricing.pricePerUnit) {
      const { bestValue, ...otherValues } = prod.pricing.pricePerUnit;
      pricePerUnit = otherValues;
    }

    let productInfo = {
      id: variantId,
      image: prod.images[0].url.replace('rukmini1', 'rukminim2'),
      url: prod.productUrl,
      mrp: prod.productAction.tracking.mrp,
      price: prod.pricing.finalPrice.value,
      pricePerUnit: pricePerUnit,
      title: prod.titles.title + ' ' + prod.titles.subtitle,
      qtyInfo: qtyInfo || (qtyOptions.length > 0 ? qtyOptions[0].value : ''),
      variant: attriOpt.length > 1 ? attriOpt[1][itm].value : null,
      category: prod.tracking.category,
      offer:
        prod.offerTitle ||
        (prod?.offers?.length && prod?.offers[0].value.title) ||
        null,
    };

    productInfo.smartQty = calculateSmartQuantity(productInfo);
    return productInfo;
  });

  info.brand = jsonData.productBrand;
  info.analyticsData = jsonData.analyticsData;
  return info;
}

// const values = json.map((v) => v.value);
// console.log(getProductInfo(values[11]));
module.exports = { getProductInfo };

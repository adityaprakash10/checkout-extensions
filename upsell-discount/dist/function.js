// node_modules/@shopify/shopify_function/run.ts
function run_default(userfunction) {
  try {
    ShopifyFunction;
  } catch (e) {
    throw new Error(
      "ShopifyFunction is not defined. Please rebuild your function using the latest version of Shopify CLI."
    );
  }
  const input_obj = ShopifyFunction.readInput();
  const output_obj = userfunction(input_obj);
  ShopifyFunction.writeOutput(output_obj);
}

// extensions/upsell-discount/src/cart_lines_discounts_generate_run.ts
function cartLinesDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes("PRODUCT" /* Product */)) {
    return { operations: [] };
  }
  const rawPercent = Number(input.cart.attribute?.value ?? 0);
  const discountPercent = rawPercent > 0 && rawPercent <= 100 ? rawPercent : 0;
  if (discountPercent === 0) {
    return { operations: [] };
  }
  const upsellLines = input.cart.lines.filter((line) => {
    const upsellAttr = line.upsellAttribute ?? line.attribute;
    return upsellAttr?.value === "true";
  });
  if (!upsellLines.length) {
    return { operations: [] };
  }
  const candidates = upsellLines.map((line) => {
    const bundleAttr = line.bundleAttribute;
    const isBundle = bundleAttr?.value === "true";
    const finalDiscountPercent = isBundle ? 75 : discountPercent;
    return {
      message: `${finalDiscountPercent}% OFF`,
      targets: [{ cartLine: { id: line.id } }],
      value: {
        percentage: { value: finalDiscountPercent }
      }
    };
  });
  return {
    operations: [
      {
        productDiscountsAdd: {
          selectionStrategy: "ALL" /* All */,
          candidates
        }
      }
    ]
  };
}

// extensions/upsell-discount/src/cart_delivery_options_discounts_generate_run.ts
function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    return { operations: [] };
  }
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    "SHIPPING" /* Shipping */
  );
  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }
  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: "FREE DELIVERY",
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id
                  }
                }
              ],
              value: {
                percentage: {
                  value: 100
                }
              }
            }
          ],
          selectionStrategy: "ALL" /* All */
        }
      }
    ]
  };
}

// <stdin>
function cartLinesDiscountsGenerateRun2() {
  return run_default(cartLinesDiscountsGenerateRun);
}
function cartDeliveryOptionsDiscountsGenerateRun2() {
  return run_default(cartDeliveryOptionsDiscountsGenerateRun);
}
export {
  cartDeliveryOptionsDiscountsGenerateRun2 as cartDeliveryOptionsDiscountsGenerateRun,
  cartLinesDiscountsGenerateRun2 as cartLinesDiscountsGenerateRun
};

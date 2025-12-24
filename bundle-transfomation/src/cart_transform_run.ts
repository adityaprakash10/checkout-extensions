import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

export function cartTransformRun(
  input: CartTransformRunInput
): CartTransformRunResult {
  const operations: Operation[] = [];
  const bundleGroups: Record<string, typeof input.cart.lines> = {};
  for (const line of input.cart.lines) {
    const bundleId = line.bundleId?.value;
    if (!bundleId) continue;
    if (!bundleGroups[bundleId]) {
      bundleGroups[bundleId] = [];
    }
    bundleGroups[bundleId].push(line);
  }
  for (const group of Object.values(bundleGroups)) {
    if (group.length < 2) continue;

    const parentLine = group[0];

    if (
      parentLine.merchandise.__typename !== "ProductVariant"
    ) {
      continue;
    }

    operations.push({
      linesMerge: {
        cartLines: group.map((line) => ({
          cartLineId: line.id,
          quantity: line.quantity,
        })),
        parentVariantId: parentLine.merchandise.id,
        title: "Snowboard Starter Bundle",
      },
    });
  }
  for (const line of input.cart.lines) {
    const isFreeGift = line.freeGift?.value === "true";
    if (!isFreeGift) continue;

    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: "0.00",
            },
          },
        },
      },
    });
  }

  return { operations };
}

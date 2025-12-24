import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

export function cartTransformRun(
  input: CartTransformRunInput
): CartTransformRunResult {
  const operations: Operation[] = [];

  for (const line of input.cart.lines) {
    const rawPrice = line.updatePrice?.value;
    if (!rawPrice) continue;
    const price = parseFloat(rawPrice).toFixed(2);
   

    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: price
            },
          },
        },
      },
    });
  }

  return { operations };
}

import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

export function cartTransformRun(
  input: CartTransformRunInput
): CartTransformRunResult {
  const operations: Operation[] = [];

  const upsellLines = input.cart.lines.filter(
    (line) => line.attribute?.value === "true"
  );
  if (upsellLines.length < 3) {
    return { operations };
  }
  const parentLine = upsellLines[0];
  if (parentLine.merchandise.__typename !== "ProductVariant") {
    return { operations };
  }
  operations.push({
    linesMerge: {
      parentVariantId: parentLine.merchandise.id,
      title: "Upsell Bundle",
      attributes: [
        { key: "upsell", value: "true" },
        { key: "is_bundle", value: "true" },
      ],
      cartLines: upsellLines.map((line) => ({
        cartLineId: line.id,
        quantity: line.quantity,
      })),
    },
  });
  return { operations };
}

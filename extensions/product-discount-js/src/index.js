// @ts-check
import { DiscountApplicationStrategy } from '../generated/api';

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 */

/**
 * @type {FunctionResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

export default /**
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
(input) => {
  /**
   * @type {{
   *   quantity: number
   *   percentage: number
   *   hasTag: boolean
   * }}
   */

  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? '{}'
  );
  if (!configuration.quantity || !configuration.percentage) {
    return EMPTY_DISCOUNT;
  }

  const hasTag = input?.cart?.buyerIdentity?.customer?.hasAnyTag;
  if (!hasTag) {
    console.error('Customer does not have the tag required for this discount.');
    return EMPTY_DISCOUNT;
  } else if (hasTag) {
    console.error('Customer has the tag and will get the discount');
  }

  const targets = input.cart.lines
    .filter(
      (line) =>
        line.quantity >= configuration.quantity &&
        line.merchandise.__typename == 'ProductVariant'
    )
    .map((line) => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      return /** @type {Target} */ ({
        productVariant: {
          id: variant.id,
        },
      });
    });

  if (!targets.length) {
    console.error('No cart lines qualify for volume discount.');
    return EMPTY_DISCOUNT;
  }

  return {
    discounts: [
      {
        targets,
        value: {
          percentage: {
            value: configuration.percentage.toString(),
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
};

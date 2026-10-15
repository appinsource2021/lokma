import type { Cents } from "./money";

export interface OptionDef {
  id: string;
  name: string;
  priceDelta: Cents;
}

export interface OptionGroupDef {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: OptionDef[];
}

export interface ItemDef {
  id: string;
  name: string;
  basePrice: Cents;
  available: boolean;
  optionGroups: OptionGroupDef[];
}

export interface PromotionDef {
  id: string;
  kind: "PERCENT" | "FIXED";
  /** Percent (0–100) for PERCENT, cents for FIXED. */
  value: number;
  minSubtotal: Cents;
  label: string;
}

export interface CartLineInput {
  itemId: string;
  quantity: number;
  optionIds: string[];
}

export type CartErrorCode =
  | "EMPTY_CART"
  | "ITEM_NOT_FOUND"
  | "ITEM_UNAVAILABLE"
  | "INVALID_QUANTITY"
  | "DUPLICATE_OPTION"
  | "OPTION_NOT_IN_ITEM"
  | "TOO_FEW_OPTIONS"
  | "TOO_MANY_OPTIONS"
  | "BELOW_MIN_ORDER";

export interface CartError {
  code: CartErrorCode;
  lineIndex?: number;
  message: string;
}

export interface PricedLine {
  itemId: string;
  name: string;
  quantity: number;
  options: { id: string; name: string; priceDelta: Cents }[];
  unitPrice: Cents;
  lineTotal: Cents;
}

export interface CartQuote {
  ok: boolean;
  errors: CartError[];
  lines: PricedLine[];
  subtotal: Cents;
  discount: Cents;
  promotion: { id: string; label: string } | null;
  deliveryFee: Cents;
  total: Cents;
  /** How much more the customer must add to reach the minimum order. */
  minOrderShortfall: Cents;
}

export const MAX_LINE_QUANTITY = 50;

/** Lowest price of an item: base price plus the cheapest valid required choices. */
export function fromPrice(item: ItemDef): Cents {
  let price = item.basePrice;
  for (const group of item.optionGroups) {
    if (group.minSelect === 0) continue;
    const cheapest = group.options
      .map((o) => o.priceDelta)
      .sort((a, b) => a - b)
      .slice(0, group.minSelect);
    price += cheapest.reduce((sum, d) => sum + d, 0);
  }
  return price;
}

/** Errors for one item and option selection, independent of quantity. */
export function validateSelection(item: ItemDef, optionIds: string[]): CartError[] {
  const errors: CartError[] = [];
  if (new Set(optionIds).size !== optionIds.length) {
    errors.push({ code: "DUPLICATE_OPTION", message: `An option was selected twice for ${item.name}.` });
  }
  const known = new Set(item.optionGroups.flatMap((g) => g.options.map((o) => o.id)));
  for (const id of optionIds) {
    if (!known.has(id)) {
      errors.push({ code: "OPTION_NOT_IN_ITEM", message: `Option ${id} does not belong to ${item.name}.` });
    }
  }
  for (const group of item.optionGroups) {
    const chosen = group.options.filter((o) => optionIds.includes(o.id)).length;
    if (chosen < group.minSelect) {
      errors.push({ code: "TOO_FEW_OPTIONS", message: `Choose at least ${group.minSelect} for "${group.name}".` });
    }
    if (chosen > group.maxSelect) {
      errors.push({ code: "TOO_MANY_OPTIONS", message: `Choose at most ${group.maxSelect} for "${group.name}".` });
    }
  }
  return errors;
}

function bestPromotion(promotions: PromotionDef[], subtotal: Cents): { promo: PromotionDef; amount: Cents } | null {
  let best: { promo: PromotionDef; amount: Cents } | null = null;
  for (const promo of promotions) {
    if (subtotal < promo.minSubtotal) continue;
    const raw = promo.kind === "PERCENT" ? Math.round((subtotal * promo.value) / 100) : promo.value;
    const amount = Math.min(raw, subtotal);
    if (amount > 0 && (!best || amount > best.amount)) best = { promo, amount };
  }
  return best;
}

/**
 * Prices a cart against the current menu. The minimum order is checked
 * against the subtotal before discounts. The best single promotion applies.
 */
export function priceCart(input: {
  items: Map<string, ItemDef>;
  lines: CartLineInput[];
  deliveryFee: Cents;
  minOrder: Cents;
  promotions: PromotionDef[];
}): CartQuote {
  const errors: CartError[] = [];
  const lines: PricedLine[] = [];

  if (input.lines.length === 0) {
    errors.push({ code: "EMPTY_CART", message: "The cart is empty." });
  }

  input.lines.forEach((line, lineIndex) => {
    const item = input.items.get(line.itemId);
    if (!item) {
      errors.push({ code: "ITEM_NOT_FOUND", lineIndex, message: "This item is no longer on the menu." });
      return;
    }
    if (!item.available) {
      errors.push({ code: "ITEM_UNAVAILABLE", lineIndex, message: `${item.name} is sold out.` });
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      errors.push({ code: "INVALID_QUANTITY", lineIndex, message: `Invalid quantity for ${item.name}.` });
      return;
    }
    for (const e of validateSelection(item, line.optionIds)) errors.push({ ...e, lineIndex });

    const options = item.optionGroups
      .flatMap((g) => g.options)
      .filter((o) => line.optionIds.includes(o.id))
      .map((o) => ({ id: o.id, name: o.name, priceDelta: o.priceDelta }));
    const unitPrice = item.basePrice + options.reduce((sum, o) => sum + o.priceDelta, 0);
    lines.push({
      itemId: item.id,
      name: item.name,
      quantity: line.quantity,
      options,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    });
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const minOrderShortfall = Math.max(0, input.minOrder - subtotal);
  if (lines.length > 0 && minOrderShortfall > 0) {
    errors.push({ code: "BELOW_MIN_ORDER", message: "The minimum order has not been reached." });
  }

  const best = bestPromotion(input.promotions, subtotal);
  const discount = best?.amount ?? 0;
  const deliveryFee = lines.length > 0 ? input.deliveryFee : 0;

  return {
    ok: errors.length === 0,
    errors,
    lines,
    subtotal,
    discount,
    promotion: best ? { id: best.promo.id, label: best.promo.label } : null,
    deliveryFee,
    total: subtotal - discount + deliveryFee,
    minOrderShortfall,
  };
}

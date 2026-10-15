import { describe, expect, it } from "vitest";
import { fromPrice, priceCart, type ItemDef, type PromotionDef } from "./pricing";

const pizza: ItemDef = {
  id: "pizza",
  name: "Pizza",
  basePrice: 800,
  available: true,
  optionGroups: [
    {
      id: "size",
      name: "Size",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: "small", name: "26 cm", priceDelta: 0 },
        { id: "large", name: "32 cm", priceDelta: 300 },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      minSelect: 0,
      maxSelect: 2,
      options: [
        { id: "olives", name: "Olives", priceDelta: 100 },
        { id: "cheese", name: "Extra cheese", priceDelta: 150 },
        { id: "chili", name: "Chili", priceDelta: 50 },
      ],
    },
  ],
};
const soldOut: ItemDef = { id: "soup", name: "Soup", basePrice: 500, available: false, optionGroups: [] };
const items = new Map([pizza, soldOut].map((i) => [i.id, i]));

const base = { items, deliveryFee: 250, minOrder: 1000, promotions: [] as PromotionDef[] };

describe("priceCart", () => {
  it("prices options and quantities and adds the delivery fee", () => {
    const q = priceCart({
      ...base,
      lines: [{ itemId: "pizza", quantity: 2, optionIds: ["large", "olives"] }],
    });
    expect(q.ok).toBe(true);
    expect(q.lines[0]?.unitPrice).toBe(1200);
    expect(q.subtotal).toBe(2400);
    expect(q.total).toBe(2650);
  });

  it("reports the minimum order shortfall", () => {
    const q = priceCart({ ...base, lines: [{ itemId: "pizza", quantity: 1, optionIds: ["small"] }] });
    expect(q.ok).toBe(false);
    expect(q.minOrderShortfall).toBe(200);
    expect(q.errors.map((e) => e.code)).toEqual(["BELOW_MIN_ORDER"]);
  });

  it("enforces required and maximum option choices", () => {
    const q = priceCart({
      ...base,
      lines: [
        { itemId: "pizza", quantity: 1, optionIds: [] },
        { itemId: "pizza", quantity: 1, optionIds: ["small", "olives", "cheese", "chili"] },
      ],
    });
    expect(q.errors.map((e) => [e.code, e.lineIndex])).toEqual([
      ["TOO_FEW_OPTIONS", 0],
      ["TOO_MANY_OPTIONS", 1],
    ]);
  });

  it("rejects unknown, foreign and duplicate options, sold-out items and bad quantities", () => {
    const q = priceCart({
      ...base,
      lines: [
        { itemId: "nope", quantity: 1, optionIds: [] },
        { itemId: "soup", quantity: 1, optionIds: [] },
        { itemId: "pizza", quantity: 0, optionIds: ["small"] },
        { itemId: "pizza", quantity: 1, optionIds: ["small", "small"] },
        { itemId: "pizza", quantity: 1, optionIds: ["small", "anchovies"] },
      ],
    });
    expect(q.errors.map((e) => e.code)).toEqual([
      "ITEM_NOT_FOUND",
      "ITEM_UNAVAILABLE",
      "INVALID_QUANTITY",
      "DUPLICATE_OPTION",
      "OPTION_NOT_IN_ITEM",
    ]);
  });

  it("applies the single best eligible promotion and never discounts below zero", () => {
    const promotions: PromotionDef[] = [
      { id: "p10", kind: "PERCENT", value: 10, minSubtotal: 0, label: "10% off" },
      { id: "f5", kind: "FIXED", value: 500, minSubtotal: 3000, label: "€5 off from €30" },
      { id: "huge", kind: "FIXED", value: 99999, minSubtotal: 100000, label: "never" },
    ];
    const small = priceCart({ ...base, promotions, lines: [{ itemId: "pizza", quantity: 2, optionIds: ["large"] }] });
    expect(small.discount).toBe(220);
    expect(small.promotion?.id).toBe("p10");

    const big = priceCart({ ...base, promotions, lines: [{ itemId: "pizza", quantity: 3, optionIds: ["large"] }] });
    expect(big.discount).toBe(500);
    expect(big.total).toBe(3300 - 500 + 250);
  });

  it("charges nothing for an empty cart", () => {
    const q = priceCart({ ...base, lines: [] });
    expect(q.total).toBe(0);
    expect(q.errors.map((e) => e.code)).toEqual(["EMPTY_CART"]);
  });
});

describe("fromPrice", () => {
  it("adds the cheapest required choices only", () => {
    expect(fromPrice(pizza)).toBe(800);
    const twoSauces: ItemDef = {
      ...pizza,
      optionGroups: [{ id: "s", name: "Sauces", minSelect: 2, maxSelect: 3, options: [
        { id: "a", name: "A", priceDelta: 50 },
        { id: "b", name: "B", priceDelta: 20 },
        { id: "c", name: "C", priceDelta: 30 },
      ] }],
    };
    expect(fromPrice(twoSauces)).toBe(850);
  });
});

import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

const hasDb = Boolean(process.env.DATABASE_URL);
const slug = `test-${Date.now()}`;
const here = { lat: 49.4875, lng: 8.466 };
const address = { line: "Teststraße 1, 68159 Mannheim", ...here };

describe.skipIf(!hasDb)("API", () => {
  let db: PrismaClient;
  let app: FastifyInstance;
  let pizzaId = "";
  let sizeSmall = "";

  beforeAll(async () => {
    db = new PrismaClient();
    app = await buildApp(db);
    const r = await db.restaurant.create({
      data: {
        slug,
        name: "Test Pizzeria",
        cuisines: ["Pizza"],
        street: "Teststraße 2",
        city: "Mannheim",
        lat: here.lat + 0.009,
        lng: here.lng,
        rating: 4,
        ratingCount: 100,
        openingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "00:00", close: "00:00" })),
        zones: { create: [{ radiusKm: 3, deliveryFee: 200, minOrder: 1000, etaMin: 20, etaMax: 30 }] },
        promotions: { create: [{ kind: "PERCENT", value: 10, label: "10% off" }] },
        categories: {
          create: [{
            name: "Pizza",
            items: {
              create: [{
                name: "Margherita",
                basePrice: 800,
                optionGroups: {
                  create: [{ name: "Size", minSelect: 1, maxSelect: 1, options: { create: [{ name: "Small" }, { name: "Large", priceDelta: 300 }] } }],
                },
              }],
            },
          }],
        },
      },
      include: { categories: { include: { items: { include: { optionGroups: { include: { options: true } } } } } } },
    });
    const item = r.categories[0]!.items[0]!;
    pizzaId = item.id;
    sizeSmall = item.optionGroups[0]!.options.find((o) => o.name === "Small")!.id;
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { restaurant: { slug } } });
    await db.restaurant.deleteMany({ where: { slug } });
    await app.close();
    await db.$disconnect();
  });

  it("lists restaurants that deliver to the address with their terms", async () => {
    const res = await app.inject({ url: `/restaurants?lat=${here.lat}&lng=${here.lng}&q=Test Pizzeria` });
    expect(res.statusCode).toBe(200);
    const found = res.json().restaurants.find((r: { slug: string }) => r.slug === slug);
    expect(found).toMatchObject({ isOpen: true, distanceKm: 1, terms: { deliveryFee: 200, minOrder: 1000 } });
  });

  it("hides restaurants outside their delivery zones", async () => {
    const res = await app.inject({ url: `/restaurants?lat=${here.lat + 0.1}&lng=${here.lng}&q=Test Pizzeria` });
    expect(res.json().restaurants).toHaveLength(0);
  });

  it("rejects bad query parameters", async () => {
    const res = await app.inject({ url: "/restaurants?lat=abc&lng=8" });
    expect(res.statusCode).toBe(400);
  });

  it("returns the menu", async () => {
    const res = await app.inject({ url: `/restaurants/${slug}` });
    expect(res.json().menu[0].items[0]).toMatchObject({ name: "Margherita", basePrice: 800 });
  });

  it("refuses an order below the minimum and places a valid one with server-side prices", async () => {
    const base = {
      restaurantSlug: slug,
      mode: "DELIVERY",
      address,
      customer: { name: "Ada Test", phone: "+49 621 123456" },
    };
    const tooSmall = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { ...base, lines: [{ itemId: pizzaId, quantity: 1, optionIds: [sizeSmall] }] },
    });
    expect(tooSmall.statusCode).toBe(422);
    expect(tooSmall.json().quote.minOrderShortfall).toBe(200);

    const placed = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { ...base, lines: [{ itemId: pizzaId, quantity: 2, optionIds: [sizeSmall] }] },
    });
    expect(placed.statusCode).toBe(201);
    const order = placed.json().order;
    expect(order).toMatchObject({ subtotal: 1600, discount: 160, deliveryFee: 200, total: 1640, status: "PLACED" });

    const fetched = await app.inject({ url: `/orders/${order.id}` });
    expect(fetched.json().order.items[0]).toMatchObject({ name: "Margherita", quantity: 2 });
  });

  it("rejects delivery outside the zone", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/orders/quote",
      payload: { restaurantSlug: slug, mode: "DELIVERY", address: { ...address, lat: here.lat + 0.1 }, lines: [] },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe("OUT_OF_AREA");
  });
});

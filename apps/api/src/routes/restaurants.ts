import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Db } from "../db";
import {
  activePromotions,
  availability,
  menu,
  restaurantWithMenu,
  restaurantWithTerms,
  summary,
} from "../lib/restaurants";

const flag = z
  .enum(["1", "true", "0", "false"])
  .transform((v) => v === "1" || v === "true")
  .optional();

const listQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  mode: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  q: z.string().trim().max(80).optional(),
  cuisine: z.string().trim().max(40).optional(),
  freeDelivery: flag,
  offers: flag,
  openNow: flag,
  sort: z.enum(["recommended", "rating", "eta", "fee", "distance"]).default("recommended"),
});

const pointQuery = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  mode: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
});

export function restaurantRoutes(app: FastifyInstance, db: Db) {
  app.get("/restaurants", async (req) => {
    const query = listQuery.parse(req.query);
    const now = new Date();
    const rows = await db.restaurant.findMany({ include: restaurantWithTerms });
    const needle = query.q?.toLowerCase();

    const results = rows
      .map((row) => summary(row, availability(row, query, query.mode, now), now))
      .filter((r) => r.terms !== null)
      .filter((r) => !query.cuisine || r.cuisines.includes(query.cuisine))
      .filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.cuisines.some((c) => c.toLowerCase().includes(needle)))
      .filter((r) => !query.freeDelivery || r.terms!.deliveryFee === 0)
      .filter((r) => !query.offers || r.promotions.length > 0)
      .filter((r) => !query.openNow || r.isOpen);

    const by: Record<typeof query.sort, (a: (typeof results)[number], b: (typeof results)[number]) => number> = {
      recommended: (a, b) => b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10),
      rating: (a, b) => b.rating - a.rating,
      eta: (a, b) => a.terms!.etaMin - b.terms!.etaMin,
      fee: (a, b) => a.terms!.deliveryFee - b.terms!.deliveryFee,
      distance: (a, b) => a.distanceKm - b.distanceKm,
    };
    // Open restaurants always come before closed ones.
    results.sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || by[query.sort](a, b));

    const cuisines = [...new Set(rows.flatMap((r) => r.cuisines))].sort();
    return { restaurants: results, cuisines };
  });

  app.get<{ Params: { slug: string } }>("/restaurants/:slug", async (req, reply) => {
    const query = pointQuery.parse(req.query);
    const row = await db.restaurant.findUnique({ where: { slug: req.params.slug }, include: restaurantWithMenu });
    if (!row) return reply.code(404).send({ error: "NOT_FOUND" });
    const now = new Date();
    const point = query.lat !== undefined && query.lng !== undefined ? { lat: query.lat, lng: query.lng } : null;
    return {
      restaurant: {
        ...summary(row, availability(row, point, query.mode, now), now),
        street: row.street,
        city: row.city,
        openingHours: row.openingHours,
        promotionTerms: activePromotions(row, now),
      },
      menu: menu(row),
    };
  });
}

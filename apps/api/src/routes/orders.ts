import { priceCart, type FulfilmentMode } from "@lokma/core";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Db } from "../db";
import { activePromotions, availability, menuItems, restaurantWithMenu } from "../lib/restaurants";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int(),
  optionIds: z.array(z.string()).max(30).default([]),
});

const addressSchema = z.object({
  line: z.string().trim().min(3).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const quoteSchema = z.object({
  restaurantSlug: z.string().min(1),
  mode: z.enum(["DELIVERY", "PICKUP"]),
  address: addressSchema,
  lines: z.array(lineSchema).max(100),
});

const orderSchema = quoteSchema.extend({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^\+?[0-9 ()/-]{6,20}$/, "Invalid phone number"),
  }),
  note: z.string().trim().max(500).optional(),
});

const publicOrder = {
  restaurant: { select: { slug: true, name: true } },
  items: true,
} as const;

async function quote(db: Db, input: z.infer<typeof quoteSchema>) {
  const row = await db.restaurant.findUnique({ where: { slug: input.restaurantSlug }, include: restaurantWithMenu });
  if (!row) return { status: 404 as const, body: { error: "NOT_FOUND" } };

  const now = new Date();
  const avail = availability(row, input.address, input.mode as FulfilmentMode, now);
  if (!avail.terms) {
    return { status: 422 as const, body: { error: "OUT_OF_AREA", message: "This restaurant does not serve your address." } };
  }
  const result = priceCart({
    items: menuItems(row),
    lines: input.lines,
    deliveryFee: avail.terms.deliveryFee,
    minOrder: avail.terms.minOrder,
    promotions: activePromotions(row, now),
  });
  return { status: 200 as const, row, avail, terms: avail.terms, quote: result };
}

export function orderRoutes(app: FastifyInstance, db: Db) {
  app.post("/orders/quote", async (req, reply) => {
    const result = await quote(db, quoteSchema.parse(req.body));
    if (result.status !== 200) return reply.code(result.status).send(result.body);
    return { quote: result.quote, terms: result.terms, isOpen: result.avail.isOpen, opensAt: result.avail.opensAt };
  });

  app.post("/orders", async (req, reply) => {
    const input = orderSchema.parse(req.body);
    const result = await quote(db, input);
    if (result.status !== 200) return reply.code(result.status).send(result.body);
    if (!result.avail.isOpen) {
      return reply.code(422).send({ error: "CLOSED", message: "The restaurant is closed right now.", opensAt: result.avail.opensAt });
    }
    if (!result.quote.ok) {
      return reply.code(422).send({ error: "INVALID_CART", quote: result.quote });
    }

    const { quote: q, terms } = result;
    const order = await db.order.create({
      data: {
        restaurantId: result.row.id,
        mode: input.mode,
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        addressLine: input.mode === "DELIVERY" ? input.address.line : null,
        addressLat: input.mode === "DELIVERY" ? input.address.lat : null,
        addressLng: input.mode === "DELIVERY" ? input.address.lng : null,
        note: input.note || null,
        subtotal: q.subtotal,
        discount: q.discount,
        deliveryFee: q.deliveryFee,
        total: q.total,
        promotionLabel: q.promotion?.label ?? null,
        etaMin: terms.etaMin,
        etaMax: terms.etaMax,
        items: {
          create: q.lines.map((l) => ({
            itemId: l.itemId,
            name: l.name,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            options: l.options,
          })),
        },
      },
      include: publicOrder,
    });
    return reply.code(201).send({ order });
  });

  // The order id is an unguessable cuid and acts as the guest's access token.
  app.get<{ Params: { id: string } }>("/orders/:id", async (req, reply) => {
    const order = await db.order.findUnique({ where: { id: req.params.id }, include: publicOrder });
    if (!order) return reply.code(404).send({ error: "NOT_FOUND" });
    return { order };
  });
}

/**
 * Demo data around Mannheim city centre. Every restaurant, dish and price here
 * is invented for Lokma; none of it comes from another service.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import type { OpeningPeriod } from "@lokma/core";

const prisma = new PrismaClient();

export const DEMO_CENTER = { lat: 49.4875, lng: 8.466 };
const KM_LAT = 0.009;
const KM_LNG = 0.0138;

const everyDay = (open: string, close: string): OpeningPeriod[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open, close }));

type Opt = [name: string, priceDelta?: number];
type Group = { name: string; min: number; max: number; options: Opt[] };
type Item = { name: string; price: number; description?: string; tags?: string[]; allergens?: string[]; available?: boolean; groups?: Group[] };
type Category = { name: string; items: Item[] };

const sizes = (small: string, large: string, extra: number): Group => ({
  name: "Size",
  min: 1,
  max: 1,
  options: [[small], [large, extra]],
});

const drinks: Category = {
  name: "Drinks",
  items: [
    { name: "Sparkling water 0.5 l", price: 250, description: "Plus €0.25 deposit" },
    { name: "Homemade lemonade 0.4 l", price: 390, tags: ["vegan"], groups: [{ name: "Flavour", min: 1, max: 1, options: [["Mint"], ["Ginger"], ["Rhubarb", 30]] }] },
    { name: "Ayran 0.25 l", price: 220, allergens: ["milk"] },
  ],
};

function menu(categories: Category[]): Prisma.MenuCategoryCreateWithoutRestaurantInput[] {
  return categories.map((c, ci) => ({
    name: c.name,
    sort: ci,
    items: {
      create: c.items.map((i, ii) => ({
        name: i.name,
        description: i.description ?? "",
        basePrice: i.price,
        available: i.available ?? true,
        tags: i.tags ?? [],
        allergens: i.allergens ?? [],
        sort: ii,
        optionGroups: {
          create: (i.groups ?? []).map((g, gi) => ({
            name: g.name,
            minSelect: g.min,
            maxSelect: g.max,
            sort: gi,
            options: { create: g.options.map(([name, delta], oi) => ({ name, priceDelta: delta ?? 0, sort: oi })) },
          })),
        },
      })),
    },
  }));
}

interface Seed {
  slug: string;
  name: string;
  description: string;
  cuisines: string[];
  street: string;
  offset: [kmNorth: number, kmEast: number];
  rating: number;
  ratingCount: number;
  coverHue: number;
  hours: OpeningPeriod[];
  prepMinutes: number;
  zones: { radiusKm: number; deliveryFee: number; minOrder: number; etaMin: number; etaMax: number }[];
  promotions?: { kind: "PERCENT" | "FIXED"; value: number; minSubtotal?: number; label: string }[];
  categories: Category[];
}

const restaurants: Seed[] = [
  {
    slug: "ocakbasi-anadolu",
    name: "Anadolu Ocakbaşı",
    description: "Charcoal grill, lahmacun and mezes, late into the night.",
    cuisines: ["Turkish", "Grill"],
    street: "Breite Straße 12",
    offset: [0.4, -0.3],
    rating: 4.7,
    ratingCount: 1240,
    coverHue: 14,
    hours: everyDay("11:00", "03:00"),
    prepMinutes: 20,
    zones: [
      { radiusKm: 2, deliveryFee: 0, minOrder: 1500, etaMin: 25, etaMax: 35 },
      { radiusKm: 6, deliveryFee: 290, minOrder: 2500, etaMin: 35, etaMax: 50 },
    ],
    promotions: [{ kind: "PERCENT", value: 10, minSubtotal: 2000, label: "10% off from €20" }],
    categories: [
      {
        name: "From the grill",
        items: [
          { name: "Adana kebab plate", price: 1490, description: "Spicy minced lamb skewer, bulgur, grilled pepper and tomato", groups: [{ name: "Side", min: 1, max: 1, options: [["Bulgur"], ["Rice"], ["Fries", 50]] }, { name: "Extras", min: 0, max: 3, options: [["Extra yoghurt", 120], ["Ezme salad", 250], ["Grilled halloumi", 350]] }] },
          { name: "Chicken shish plate", price: 1390, description: "Marinated chicken thigh, salad, bread", groups: [{ name: "Side", min: 1, max: 1, options: [["Bulgur"], ["Rice"], ["Fries", 50]] }] },
          { name: "Mixed grill for two", price: 3290, description: "Adana, chicken shish, lamb chops, köfte", tags: ["sharing"] },
        ],
      },
      {
        name: "Oven",
        items: [
          { name: "Lahmacun", price: 550, description: "Thin flatbread with spiced minced meat, parsley and lemon", allergens: ["gluten"], groups: [{ name: "Spice", min: 1, max: 1, options: [["Mild"], ["Spicy"]] }] },
          { name: "Pide with cheese and egg", price: 1090, allergens: ["gluten", "milk", "egg"], tags: ["vegetarian"] },
        ],
      },
      drinks,
    ],
  },
  {
    slug: "trattoria-nonna-lina",
    name: "Trattoria Nonna Lina",
    description: "Wood-fired pizza and fresh pasta.",
    cuisines: ["Italian", "Pizza"],
    street: "Kunststraße 5",
    offset: [-0.6, 0.5],
    rating: 4.5,
    ratingCount: 860,
    coverHue: 4,
    hours: [1, 2, 3, 4, 5, 6, 0].flatMap((day) => [{ day, open: "11:30", close: "14:30" }, { day, open: "17:00", close: "23:00" }]),
    prepMinutes: 15,
    zones: [{ radiusKm: 4, deliveryFee: 190, minOrder: 1500, etaMin: 30, etaMax: 45 }],
    categories: [
      {
        name: "Pizza",
        items: [
          { name: "Margherita", price: 850, description: "Tomato, fior di latte, basil", tags: ["vegetarian"], allergens: ["gluten", "milk"], groups: [sizes("28 cm", "34 cm", 300), { name: "Extra toppings", min: 0, max: 4, options: [["Buffalo mozzarella", 250], ["Rocket", 100], ["Olives", 100], ["Spicy salami", 200]] }] },
          { name: "Diavola", price: 1050, description: "Tomato, mozzarella, spicy salami, chili oil", allergens: ["gluten", "milk"], groups: [sizes("28 cm", "34 cm", 300)] },
          { name: "Funghi e tartufo", price: 1290, description: "White base, mushrooms, truffle cream", tags: ["vegetarian"], allergens: ["gluten", "milk"], groups: [sizes("28 cm", "34 cm", 300)] },
        ],
      },
      {
        name: "Pasta",
        items: [
          { name: "Tagliatelle al ragù", price: 1190, allergens: ["gluten", "egg"] },
          { name: "Spaghetti aglio, olio e peperoncino", price: 890, tags: ["vegan"], allergens: ["gluten"] },
          { name: "Lasagne della nonna", price: 1250, allergens: ["gluten", "milk", "egg"], available: false },
        ],
      },
      { name: "Dolci", items: [{ name: "Tiramisu", price: 550, allergens: ["gluten", "milk", "egg"] }] },
    ],
  },
  {
    slug: "golden-wok-quadrate",
    name: "Golden Wok",
    description: "Wok dishes and dumplings.",
    cuisines: ["Chinese", "Asian"],
    street: "Q5 3",
    offset: [0.9, 0.8],
    rating: 4.2,
    ratingCount: 410,
    coverHue: 45,
    hours: everyDay("11:00", "22:30"),
    prepMinutes: 15,
    zones: [{ radiusKm: 5, deliveryFee: 250, minOrder: 1200, etaMin: 30, etaMax: 45 }],
    promotions: [{ kind: "FIXED", value: 500, minSubtotal: 3000, label: "€5 off from €30" }],
    categories: [
      {
        name: "Wok",
        items: [
          { name: "Fried noodles", price: 990, groups: [{ name: "Protein", min: 1, max: 1, options: [["Tofu"], ["Chicken", 100], ["Prawns", 300]] }, { name: "Spice level", min: 1, max: 1, options: [["Mild"], ["Medium"], ["Hot"]] }] },
          { name: "Kung pao", price: 1190, allergens: ["peanuts"], groups: [{ name: "Protein", min: 1, max: 1, options: [["Tofu"], ["Chicken", 100]] }] },
        ],
      },
      {
        name: "Dumplings",
        items: [
          { name: "Vegetable dumplings (8)", price: 690, tags: ["vegan"], allergens: ["gluten", "soy"] },
          { name: "Pork dumplings (8)", price: 750, allergens: ["gluten", "soy"] },
        ],
      },
    ],
  },
  {
    slug: "burger-werk",
    name: "Burger Werk",
    description: "Smash burgers and loaded fries.",
    cuisines: ["Burger", "American"],
    street: "Jungbuschstraße 20",
    offset: [1.2, -1.4],
    rating: 4.6,
    ratingCount: 2310,
    coverHue: 28,
    hours: everyDay("12:00", "23:30"),
    prepMinutes: 12,
    zones: [
      { radiusKm: 3, deliveryFee: 100, minOrder: 1500, etaMin: 25, etaMax: 35 },
      { radiusKm: 8, deliveryFee: 390, minOrder: 3000, etaMin: 40, etaMax: 55 },
    ],
    promotions: [{ kind: "PERCENT", value: 15, minSubtotal: 2500, label: "15% off from €25" }],
    categories: [
      {
        name: "Burgers",
        items: [
          { name: "Classic smash", price: 990, allergens: ["gluten", "milk", "mustard"], groups: [{ name: "Patties", min: 1, max: 1, options: [["Single"], ["Double", 300], ["Triple", 550]] }, { name: "Extras", min: 0, max: 5, options: [["Bacon", 150], ["Jalapeños", 80], ["Fried egg", 120], ["Extra cheese", 100], ["Caramelised onions", 80]] }] },
          { name: "Crispy chicken burger", price: 1090, allergens: ["gluten", "egg"] },
          { name: "Mushroom & halloumi burger", price: 1050, tags: ["vegetarian"], allergens: ["gluten", "milk"] },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Fries", price: 390, tags: ["vegan"], groups: [{ name: "Dip", min: 0, max: 2, options: [["Ketchup", 50], ["Garlic mayo", 80], ["Truffle mayo", 120]] }] },
          { name: "Loaded cheese fries", price: 650, tags: ["vegetarian"], allergens: ["milk"] },
        ],
      },
      drinks,
    ],
  },
  {
    slug: "curry-haus-ganesha",
    name: "Curry Haus Ganesha",
    description: "North Indian curries and tandoor breads.",
    cuisines: ["Indian"],
    street: "Seckenheimer Straße 40",
    offset: [-1.1, 1.6],
    rating: 4.4,
    ratingCount: 530,
    coverHue: 36,
    hours: [2, 3, 4, 5, 6, 0].flatMap((day) => [{ day, open: "17:00", close: "22:30" }]),
    prepMinutes: 20,
    zones: [{ radiusKm: 5, deliveryFee: 200, minOrder: 2000, etaMin: 40, etaMax: 55 }],
    categories: [
      {
        name: "Curries",
        items: [
          { name: "Butter chicken", price: 1390, allergens: ["milk", "nuts"], groups: [{ name: "Rice", min: 1, max: 1, options: [["Basmati rice"], ["Jeera rice", 100], ["No rice", -150]] }] },
          { name: "Chana masala", price: 1090, tags: ["vegan"], groups: [{ name: "Rice", min: 1, max: 1, options: [["Basmati rice"], ["No rice", -150]] }] },
          { name: "Palak paneer", price: 1250, tags: ["vegetarian"], allergens: ["milk"] },
        ],
      },
      { name: "Breads", items: [{ name: "Garlic naan", price: 390, allergens: ["gluten", "milk"] }] },
    ],
  },
  {
    slug: "falafel-freunde",
    name: "Falafel Freunde",
    description: "Falafel, hummus and fresh salads. Fully vegetarian.",
    cuisines: ["Middle Eastern", "Vegetarian"],
    street: "Mittelstraße 7",
    offset: [2.2, 0.2],
    rating: 4.8,
    ratingCount: 7,
    coverHue: 95,
    hours: everyDay("10:00", "21:00"),
    prepMinutes: 10,
    zones: [{ radiusKm: 4, deliveryFee: 0, minOrder: 1000, etaMin: 20, etaMax: 30 }],
    categories: [
      {
        name: "Wraps & plates",
        items: [
          { name: "Falafel wrap", price: 690, tags: ["vegan"], allergens: ["gluten", "sesame"], groups: [{ name: "Sauce", min: 1, max: 2, options: [["Tahini"], ["Garlic"], ["Hot sauce"]] }] },
          { name: "Hummus plate", price: 950, tags: ["vegan"], allergens: ["sesame"] },
        ],
      },
    ],
  },
  {
    slug: "sushi-kaze",
    name: "Sushi Kaze",
    description: "Maki, nigiri and poke bowls.",
    cuisines: ["Japanese", "Sushi"],
    street: "Augustaanlage 30",
    offset: [-2.5, 2.4],
    rating: 4.3,
    ratingCount: 320,
    coverHue: 200,
    hours: everyDay("12:00", "22:00"),
    prepMinutes: 20,
    zones: [{ radiusKm: 7, deliveryFee: 350, minOrder: 2500, etaMin: 45, etaMax: 60 }],
    categories: [
      {
        name: "Bowls",
        items: [
          { name: "Salmon poke bowl", price: 1390, allergens: ["fish", "soy", "sesame"], groups: [{ name: "Base", min: 1, max: 1, options: [["Sushi rice"], ["Mixed greens"]] }, { name: "Toppings", min: 0, max: 3, options: [["Avocado", 150], ["Mango", 100], ["Edamame", 100]] }] },
        ],
      },
      {
        name: "Rolls",
        items: [
          { name: "Avocado maki (8)", price: 590, tags: ["vegan"], allergens: ["soy", "sesame"] },
          { name: "Crunchy salmon roll (8)", price: 1190, allergens: ["fish", "gluten", "egg"] },
        ],
      },
    ],
  },
  {
    slug: "pide-salonu-neckarstadt",
    name: "Pide Salonu Neckarstadt",
    description: "Black Sea style pide from the stone oven.",
    cuisines: ["Turkish"],
    street: "Mittelstraße 88",
    offset: [3.1, 0.9],
    rating: 4.6,
    ratingCount: 180,
    coverHue: 22,
    hours: [1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "11:00", close: "21:00" })),
    prepMinutes: 15,
    zones: [{ radiusKm: 5, deliveryFee: 150, minOrder: 1500, etaMin: 30, etaMax: 40 }],
    categories: [
      {
        name: "Pide",
        items: [
          { name: "Kıymalı pide", price: 1090, description: "Minced beef, onion, pepper", allergens: ["gluten"], groups: [{ name: "Extras", min: 0, max: 2, options: [["Egg on top", 100], ["Extra cheese", 150]] }] },
          { name: "Kuşbaşılı pide", price: 1290, description: "Diced beef, tomato, pepper", allergens: ["gluten"] },
          { name: "Peynirli pide", price: 990, tags: ["vegetarian"], allergens: ["gluten", "milk"] },
        ],
      },
      drinks,
    ],
  },
];

async function main() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.restaurant.deleteMany(),
  ]);

  for (const r of restaurants) {
    await prisma.restaurant.create({
      data: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        cuisines: r.cuisines,
        street: r.street,
        city: "Mannheim",
        lat: DEMO_CENTER.lat + r.offset[0] * KM_LAT,
        lng: DEMO_CENTER.lng + r.offset[1] * KM_LNG,
        rating: r.rating,
        ratingCount: r.ratingCount,
        coverHue: r.coverHue,
        openingHours: r.hours as unknown as Prisma.InputJsonValue,
        prepMinutes: r.prepMinutes,
        zones: { create: r.zones },
        promotions: { create: (r.promotions ?? []).map((p) => ({ ...p, minSubtotal: p.minSubtotal ?? 0 })) },
        categories: { create: menu(r.categories) },
      },
    });
  }
  console.log(`Seeded ${restaurants.length} restaurants around Mannheim.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

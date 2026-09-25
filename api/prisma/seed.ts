import { prisma } from "../src/shared/prisma";

const DEFAULT_STOCK_QUANTITY = 10;
const OUT_OF_STOCK_SLUGS = ["chocolate-brownie"];

type CategorySeed = {
  name: string;
  slug: string;
  position: number;
  products: Array<{
    name: string;
    slug: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    position: number;
  }>;
};

const categories: CategorySeed[] = [
  {
    name: "Fried Snacks",
    slug: "fried-snacks",
    position: 1,
    products: [
      {
        name: "Coxinha",
        slug: "coxinha",
        description: "Fried dough filled with shredded chicken.",
        price: 650,
        imageUrl: null,
        position: 1,
      },
      {
        name: "Cheese Bun",
        slug: "cheese-bun",
        description: "Warm baked cheese bread roll.",
        price: 500,
        imageUrl: null,
        position: 2,
      },
      {
        name: "Beef Empanada",
        slug: "beef-empanada",
        description: "Fried pastry filled with seasoned beef.",
        price: 700,
        imageUrl: null,
        position: 3,
      },
    ],
  },
  {
    name: "Sandwiches",
    slug: "sandwiches",
    position: 2,
    products: [
      {
        name: "Hot Dog",
        slug: "hot-dog",
        description: "Sausage, potato sticks, and sauces on a bun.",
        price: 1200,
        imageUrl: null,
        position: 1,
      },
      {
        name: "Cheeseburger",
        slug: "cheeseburger",
        description: "Beef patty, cheese, lettuce, and mayo.",
        price: 1500,
        imageUrl: null,
        position: 2,
      },
      {
        name: "Chicken Sandwich",
        slug: "chicken-sandwich",
        description: "Crispy chicken fillet with house sauce.",
        price: 1400,
        imageUrl: null,
        position: 3,
      },
    ],
  },
  {
    name: "Sweets",
    slug: "sweets",
    position: 3,
    products: [
      {
        name: "Pudim",
        slug: "pudim",
        description: "Classic milk flan with caramel syrup.",
        price: 700,
        imageUrl: null,
        position: 1,
      },
      {
        name: "Chocolate Brownie",
        slug: "chocolate-brownie",
        description: "Fudgy brownie with chocolate chunks.",
        price: 600,
        imageUrl: null,
        position: 2,
      },
    ],
  },
  {
    name: "Drinks",
    slug: "drinks",
    position: 4,
    products: [
      {
        name: "Bottled Water",
        slug: "bottled-water",
        description: "500ml bottle.",
        price: 250,
        imageUrl: null,
        position: 1,
      },
      {
        name: "Cola",
        slug: "cola",
        description: "330ml can, served cold.",
        price: 300,
        imageUrl: null,
        position: 2,
      },
      {
        name: "Lemonade",
        slug: "lemonade",
        description: "Freshly squeezed, 400ml.",
        price: 400,
        imageUrl: null,
        position: 3,
      },
    ],
  },
];

const run = async () => {
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        position: category.position,
      },
      update: {
        name: category.name,
        position: category.position,
      },
    });

    for (const product of category.products) {
      const createdProduct = await prisma.product.upsert({
        where: { slug: product.slug },
        create: {
          ...product,
          categoryId: created.id,
        },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          position: product.position,
          categoryId: created.id,
        },
      });

      const quantity = OUT_OF_STOCK_SLUGS.includes(product.slug)
        ? 0
        : DEFAULT_STOCK_QUANTITY;

      await prisma.inventory.upsert({
        where: { productId: createdProduct.id },
        create: { productId: createdProduct.id, quantity },
        update: { quantity },
      });
    }
  }
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

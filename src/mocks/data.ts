import type { Category, Product, Review } from "@/types";

/** Demo catalogue used when VITE_MOCK=true, so the storefront can be shown without the API or database. */

/** Real photos live in public/mock/products/<id>.jpg (lead images from Wikipedia articles; see public/mock/CREDITS.md). */
const photo = (id: number) => `/mock/products/${id}.jpg`;

const CATS: [number, string, string, number][] = [
  [1, "Vegetables", "Fresh seasonal vegetables picked this morning.", 100],
  [2, "Fruits", "Orchard fruit, ripened on the tree.", 20],
  [3, "Dairy", "Milk, curd and ghee from small farms.", 210],
  [4, "Grains", "Rice, wheat and millets, stone-milled or whole.", 40],
  [5, "Meat", "Farm-reared poultry and goat, cut to order.", 8],
  [6, "Honey", "Raw, unprocessed honey from local apiaries.", 45],
  [7, "Eggs", "Free-range eggs, collected daily.", 30],
  [8, "Herbs", "Fragrant herbs and greens by the bunch.", 140],
  [9, "Nuts", "Shelled and in-shell nuts and dry fruit.", 28],
  [10, "Oils", "Cold-pressed oils and desi ghee.", 55],
];

const SELLERS = [
  ["f1", "Green Valley Farms"], ["f2", "Sharma Organics"], ["f3", "Kaveri Orchards"], ["f4", "Himalayan Dairy Co-op"],
  ["f5", "Patel Agro"], ["f6", "Sunrise Apiary"],
] as const;

type P = [name: string, cat: number, price: number, unit: string, stock: number, seller: number, type: string | null, emoji: string, rating: number, reviews: number, desc: string];
const PRODUCTS: P[] = [
  ["Fresh Tomatoes", 1, 38, "kg", 120, 0, "Organic", "🍅", 4.6, 42, "Vine-ripened tomatoes, firm and juicy. Great for curries, salads and chutneys."],
  ["Onions", 1, 32, "kg", 300, 4, "Traditional", "🧅", 4.3, 28, "Sun-cured red onions with a strong flavour and a long shelf life."],
  ["Potatoes", 1, 28, "kg", 250, 4, "Traditional", "🥔", 4.4, 35, "All-purpose potatoes, hand-sorted and dirt-brushed."],
  ["Carrots", 1, 45, "kg", 80, 0, "Organic", "🥕", 4.7, 31, "Sweet, crunchy carrots pulled the same day they are packed."],
  ["Green Chillies", 1, 60, "kg", 40, 1, "Organic", "🌶️", 4.2, 14, "Medium-hot chillies, perfect for tadka and pickles."],
  ["Fresh Spinach", 1, 25, "bunch", 60, 1, "Organic", "🥬", 4.5, 22, "Tender spinach leaves, washed and bunched."],
  ["Cauliflower", 1, 40, "piece", 8, 0, "Hybrid", "🥦", 4.1, 9, "Compact white heads, trimmed and ready to cook."],
  ["Sweet Corn", 1, 20, "piece", 150, 4, "Hybrid", "🌽", 4.4, 17, "Juicy sweet corn cobs, ideal for roasting."],
  ["Alphonso Mangoes", 2, 450, "dozen", 45, 2, "Traditional", "🥭", 4.9, 120, "Ratnagiri-style Alphonsos, carbide-free and tree-ripened."],
  ["Bananas", 2, 55, "dozen", 90, 2, "Traditional", "🍌", 4.5, 64, "Yelakki bananas, small and sweet."],
  ["Kashmiri Apples", 2, 180, "kg", 70, 3, "Traditional", "🍎", 4.6, 53, "Crisp, red apples from high-altitude orchards."],
  ["Watermelon", 2, 30, "kg", 200, 2, "Hybrid", "🍉", 4.3, 26, "Seedless, deep red and very sweet."],
  ["Pomegranate", 2, 160, "kg", 9, 2, "Traditional", "🍎", 4.8, 38, "Ruby-red arils, easy to deseed."],
  ["Fresh Strawberries", 2, 120, "piece", 25, 3, "Organic", "🍓", 4.6, 19, "Pack of 250 g. Picked ripe, best eaten within two days."],
  ["Lemons", 2, 90, "kg", 55, 1, "Organic", "🍋", 4.2, 12, "Thin-skinned, juicy lemons."],
  ["A2 Cow Milk", 3, 70, "liter", 60, 3, "Traditional", "🥛", 4.8, 88, "Fresh A2 milk from grass-fed desi cows, delivered the same morning."],
  ["Farm Curd", 3, 85, "kg", 35, 3, "Traditional", "🥣", 4.5, 33, "Thick set curd made with whole milk."],
  ["Paneer", 3, 360, "kg", 20, 3, "Traditional", "🧀", 4.7, 41, "Soft, fresh paneer pressed the same day."],
  ["Desi Ghee", 3, 650, "jar", 30, 3, "Traditional", "🫙", 4.9, 76, "Bilona-method ghee, 500 ml glass jar."],
  ["Basmati Rice", 4, 120, "kg", 400, 4, "Traditional", "🍚", 4.5, 59, "Aged long-grain basmati that cooks up fluffy."],
  ["Whole Wheat Atta", 4, 48, "kg", 500, 4, "Traditional", "🌾", 4.4, 47, "Stone-ground chakki atta, no maida."],
  ["Ragi (Finger Millet)", 4, 75, "kg", 120, 1, "Organic", "🌾", 4.6, 21, "Whole ragi grain, rich in calcium."],
  ["Toor Dal", 4, 150, "kg", 90, 4, "Traditional", "🫘", 4.3, 30, "Unpolished toor dal, cleaned and sorted."],
  ["Country Chicken", 5, 420, "kg", 25, 0, "Traditional", "🍗", 4.4, 18, "Free-range desi chicken, cleaned and cut on request."],
  ["Goat Meat", 5, 780, "kg", 15, 0, "Traditional", "🥩", 4.5, 11, "Fresh-cut goat, curry cut."],
  ["Wild Forest Honey", 6, 520, "jar", 40, 5, "Wild", "🍯", 4.9, 97, "Raw, unheated forest honey, 500 g jar."],
  ["Multiflora Honey", 6, 340, "jar", 60, 5, "Organic", "🍯", 4.6, 44, "Mild, golden honey from mixed blossoms, 500 g."],
  ["Jamun Honey", 6, 450, "jar", 6, 5, "Wild", "🍯", 4.7, 15, "Dark, slightly astringent honey, 250 g."],
  ["Free-range Eggs", 7, 96, "dozen", 80, 0, "Organic", "🥚", 4.7, 69, "Brown eggs from hens that roam, collected daily."],
  ["Country Eggs (Tray of 30)", 7, 230, "piece", 20, 4, "Traditional", "🥚", 4.5, 24, "Desi hen eggs, tray of 30."],
  ["Fresh Coriander", 8, 15, "bunch", 100, 1, "Organic", "🌿", 4.6, 36, "Fragrant coriander with roots on."],
  ["Mint Leaves", 8, 15, "bunch", 70, 1, "Organic", "🌱", 4.5, 20, "Cool, fresh pudina bunches."],
  ["Curry Leaves", 8, 10, "bunch", 90, 1, "Organic", "🍃", 4.7, 27, "Aromatic curry leaves, picked fresh."],
  ["Tulsi", 8, 20, "bunch", 40, 1, "Organic", "🌿", 4.4, 8, "Holy basil, grown without sprays."],
  ["Almonds", 9, 780, "kg", 50, 4, "Traditional", "🥜", 4.7, 52, "Premium California-grade almonds, shelled."],
  ["Walnuts", 9, 920, "kg", 30, 3, "Traditional", "🌰", 4.6, 29, "Kashmiri walnut kernels, light halves."],
  ["Roasted Peanuts", 9, 140, "kg", 100, 4, "Traditional", "🥜", 4.3, 33, "Crunchy, lightly salted groundnuts."],
  ["Cold-pressed Groundnut Oil", 10, 280, "liter", 45, 4, "Traditional", "🫒", 4.6, 40, "Wood-pressed (kachi ghani) groundnut oil."],
  ["Cold-pressed Coconut Oil", 10, 360, "liter", 38, 2, "Organic", "🥥", 4.7, 35, "Virgin coconut oil, pressed at low heat."],
  ["Mustard Oil", 10, 240, "liter", 0, 4, "Traditional", "🫒", 4.5, 22, "Pungent kachi ghani mustard oil."],
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const MOCK_PRODUCTS: Product[] = PRODUCTS.map((p, i) => {
  const [name, categoryId, price, unit, quantityAvailable, s, productionType, , rating, reviews, description] = p;
  return {
    id: i + 1, name, description, price, unit, quantityAvailable, inStock: quantityAvailable > 0,
    categoryId, categoryName: CATS.find((c) => c[0] === categoryId)![1],
    sellerId: SELLERS[s][0], sellerName: SELLERS[s][1], productionType,
    imageUrl: photo(i + 1), mrp: i % 3 === 1 ? null : Math.ceil(price * (1.08 + (i % 4) * 0.05)), rating, reviews, created_at: daysAgo(PRODUCTS.length - i),
  };
});

export const MOCK_CATEGORIES: Category[] = CATS.map(([id, name, description]) => ({
  id, name, description, imageUrl: MOCK_PRODUCTS.find((p) => p.categoryId === id)?.imageUrl ?? undefined,
  productCount: MOCK_PRODUCTS.filter((p) => p.categoryId === id).length,
}));

const REVIEWERS = ["Priya S.", "Rahul M.", "Anita K.", "Vikram P.", "Meera R.", "Suresh N.", "Divya T."];
const COMMENTS: Record<number, string> = {
  5: "Excellent quality, tasted like it came straight from the farm. Will order again.",
  4: "Fresh and well packed. Delivery was on time.",
  3: "Decent, a few pieces were smaller than expected.",
};
export const mockReviews = (productId: number): Review[] => {
  const p = MOCK_PRODUCTS.find((x) => x.id === productId);
  if (!p || p.reviews === 0) return [];
  return Array.from({ length: Math.min(p.reviews, 6) }, (_, i) => {
    const r = i === 5 ? 3 : p.rating >= 4.6 && i % 3 !== 2 ? 5 : 4;
    return { id: productId * 100 + i, productId, reviewerName: REVIEWERS[(productId + i) % REVIEWERS.length], rating: r, comment: COMMENTS[r], created_at: daysAgo(3 + i * 5) };
  });
};

export const TERRAINS = [
  { type: "Plain", crops: "Wheat, Corn, Soybeans", practices: "Use crop rotation and maintain soil pH." },
  { type: "Hills", crops: "Tea, Coffee, Fruits", practices: "Terrace farming to prevent erosion." },
  { type: "Drylands", crops: "Millet, Sorghum, Cactus", practices: "Drought-resistant crops and water harvesting." },
  { type: "Wetlands", crops: "Rice, Cranberries, Taro", practices: "Manage water levels and use raised beds." },
  { type: "Mountainous", crops: "Potatoes, Barley, Herbs", practices: "Slope management and erosion control." },
  { type: "Coastal", crops: "Coconuts, Spinach, Salicornia", practices: "Salt-tolerant crops and wind protection." },
] as const;

export const terrainInfo = (type?: string | null) => TERRAINS.find((t) => t.type === type);

export const fetchCategories = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/categories");
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

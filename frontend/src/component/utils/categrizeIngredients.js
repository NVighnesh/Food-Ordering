export const categorizeIngredients = (Ingredients) => {
  return Ingredients.reduce((acc, ingredient) => {
    const { category } = ingredient;
    if (!category || !category.name) return acc;
    if (!acc[category.name]) {
      acc[category.name] = [];
    }
    acc[category.name].push(ingredient);
    return acc;
  }, {});
};

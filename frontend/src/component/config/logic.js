export const isPresentInFavorites = (favorites, restaurant) => {
    try {
        if (!favorites) return false;
        // Normalize favorites to an array if possible
        const arr = Array.isArray(favorites) ? favorites : (favorites.favorites && Array.isArray(favorites.favorites) ? favorites.favorites : []);
        if (!Array.isArray(arr) || arr.length === 0) return false;
        if (!restaurant) return false;
        const targetId = restaurant.id || restaurant._id || restaurant.restaurantId || restaurant.foodId || null;
        if (!targetId) return false;
        return arr.some(item => {
            const id = item && (item.id || item._id || item.restaurantId || item.foodId || null);
            return id != null && id.toString() === targetId.toString();
        });
    } catch (e) {
        // defensive fallback
        return false;
    }
};
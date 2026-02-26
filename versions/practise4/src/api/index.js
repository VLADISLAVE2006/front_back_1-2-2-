import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
    }
});

export const api = {
    // Товары
    getProducts: async () => {
        try {
            const response = await apiClient.get("/products");
            return response.data.data; // ✅ Берем data.data (из-за обертки { success: true, data: [...] })
        } catch (error) {
            console.error('Ошибка получения товаров:', error);
            return []; // Возвращаем пустой массив в случае ошибки
        }
    },
    
    getProductById: async (id) => {
        try {
            const response = await apiClient.get(`/products/${id}`);
            return response.data.data; // ✅ Берем data.data
        } catch (error) {
            console.error('Ошибка получения товара:', error);
            throw error;
        }
    },
    
    getProductsByCategory: async (category) => {
        try {
            const response = await apiClient.get(`/products/category/${category}`);
            return response.data.data; // ✅ Берем data.data
        } catch (error) {
            console.error('Ошибка получения товаров по категории:', error);
            return [];
        }
    },
    
    searchProducts: async (query) => {
        try {
            const response = await apiClient.get(`/search?q=${query}`);
            return response.data.data; // ✅ Берем data.data
        } catch (error) {
            console.error('Ошибка поиска:', error);
            return [];
        }
    },
    
    // Корзина
    getCart: async () => {
        try {
            const response = await apiClient.get("/cart");
            return response.data.data; // ✅ Берем data.data
        } catch (error) {
            console.error('Ошибка получения корзины:', error);
            return [];
        }
    },
    
    addToCart: async (productId, quantity = 1) => {
        try {
            const response = await apiClient.post("/cart", { productId, quantity });
            return response.data.data;
        } catch (error) {
            console.error('Ошибка добавления в корзину:', error);
            throw error;
        }
    },
    
    updateCartItem: async (productId, quantity) => {
        try {
            const response = await apiClient.put(`/cart/${productId}`, { quantity });
            return response.data.data;
        } catch (error) {
            console.error('Ошибка обновления корзины:', error);
            throw error;
        }
    },
    
    removeFromCart: async (productId) => {
        try {
            const response = await apiClient.delete(`/cart/${productId}`);
            return response.data.data;
        } catch (error) {
            console.error('Ошибка удаления из корзины:', error);
            throw error;
        }
    },
    
    clearCart: async () => {
        try {
            const response = await apiClient.delete("/cart");
            return response.data;
        } catch (error) {
            console.error('Ошибка очистки корзины:', error);
            throw error;
        }
    },

    // Категории
    getCategories: async () => {
        try {
            const response = await apiClient.get("/categories");
            return response.data.data; // ✅ Берем data.data
        } catch (error) {
            console.error('Ошибка получения категорий:', error);
            return [];
        }
    },

    // Статистика
    getStats: async () => {
        try {
            const response = await apiClient.get("/stats");
            return response.data.data;
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return null;
        }
    },

    // Популярные товары
    getPopularProducts: async (limit = 5) => {
        try {
            const response = await apiClient.get(`/products/popular/${limit}`);
            return response.data.data;
        } catch (error) {
            console.error('Ошибка получения популярных товаров:', error);
            return [];
        }
    },

    // Товары в наличии
    getInStockProducts: async () => {
        try {
            const response = await apiClient.get("/products/in-stock");
            return response.data.data;
        } catch (error) {
            console.error('Ошибка получения товаров в наличии:', error);
            return [];
        }
    }
};
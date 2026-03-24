import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    }
});

export const api = {
    getProducts: async () => {
        const response = await apiClient.get("/products");
        return response.data;
    },
    
    getProductsByCategory: async (category) => {
        const response = await apiClient.get(`/products/category/${category}`);
        return response.data;
    },
    
    searchProducts: async (query) => {
        const response = await apiClient.get(`/search?q=${query}`);
        return response.data;
    }
};
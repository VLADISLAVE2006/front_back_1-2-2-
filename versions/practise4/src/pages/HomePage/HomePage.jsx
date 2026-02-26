import React, { useState, useEffect } from 'react';
import ProductList from '../../components/ProductList/ProductList';
import { api } from '../../api';
import './HomePage.scss';

const HomePage = ({ onAddToCart, searchQuery, selectedCategory }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('default');

    useEffect(() => {
        loadProducts();
    }, [searchQuery, selectedCategory]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            let data = [];

            if (searchQuery) {
                data = await api.searchProducts(searchQuery);
            } else if (selectedCategory) {
                data = await api.getProductsByCategory(selectedCategory);
            } else {
                data = await api.getProducts();
            }

            // Убедимся, что data - это массив
            setProducts(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError('Ошибка загрузки товаров');
            console.error(err);
            setProducts([]); // Пустой массив при ошибке
        } finally {
            setLoading(false);
        }
    };

    const sortProducts = (products) => {
        if (!Array.isArray(products)) return [];
        
        switch (sortBy) {
            case 'price-asc':
                return [...products].sort((a, b) => a.price - b.price);
            case 'price-desc':
                return [...products].sort((a, b) => b.price - a.price);
            case 'rating':
                return [...products].sort((a, b) => b.rating - a.rating);
            default:
                return products;
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            await api.addToCart(productId);
            onAddToCart?.();
        } catch (err) {
            alert('Ошибка добавления в корзину');
        }
    };

    const sortedProducts = sortProducts(products);

    if (loading) return (
        <div className="loading">
            <div className="loading__spinner"></div>
            <p>Загрузка товаров...</p>
        </div>
    );

    if (error) return (
        <div className="error">
            <p>❌ {error}</p>
            <button onClick={loadProducts} className="error__retry">
                Повторить попытку
            </button>
        </div>
    );

    return (
        <div className="home-page">
            <div className="home-page__header">
                <h1 className="home-page__title">
                    {searchQuery ? `Результаты поиска: "${searchQuery}"` : 
                     selectedCategory ? `Категория: ${selectedCategory}` : 
                     'Все товары'}
                </h1>
                
                <div className="home-page__sort">
                    <label htmlFor="sort">Сортировать:</label>
                    <select 
                        id="sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="home-page__sort-select"
                    >
                        <option value="default">По умолчанию</option>
                        <option value="price-asc">Цена: по возрастанию</option>
                        <option value="price-desc">Цена: по убыванию</option>
                        <option value="rating">По рейтингу</option>
                    </select>
                </div>
            </div>

            <ProductList 
                products={sortedProducts}
                onAddToCart={handleAddToCart}
            />
        </div>
    );
};

export default HomePage;
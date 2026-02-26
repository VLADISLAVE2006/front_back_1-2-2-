import React, { useState, useEffect } from 'react';
import ProductList from '../../components/ProductList/ProductList';
import { api } from '../../api';
import './HomePage.scss';

const HomePage = ({ onAddToCart, searchQuery, selectedCategory }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Ошибка загрузки товаров');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="home-page">
            <div className="home-page__header">
                <h1 className="home-page__title">
                    {searchQuery ? `Результаты поиска: "${searchQuery}"` : 
                     selectedCategory ? `Категория: ${selectedCategory}` : 
                     'Все товары'}
                </h1>
            </div>

            <ProductList 
                products={products}
                onAddToCart={onAddToCart}
            />
        </div>
    );
};

export default HomePage;
import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Main({ user }) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [search, category, products]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            showNotification('Ошибка загрузки товаров', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];

        if (search) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        setFilteredProducts(filtered);
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="container">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <section className="hero">
                <h2>Военное снаряжение высшего качества</h2>
                <p>Только проверенная экипировка для выполнения любых задач</p>
            </section>

            <section className="filters">
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Все категории</option>
                    <option value="Бронезащита">Бронезащита</option>
                    <option value="Защита головы">Защита головы</option>
                    <option value="Амуниция">Амуниция</option>
                    <option value="Экипировка">Экипировка</option>
                </select>
            </section>

            {filteredProducts.length === 0 ? (
                <div className="no-products">
                    Товары не найдены
                </div>
            ) : (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-card">
                            <div className="product-info">
                                <h3 className="product-title">{product.title}</h3>
                                <div className="product-category">{product.category}</div>
                                <p className="product-description">{product.description}</p>
                                <div className="product-price">{product.price.toLocaleString()} ₽</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Main;
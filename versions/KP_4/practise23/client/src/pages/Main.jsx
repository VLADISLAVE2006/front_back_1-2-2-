import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Main({ user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
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
            <div className="main-page">
                <h1>Добро пожаловать в ВоенТорг, {user?.first_name}!</h1>
                <div className="products-grid">
                    {products.map(product => (
                        <div key={product.id} className="admin-product-card">
                            {product.image && (
                                <img 
                                    src={`http://localhost:3001${product.image}`}
                                    alt={product.title}
                                    style={{ 
                                        width: '100%', 
                                        height: '150px', 
                                        objectFit: 'cover',
                                        borderRadius: '5px',
                                        marginBottom: '10px'
                                    }}
                                    onError={(e) => {
                                        e.target.src = '/uploads/placeholder-default.jpg';
                                    }}
                                />
                            )}
                            <h4>{product.title}</h4>
                            <div className="product-category">{product.category}</div>
                            <p className="product-description">{product.description}</p>
                            <div className="price">{product.price.toLocaleString()} ₽</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Main;
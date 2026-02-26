import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import './ProductPage.scss';

const ProductPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const data = await api.getProductById(id);
            setProduct(data);
            setError(null);
        } catch (err) {
            setError('Товар не найден');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        try {
            await api.addToCart(product.id, quantity);
            setAddedToCart(true);
            onAddToCart?.();
            
            setTimeout(() => {
                setAddedToCart(false);
            }, 3000);
        } catch (err) {
            alert('Ошибка добавления в корзину');
        }
    };

    const handleQuantityChange = (delta) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
            setQuantity(newQuantity);
        }
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return (
            <>
                {'★'.repeat(fullStars)}
                {halfStar && '½'}
                {'☆'.repeat(emptyStars)}
            </>
        );
    };

    if (loading) return (
        <div className="product-page__loading">
            <div className="loading__spinner"></div>
            <p>Загрузка товара...</p>
        </div>
    );

    if (error || !product) return (
        <div className="product-page__error">
            <h2>❌ {error || 'Товар не найден'}</h2>
            <button onClick={() => navigate('/')} className="product-page__back-btn">
                Вернуться на главную
            </button>
        </div>
    );

    return (
        <div className="product-page">
            <button onClick={() => navigate(-1)} className="product-page__back-btn">
                ← Назад
            </button>

            <div className="product-page__content">
                <div className="product-page__gallery">
                    <div className="product-page__main-image">
                        {product.image ? (
                            <img src={product.image} alt={product.name} />
                        ) : (
                            <div className="product-page__image-placeholder">📦</div>
                        )}
                    </div>
                </div>

                <div className="product-page__info">
                    <span className="product-page__category">{product.category}</span>
                    <h1 className="product-page__name">{product.name}</h1>
                    
                    <div className="product-page__rating">
                        <span className="product-page__stars">
                            {renderStars(product.rating)}
                        </span>
                        <span className="product-page__rating-value">
                            {product.rating} / 5
                        </span>
                    </div>

                    <div className="product-page__price-block">
                        <div className="product-page__price">
                            {product.price.toLocaleString()} ₽
                        </div>
                        <div className={`product-page__stock ${product.stock === 0 ? 'product-page__stock--out' : ''}`}>
                            {product.stock > 0 
                                ? `В наличии: ${product.stock} шт.` 
                                : 'Нет в наличии'}
                        </div>
                    </div>

                    <div className="product-page__description">
                        <h3>Описание:</h3>
                        <p>{product.description}</p>
                    </div>

                    {product.stock > 0 && (
                        <div className="product-page__actions">
                            <div className="product-page__quantity">
                                <button 
                                    className="product-page__quantity-btn"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                >−</button>
                                <span className="product-page__quantity-value">
                                    {quantity}
                                </span>
                                <button 
                                    className="product-page__quantity-btn"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={quantity >= product.stock}
                                >+</button>
                            </div>

                            <button 
                                className={`product-page__add-btn ${addedToCart ? 'product-page__add-btn--added' : ''}`}
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                {addedToCart ? '✓ Добавлено' : 'Добавить в корзину'}
                            </button>
                        </div>
                    )}

                    {product.stock === 0 && (
                        <div className="product-page__out-of-stock">
                            Товар временно отсутствует
                        </div>
                    )}

                    <div className="product-page__details">
                        <h3>Характеристики:</h3>
                        <ul className="product-page__details-list">
                            <li><span>Артикул:</span> {product.id}</li>
                            <li><span>Категория:</span> {product.category}</li>
                            <li><span>Рейтинг:</span> {product.rating}</li>
                            <li><span>Доступно:</span> {product.stock} шт.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
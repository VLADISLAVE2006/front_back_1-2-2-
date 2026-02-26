import React from 'react';
import './ProductCard.scss';

const ProductCard = ({ product, onAddToCart }) => {
    const { id, name, category, description, price, stock, rating } = product;

    return (
        <div className="product-card">
            <div className="product-card__content">
                <span className="product-card__category">{category}</span>
                <h3 className="product-card__title">{name}</h3>
                <p className="product-card__description">{description}</p>
                <div className="product-card__rating">
                    <span className="product-card__rating-stars">
                        {'★'.repeat(Math.floor(rating))}
                        {'☆'.repeat(5 - Math.floor(rating))}
                    </span>
                    <span className="product-card__rating-value">{rating}</span>
                </div>
                <div className="product-card__price-row">
                    <span className="product-card__price">{price.toLocaleString()} ₽</span>
                    <span className={`product-card__stock ${stock === 0 ? 'product-card__stock--out' : ''}`}>
                        {stock > 0 ? `В наличии: ${stock}` : 'Нет в наличии'}
                    </span>
                </div>
                <button 
                    className="product-card__button"
                    onClick={() => onAddToCart(id)}
                    disabled={stock === 0}
                >
                    {stock > 0 ? 'В корзину' : 'Нет в наличии'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
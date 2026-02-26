import React from 'react';
import './ProductCard.scss';

const ProductCard = ({ product, onAddToCart }) => {
    const { id, name, category, description, price, stock, rating, image } = product;

    const handleAddToCart = () => {
        onAddToCart(id);
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

    return (
        <div className="product-card">
            <div className="product-card__image">
                {image ? (
                    <img src={image} alt={name} />
                ) : (
                    <div className="product-card__image-placeholder">📦</div>
                )}
            </div>
            <div className="product-card__content">
                <span className="product-card__category">{category}</span>
                <h3 className="product-card__title">{name}</h3>
                <p className="product-card__description">{description}</p>
                <div className="product-card__rating">
                    <span className="product-card__rating-stars">
                        {renderStars(rating)}
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
                    onClick={handleAddToCart}
                    disabled={stock === 0}
                >
                    {stock > 0 ? 'В корзину' : 'Нет в наличии'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
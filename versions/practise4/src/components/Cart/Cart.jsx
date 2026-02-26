import React from 'react';
import './Cart.scss';

const Cart = ({ items, products, onUpdateQuantity, onRemove, onClear }) => {
    const getProduct = (productId) => products.find(p => p.id === productId);

    const total = items.reduce((sum, item) => {
        const product = getProduct(item.productId);
        return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    if (items.length === 0) {
        return (
            <div className="cart cart--empty">
                <div className="cart__empty-icon">🛒</div>
                <h2>Корзина пуста</h2>
                <p>Добавьте товары из каталога</p>
            </div>
        );
    }

    return (
        <div className="cart">
            <div className="cart__header">
                <h2 className="cart__title">Корзина ({totalItems} товара)</h2>
                <button className="cart__clear-btn" onClick={onClear}>
                    Очистить корзину
                </button>
            </div>

            <div className="cart__items">
                {items.map(item => {
                    const product = getProduct(item.productId);
                    if (!product) return null;

                    return (
                        <div key={item.productId} className="cart__item">
                            {/* Убрали блок с изображением */}
                            
                            <div className="cart__item-info">
                                <h3 className="cart__item-name">{product.name}</h3>
                                <p className="cart__item-category">{product.category}</p>
                                <p className="cart__item-price">
                                    {product.price.toLocaleString()} ₽
                                </p>
                            </div>

                            <div className="cart__item-quantity">
                                <button 
                                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="cart__quantity-btn"
                                >−</button>
                                <span className="cart__quantity-value">{item.quantity}</span>
                                <button 
                                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                    disabled={item.quantity >= product.stock}
                                    className="cart__quantity-btn"
                                >+</button>
                            </div>

                            <div className="cart__item-total">
                                <span>Сумма:</span>
                                <strong>{(product.price * item.quantity).toLocaleString()} ₽</strong>
                            </div>

                            <button 
                                className="cart__item-remove"
                                onClick={() => onRemove(item.productId)}
                                title="Удалить"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="cart__footer">
                <div className="cart__total-info">
                    <div className="cart__total-row">
                        <span>Товаров:</span>
                        <strong>{totalItems}</strong>
                    </div>
                    <div className="cart__total-row">
                        <span>Сумма:</span>
                        <strong>{total.toLocaleString()} ₽</strong>
                    </div>
                </div>
                
                <button className="cart__checkout-btn">
                    Оформить заказ
                </button>

                <p className="cart__delivery-info">
                    Доставка рассчитывается при оформлении
                </p>
            </div>
        </div>
    );
};

export default Cart;
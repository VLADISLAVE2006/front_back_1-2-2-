import React, { useState, useEffect } from 'react';
import Cart from '../../components/Cart/Cart';
import { api } from '../../api';
import './CartPage.scss';

const CartPage = ({ onCartUpdate }) => {
    const [cartItems, setCartItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cartData, productsData] = await Promise.all([
                api.getCart(),
                api.getProducts()
            ]);
            setCartItems(cartData);
            setProducts(productsData);
        } catch (err) {
            console.error('Ошибка загрузки данных', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId, quantity) => {
        try {
            if (quantity <= 0) {
                await handleRemoveFromCart(productId);
                return;
            }
            await api.updateCartItem(productId, quantity);
            await loadData();
            onCartUpdate?.();
        } catch (err) {
            alert('Ошибка обновления количества');
        }
    };

    const handleRemoveFromCart = async (productId) => {
        try {
            await api.removeFromCart(productId);
            await loadData();
            onCartUpdate?.();
        } catch (err) {
            alert('Ошибка удаления из корзины');
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Очистить корзину?')) {
            try {
                await api.clearCart();
                await loadData();
                onCartUpdate?.();
            } catch (err) {
                alert('Ошибка очистки корзины');
            }
        }
    };

    if (loading) return (
        <div className="loading">
            <div className="loading__spinner"></div>
            <p>Загрузка корзины...</p>
        </div>
    );

    return (
        <div className="cart-page">
            <Cart 
                items={cartItems}
                products={products}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveFromCart}
                onClear={handleClearCart}
            />
        </div>
    );
};

export default CartPage;
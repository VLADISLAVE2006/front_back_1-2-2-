import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import ProductPage from './pages/ProductPage/ProductPage';
import CartPage from './pages/CartPage/CartPage';
import { api } from './api';
import './styles/global.scss';  // ✅ Импорт глобальных стилей
import './App.scss';

function AppContent() {
    const [cartCount, setCartCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadCartCount();
    }, []);

    const loadCartCount = async () => {
        try {
            const cart = await api.getCart();
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(count);
        } catch (err) {
            console.error('Ошибка загрузки корзины', err);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        navigate('/');
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        navigate('/');
    };

    const handleAddToCart = () => {
        loadCartCount();
    };

    const handleCartClick = () => {
        navigate('/cart');
    };

    const handleLogoClick = () => {
        setSearchQuery('');
        setSelectedCategory('');
        navigate('/');
    };

    return (
        <div className="app">
            <Header 
                cartCount={cartCount}
                onSearch={handleSearch}
                onCategoryChange={handleCategoryChange}
                onCartClick={handleCartClick}
                onLogoClick={handleLogoClick}
            />
            
            <main className="app__main">
                <Routes>
                    <Route path="/" element={
                        <HomePage 
                            onAddToCart={handleAddToCart}
                            searchQuery={searchQuery}
                            selectedCategory={selectedCategory}
                        />
                    } />
                    <Route path="/product/:id" element={
                        <ProductPage onAddToCart={handleAddToCart} />
                    } />
                    <Route path="/cart" element={
                        <CartPage onCartUpdate={loadCartCount} />
                    } />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
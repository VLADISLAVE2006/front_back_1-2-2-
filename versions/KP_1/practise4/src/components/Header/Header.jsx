import React, { useState } from 'react';
import './Header.scss';

const Header = ({ cartCount, onSearch, onCategoryChange, onCartClick, onLogoClick }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(searchQuery);
    };

    const categories = [
        'Все',
        'Ноутбуки',
        'Смартфоны',
        'Планшеты',
        'Мониторы',
        'Аксессуары',
        'Хранение',
        'Сеть'
    ];

    return (
        <header className="header">
            <div className="header__logo" onClick={onLogoClick}>
                <h1>🛍️ Shop</h1>
            </div>

            <form className="header__search" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Найти</button>
            </form>

            <div className="header__categories">
                <select 
                    className="header__category-select"
                    onChange={(e) => onCategoryChange(e.target.value === 'Все' ? '' : e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>Выберите категорию</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat === 'Все' ? '' : cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <button className="header__cart-btn" onClick={onCartClick}>
                🛒 Корзина
                {cartCount > 0 && (
                    <span className="header__cart-count">{cartCount}</span>
                )}
            </button>
        </header>
    );
};

export default Header;
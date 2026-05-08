import React from 'react';
import { Link } from 'react-router-dom';

function Header({ user, onLogout }) {
    return (
        <header className="main-header">
            <div className="logo">
                <h1>ВоенТорг</h1>
                <p>Снаряжение для настоящих</p>
            </div>
            <nav className="nav-links">
                <Link to="/">Главная</Link>
                {(user?.role === 'admin' || user?.role === 'seller') && (
                    <Link to="/admin">Управление товарами</Link>
                )}
                {user?.role === 'admin' && (
                    <Link to="/users">Пользователи</Link>
                )}
                <div className="user-info">
                    <span className="user-name">
                        {user?.first_name} {user?.last_name} ({user?.role === 'admin' ? 'Админ' : user?.role === 'seller' ? 'Продавец' : 'Пользователь'})
                    </span>
                    <button onClick={onLogout} className="logout-btn">Выйти</button>
                </div>
            </nav>
        </header>
    );
}

export default Header;
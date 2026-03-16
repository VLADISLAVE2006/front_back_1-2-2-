import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';

function Header({ isAuthenticated, user, setIsAuthenticated, setUser }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login');
    };

    const isAuthPage = location.pathname === '/login';

    return (
        <header>
            <div className="container">
                <h1>⚡ ВоенТорг</h1>
                <nav>
                    {isAuthenticated ? (
                        <>
                            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                                Главная
                            </Link>
                            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                                Админка
                            </Link>
                            <span className="user-name">{user?.first_name} {user?.last_name}</span>
                            <button onClick={handleLogout}>Выход</button>
                        </>
                    ) : (
                        !isAuthPage && (
                            <Link to="/login">Вход</Link>
                        )
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
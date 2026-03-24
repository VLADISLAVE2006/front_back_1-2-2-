import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

function Login({ setIsAuthenticated, setUser }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [regData, setRegData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: ''
    });

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await authService.login(loginData.email, loginData.password);
            setIsAuthenticated(true);
            setUser(data.user);
            showNotification('Успешный вход!', 'success');
            navigate('/');
        } catch (error) {
            showNotification(
                error.response?.data?.error || 'Ошибка входа',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (regData.password !== regData.confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...userData } = regData;
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            
            showNotification('Регистрация успешна! Теперь войдите', 'success');
            setIsLogin(true);
            setLoginData({ email: regData.email, password: '' });
        } catch (error) {
            showNotification(error.message || 'Ошибка регистрации', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setTestCredentials = () => {
        setLoginData({ email: 'admin@military.ru', password: 'admin123' });
    };

    return (
        <div className="container">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="auth-container">
                <div className="auth-tabs">
                    <button 
                        className={`tab-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Вход
                    </button>
                    <button 
                        className={`tab-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Регистрация
                    </button>
                </div>

                {isLogin ? (
                    <div className="auth-form active">
                        <h2>Вход в систему</h2>
                        
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#666', marginBottom: '10px' }}>Тестовый аккаунт:</p>
                            <button 
                                type="button"
                                onClick={setTestCredentials}
                                style={{ margin: '5px', padding: '5px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                                Админ
                            </button>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Пароль:</label>
                                <input
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Вход...' : 'Войти'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="auth-form active">
                        <h2>Регистрация</h2>
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    value={regData.email}
                                    onChange={(e) => setRegData({...regData, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Имя:</label>
                                <input
                                    type="text"
                                    value={regData.first_name}
                                    onChange={(e) => setRegData({...regData, first_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Фамилия:</label>
                                <input
                                    type="text"
                                    value={regData.last_name}
                                    onChange={(e) => setRegData({...regData, last_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Пароль:</label>
                                <input
                                    type="password"
                                    value={regData.password}
                                    onChange={(e) => setRegData({...regData, password: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Подтверждение пароля:</label>
                                <input
                                    type="password"
                                    value={regData.confirmPassword}
                                    onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
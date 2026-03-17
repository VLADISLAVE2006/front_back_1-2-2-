import api from './api';

class AuthService {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    }

    async register(userData) {
        const response = await api.post('/auth/register', userData);
        return response.data;
    }

    async logout() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await api.post('/auth/logout', { refreshToken });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    hasAnyRole(roles) {
        const user = this.getCurrentUser();
        return user && roles.includes(user.role);
    }
}

export default new AuthService();
import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Admin({ user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        price: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            showNotification('Ошибка загрузки товаров', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category: '',
            description: '',
            price: ''
        });
        setEditingProduct(null);
        setShowForm(false);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            title: product.title,
            category: product.category,
            description: product.description,
            price: product.price
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить товар?')) {
            return;
        }

        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
            showNotification('Товар удален', 'success');
        } catch (error) {
            showNotification('Ошибка удаления', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.category || !formData.description || !formData.price) {
            showNotification('Заполните все поля', 'error');
            return;
        }

        try {
            if (editingProduct) {
                const response = await api.put(`/products/${editingProduct.id}`, formData);
                setProducts(products.map(p =>
                    p.id === editingProduct.id ? response.data : p
                ));
                showNotification('Товар обновлен', 'success');
            } else {
                const response = await api.post('/products', formData);
                setProducts([...products, response.data]);
                showNotification('Товар создан', 'success');
            }
            resetForm();
        } catch (error) {
            showNotification(
                error.response?.data?.error || 'Ошибка сохранения',
                'error'
            );
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="container">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <h1 className="admin-title">Панель администратора</h1>

            <section className="admin-panel">
                <div className="admin-header">
                    <h2>Управление товарами</h2>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            resetForm();
                            setShowForm(!showForm);
                        }}
                    >
                        {showForm ? 'Скрыть форму' : '+ Добавить товар'}
                    </button>
                </div>

                {showForm && (
                    <div className="product-form">
                        <h3>{editingProduct ? 'Редактирование товара' : 'Добавление товара'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название:</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Категория:</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Выберите категорию</option>
                                    <option value="Бронезащита">Бронезащита</option>
                                    <option value="Защита головы">Защита головы</option>
                                    <option value="Амуниция">Амуниция</option>
                                    <option value="Экипировка">Экипировка</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Описание:</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Цена (₽):</label>
                                <input
                                    type="number"
                                    name="price"
                                    step="100"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    {editingProduct ? 'Обновить' : 'Создать'}
                                </button>
                                <button type="button" onClick={resetForm} className="btn-secondary">
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="admin-products">
                    {products.map(product => (
                        <div key={product.id} className="admin-product-card">
                            <h4>{product.title}</h4>
                            <div className="product-category">{product.category}</div>
                            <p className="product-description">{product.description}</p>
                            <div className="price">{product.price.toLocaleString()} ₽</div>
                            <div className="admin-product-actions">
                                <button
                                    className="btn-edit"
                                    onClick={() => handleEdit(product)}
                                >
                                    Редактировать
                                </button>
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Admin;
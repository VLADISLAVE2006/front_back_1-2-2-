import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import './ProductPage.scss';

const ProductPage = ({ onAddToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const data = await api.getProductById(id);
            setProduct(data);
            setError(null);
        } catch (err) {
            setError('Товар не найден');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка</div>;

    return (
        <div className="product-page">
            <button onClick={() => navigate(-1)}>Назад</button>
            
            <div className="product-page__info">
                <h1>{product.name}</h1>
                <p>Категория: {product.category}</p>
                <p>Цена: {product.price} ₽</p>
                <p>В наличии: {product.stock}</p>
                <p>Рейтинг: {product.rating}</p>
                <p>{product.description}</p>
            </div>
        </div>
    );
};

export default ProductPage;
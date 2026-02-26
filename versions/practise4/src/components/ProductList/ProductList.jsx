import React from 'react';
import ProductCard from '../ProductCard/ProductCard';
import './ProductList.scss';

const ProductList = ({ products, onAddToCart }) => {
    if (!products || products.length === 0) {
        return (
            <div className="product-list__empty">
                <p>Товары не найдены</p>
            </div>
        );
    }

    return (
        <div className="product-list">
            {products.map(product => (
                <div key={product.id} className="product-list__item">
                    <ProductCard 
                        product={product}
                        onAddToCart={onAddToCart}
                    />
                </div>
            ))}
        </div>
    );
};

export default ProductList;
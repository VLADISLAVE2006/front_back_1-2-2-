import React from 'react';
import './Footer.scss';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__section">
                    <h3 className="footer__title">🛍️ Shop</h3>
                    <p className="footer__description">
                        Лучший интернет-магазин электроники и аксессуаров. 
                        Только качественные товары по доступным ценам.
                    </p>
                </div>

                <div className="footer__section">
                    <h4 className="footer__subtitle">Категории</h4>
                    <ul className="footer__links">
                        <li><a href="#notebooks">Ноутбуки</a></li>
                        <li><a href="#smartphones">Смартфоны</a></li>
                        <li><a href="#tablets">Планшеты</a></li>
                        <li><a href="#accessories">Аксессуары</a></li>
                    </ul>
                </div>

                <div className="footer__section">
                    <h4 className="footer__subtitle">Информация</h4>
                    <ul className="footer__links">
                        <li><a href="#about">О магазине</a></li>
                        <li><a href="#delivery">Доставка</a></li>
                        <li><a href="#payment">Оплата</a></li>
                        <li><a href="#returns">Возврат</a></li>
                    </ul>
                </div>

                <div className="footer__section">
                    <h4 className="footer__subtitle">Контакты</h4>
                    <ul className="footer__contacts">
                        <li>📞 +7 (999) 123-45-67</li>
                        <li>✉️ shop@example.com</li>
                        <li>📍 Москва, ул. Тверская, 1</li>
                    </ul>
                    <div className="footer__social">
                        <a href="#vk" className="footer__social-link">ВК</a>
                        <a href="#tg" className="footer__social-link">TG</a>
                        <a href="#inst" className="footer__social-link">INST</a>
                    </div>
                </div>
            </div>

            <div className="footer__bottom">
                <p>&copy; {currentYear} Интернет-магазин Shop. Все права защищены.</p>
            </div>
        </footer>
    );
};

export default Footer;
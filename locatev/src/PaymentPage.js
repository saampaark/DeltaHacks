import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Apple } from 'lucide-react';
import './PaymentPage.css';

const PaymentPage = () => {
    const [selectedMethod, setSelectedMethod] = useState('credit-card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [paymentInfo, setPaymentInfo] = useState({
        stationName: '',
        price: 0
    });

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const stationName = searchParams.get('station');
        const price = searchParams.get('price');

        if (!stationName || !price) {
            alert('Invalid payment information');
            navigate('/home');
            return;
        }

        setPaymentInfo({
            stationName: stationName,
            price: parseFloat(price)
        });
    }, [location, navigate]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Payment successful! Charging session started.');
            navigate('/home');
        } catch (error) {
            alert('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-container">
            <div className="payment-card">
                <div className="payment-header">
                    <h2>Payment for Charging Session</h2>
                </div>

                <div className="station-info">
                    <h3>{paymentInfo.stationName}</h3>
                    <p>Rate: ${paymentInfo.price.toFixed(2)}/hour</p>
                </div>

                <div className="payment-methods">
                    <button
                        className={`payment-method-button ${selectedMethod === 'credit-card' ? 'selected' : ''}`}
                        onClick={() => setSelectedMethod('credit-card')}
                    >
                        <CreditCard size={24} />
                        <span>Credit Card</span>
                    </button>

                    <button
                        className={`payment-method-button ${selectedMethod === 'apple-pay' ? 'selected' : ''}`}
                        onClick={() => setSelectedMethod('apple-pay')}
                    >
                        <Apple size={24} />
                        <span>Apple Pay</span>
                    </button>
                </div>

                {selectedMethod === 'credit-card' && (
                    <form onSubmit={handlePayment} className="payment-form">
                        <div className="form-group">
                            <label>Card Number</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-row">
                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="MM/YY"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>CVV</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="123"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : `Pay $${paymentInfo.price.toFixed(2)}/hour`}
                        </button>
                    </form>
                )}

                {selectedMethod === 'apple-pay' && (
                    <div className="payment-form">
                        <button
                            onClick={handlePayment}
                            className="submit-button apple-pay-button"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Pay with Apple Pay'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
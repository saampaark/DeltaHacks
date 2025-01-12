import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Apple } from 'lucide-react';

const PaymentPage = () => {
    const [selectedMethod, setSelectedMethod] = useState('credit-card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Get query parameters
    const searchParams = new URLSearchParams(location.search);
    const stationName = searchParams.get('station') || 'Unknown Station';
    const price = parseFloat(searchParams.get('price')) || 0;

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success and redirect
            alert('Payment successful! Charging session started.');
            navigate('/home');
        } catch (error) {
            alert('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
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

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                        Payment for Charging Session
                    </h2>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-700">{stationName}</h3>
                        <p className="text-gray-600">Rate: ${price.toFixed(2)}/hour</p>
                    </div>

                    <div className="space-y-4 mb-6">
                        <button
                            className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 ${
                                selectedMethod === 'credit-card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedMethod('credit-card')}
                        >
                            <CreditCard className="w-6 h-6" />
                            <span className="font-medium">Credit Card</span>
                        </button>

                        <button
                            className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 ${
                                selectedMethod === 'apple-pay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedMethod('apple-pay')}
                        >
                            <Apple className="w-6 h-6" />
                            <span className="font-medium">Apple Pay</span>
                        </button>
                    </div>

                    {selectedMethod === 'credit-card' && (
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Card Number</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                        placeholder="MM/YY"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CVV</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                        placeholder="123"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium mt-6 hover:bg-blue-700 disabled:bg-gray-400"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : `Pay $${price.toFixed(2)}/hour`}
                            </button>
                        </form>
                    )}

                    {selectedMethod === 'apple-pay' && (
                        <div className="text-center p-6">
                            <button
                                onClick={handlePayment}
                                className="w-full bg-black text-white rounded-lg py-3 font-medium hover:bg-gray-800 disabled:bg-gray-400"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Pay with Apple Pay'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
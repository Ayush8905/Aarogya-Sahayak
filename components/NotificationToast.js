import { useState, useEffect } from 'react';

export default function NotificationToast({ message, type = 'success', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose && onClose(), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            case 'info':
                return 'bg-blue-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📝';
        }
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transform transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } ${getTypeStyles()} max-w-sm`}
        >
            <div className="flex items-center space-x-3">
                <span className="text-xl">{getIcon()}</span>
                <div className="flex-1">
                    <p className="font-medium">{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(() => onClose && onClose(), 300);
                    }}
                    className="text-white hover:text-gray-200 font-bold text-lg"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
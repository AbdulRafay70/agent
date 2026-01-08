import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const BookingExpiryTimer = ({ expiryTime, onExpired }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!expiryTime) return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiryTime).getTime();
            const difference = expiry - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft(null);
                if (onExpired) onExpired();
                return null;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            return { hours, minutes, seconds, total: difference };
        };

        // Initial calculation
        const initial = calculateTimeLeft();
        setTimeLeft(initial);

        // Update every second
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryTime, onExpired]);

    if (!expiryTime) return null;

    if (isExpired) {
        return (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
                <Clock size={24} />
                <div>
                    <strong>Booking Expired!</strong>
                    <p className="mb-0">This booking has expired. Please create a new booking.</p>
                </div>
            </div>
        );
    }

    if (!timeLeft) return null;

    const isUrgent = timeLeft.total < 5 * 60 * 1000; // Less than 5 minutes
    const isWarning = timeLeft.total < 15 * 60 * 1000; // Less than 15 minutes

    return (
        <div
            className={`alert ${isUrgent ? 'alert-danger' : isWarning ? 'alert-warning' : 'alert-info'} d-flex align-items-center gap-3 mb-4`}
            role="alert"
        >
            <Clock size={24} className={isUrgent ? 'text-danger' : isWarning ? 'text-warning' : 'text-info'} />
            <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                    <strong>{isUrgent ? '⚠️ Booking Expires Soon!' : 'Booking Expiry Time'}</strong>
                </div>
                <div className="d-flex align-items-center gap-3 mt-2">
                    <div className="d-flex flex-column align-items-center">
                        <span className="fs-3 fw-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <small className="text-muted">Hours</small>
                    </div>
                    <span className="fs-3">:</span>
                    <div className="d-flex flex-column align-items-center">
                        <span className="fs-3 fw-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <small className="text-muted">Minutes</small>
                    </div>
                    <span className="fs-3">:</span>
                    <div className="d-flex flex-column align-items-center">
                        <span className="fs-3 fw-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <small className="text-muted">Seconds</small>
                    </div>
                </div>
                {isUrgent && (
                    <p className="mb-0 mt-2 small">
                        <strong>Complete your payment now to secure this booking!</strong>
                    </p>
                )}
            </div>
        </div>
    );
};

export default BookingExpiryTimer;

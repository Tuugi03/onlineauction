import React, { useState, useEffect } from 'react';
import { socket } from '../socket'; 

export const CountdownTimer = ({ productId, deadline }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const difference = new Date(deadline) - new Date();
    
    if (difference <= 0) {
      return { expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  });

  // Calculate time left initially and when deadline changes
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline) - new Date();
      
      if (difference <= 0) {
        return { expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
  }, [deadline]);

  // Client-side fallback timer
  useEffect(() => {
    if (timeLeft.expired) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const difference = new Date(deadline) - new Date();
        
        if (difference <= 0) {
          return { expired: true };
        }

        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired: false
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, timeLeft.expired]);

  if (timeLeft.expired) {
    return <span className="text-danger">Аукцион дууссан</span>;
  }

  return (
    <div className="d-flex justify-content-between">
      <span className="badge bg-secondary me-1">{timeLeft.days}d</span>
      <span className="badge bg-secondary me-1">{timeLeft.hours}h</span>
      <span className="badge bg-secondary me-1">{timeLeft.minutes}m</span>
      <span className="badge bg-secondary">{timeLeft.seconds}s</span>
    </div>
  );
};
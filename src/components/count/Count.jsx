import React, { useState, useEffect, useRef } from 'react';
import './Count.css';

function Count() {
  const [days, setDays] = useState('00');
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');

  const countDownRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const newYearTime = new Date(`January 01 ${currentYear + 1} 00:00:00`);

  // Initial count
  function updateCountDown() {
    const currentTime = new Date();
    const diffTime = newYearTime - currentTime;

    const d = Math.floor(diffTime / 1000 / 60 / 60 / 24); //days
    const h = Math.floor((diffTime / 1000 / 60 / 60) % 24); // hours
    const m = Math.floor((diffTime / 1000 / 60) % 60); // minutes
    const s = Math.floor((diffTime / 1000) % 60); // seconds

    setDays(d < 10 ? '0' + d : d);
    setHours(h < 10 ? '0' + h : h);
    setMinutes(m < 10 ? '0' + m : m);
    setSeconds(s < 10 ? '0' + s : s);
  }

  useEffect(() => {
    // setTimeout() remove the loading and display the countdown
    const timeoutId = setTimeout(() => {
      if (countDownRef.current) {
        countDownRef.current.style.display = 'flex';
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateCountDown, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className='countx'>
        <h3>Yılbaşı Geçmeden Sende Arkadaşınla Çekiliş Yap!</h3>
      <div id="countDown" className="countdown" ref={countDownRef}>
        <div className="time">
          <h2 id="days">{days}</h2>
          <span>Gün</span>
        </div>
        <div className="time">
          <h2 id="hours">{hours}</h2>
          <span>Saat</span>
        </div>
        <div className="time">
          <h2 id="minutes">{minutes}</h2>
          <span>Dakika</span>
        </div>
        <div className="time">
          <h2 id="seconds">{seconds}</h2>
          <span>Saniye</span>
        </div>
      </div><br /><br /><br /><br /><br />
    </div>
  );
}

export default Count;

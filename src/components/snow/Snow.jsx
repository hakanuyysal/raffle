import React, { useEffect } from 'react';
import './Snow.css';

const Snow = () => {
  useEffect(() => {
    // Kar tanesi sayısını azalt
    const numFlakes = 20; // Dilediğiniz sayıyı ayarlayın

    const flakesContainer = document.getElementById('snowflakes-container');

    for (let i = 0; i < numFlakes; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      flakesContainer.appendChild(flake);

      const size = Math.random() * 20 + 5;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;

      flake.style.animationDuration = `${Math.random() * 6 + 5}s`; // Daha yavaş bir düşüş hızı için süreyi artırın

      // Rastgele başlangıç pozisyonu
      flake.style.left = `${Math.random() * 100}vw`;
      flake.style.top = `${Math.random() * 100}vh`;

      // Animasyon tamamlandığında kar tanesini kaldır
      flake.addEventListener('animationend', () => {
        flake.remove();
      });
    }
  }, []);

  return <div id="snowflakes-container" className="snowfall-container"></div>;
};

export default Snow;

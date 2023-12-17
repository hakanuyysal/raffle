import React, { useState, useEffect } from 'react';
import './Game.css';

function Game() {
  const [isPopupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    // Sayfa açıldığında popup'ı açmak için useEffect kullanabilirsiniz.
    setPopupOpen(true);

    // İsterseniz belirli bir süre sonra otomatik olarak kapatmak için bir zamanlayıcı ekleyebilirsiniz.
    const closeTimeout = setTimeout(() => {
      setPopupOpen(false);
    }, 5000); // Örnekte 5 saniye sonra kapanacak.

    // Component unmount olduğunda zamanlayıcıyı temizle.
    return () => clearTimeout(closeTimeout);
  }, []); // Boş dependency array, sadece bir kere çalışmasını sağlar.

  return (
    <div className={`game ${isPopupOpen ? 'popup-open' : ''}`}>
      <div className="container">
        <div className="row">
         
          <div className="col-12 mt-5 d-flex justify-content-center">
            <div className="box">
              <div className="box-body">
                <img className="img" src="aa.png" alt="Gift" />
                <div className="box-lid">
                  <div className="box-bowtie" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;

// App.js
import React, { useState } from "react";
import "./Main.css";
import "font-awesome/css/font-awesome.min.css";

const App = () => {
  const [katilimcilar, setKatilimcilar] = useState([]);
  const [eslesmeler, setEslesmeler] = useState([]);

  const katilimciEkle = (event) => {
    if (event.key === "Enter" || event.type === "click") {
      const katilimciInput = document.getElementById("katilimciInput");
      const trimmedKatilimci = katilimciInput.value.trim();
      if (trimmedKatilimci !== "") {
        setKatilimcilar([...katilimcilar, trimmedKatilimci]);
        setEslesmeler([]); // Clear previous draw results
        katilimciInput.value = ""; // Input'u temizle
      }
    }
  };

  const katilimciSil = (index) => {
    const yeniKatilimcilar = [...katilimcilar];
    yeniKatilimcilar.splice(index, 1);
    setKatilimcilar(yeniKatilimcilar);
    setEslesmeler([]); // Clear previous draw results
  };

  const katilimcilarTemizle = () => {
    setKatilimcilar([]);
  };

  const cekilisYap = () => {
    if (katilimcilar.length < 2) {
      alert("Çekiliş için en az 2 katılımcı gerekli.");
      return;
    }

    const shuffledKatilimcilar = shuffleArray(katilimcilar);
    const yeniEslesmeler = shuffledKatilimcilar.map((katilimci, index) => ({
      from: katilimci,
      to: shuffledKatilimcilar[(index + 1) % shuffledKatilimcilar.length],
    }));

    setEslesmeler(yeniEslesmeler);
  };

  const shuffleArray = (array) => {
    const shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  };

  return (
    <div>
      <header>
        <img className="logo" src="aa.png" alt="Logo" />
        <h1>ALOHA ile Yılbaşı Çekilişi</h1>
      </header>

      <div className="flex-container">
        {/* Katılımcı Ekle Kısmı */}
        <div className="flex-item1">
          <h2>Katılımcı Ekle</h2>
          <input
            type="text"
            id="katilimciInput"
            placeholder="Katılımcı adı"
            onKeyPress={katilimciEkle}
          />
          <button onClick={katilimciEkle}>Katılımcı Ekle</button>
        </div>

        {/* Diğer İçerikler */}
        <div className="flex-item2">
          <h2>Katılımcı Listesi</h2>
          {katilimcilar.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Katılımcı</th>
                </tr>
              </thead>
              <tbody>
                {katilimcilar.map((katilimci, index) => (
                  <tr key={index}>
                    <td>{katilimci}</td>
                    <td>
                      <i
                        className="fas fa-trash-alt sil "
                        onClick={() => katilimciSil(index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Henüz katılımcı yok.</p>
          )}
         <br /> {katilimcilar.length > 0 && ( 
            <button className="silk" onClick={katilimcilarTemizle}>
              Listeyi Temizle
            </button>
          )}
        </div>

        <div className="flex-item3">
          <h2>Çekiliş Yap</h2>
          <button className="cek" onClick={cekilisYap}>Çekiliş Yap</button>
        </div>

        {eslesmeler.length > 0 && (
          <div className="flex-item4">
            <h2>Eşleşmeler</h2>
            
            <table>
              <thead>
                <tr>
                  <th>Kimden</th>&nbsp;
                  <th>Kime</th>
                </tr>
              </thead>
              <tbody>
                {eslesmeler.map((eslesme, index) => (
                  <tr key={index}>
                    <td>{eslesme.from}</td>{"-"}
                    <td>{eslesme.to}</td>
                  </tr>
                ))}
              </tbody>
            </table><br />
            <button onClick={() => setEslesmeler([])}>
              Eşleşmeleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

import React, { useState } from "react";
import axios from "axios";

const AddUserForm = () => {
  // const AddURL = process.env.REACT_APP_ADD_USER_URL;
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [participants, setParticipants] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Önce aynı isimde bir katılımcının olup olmadığını kontrol et
    const existingParticipant = participants.find(
      (participant) => participant.name === name
    );

    if (existingParticipant) {
      console.log("Bu isimde bir katılımcı zaten var.");
      return;
    }

    try {
      const userData = {
        name: name.trim(),
        team: team.trim(),
      };

      const response = await axios.post(
        "http://localhost:5000/api/raffleEntry/add-user",
        userData
      );
      setParticipants((prevParticipants) => [
        ...prevParticipants,
        response.data,
      ]);
      console.log("Eklenen kullanıcı:", response.data);
    } catch (error) {
      console.error("Hata:", error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Katılımcı Adı:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <br />
        <label>
          Takım Adı:
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Katılımcı Ekle</button>
      </form>
    </div>
  );
};

export default AddUserForm;

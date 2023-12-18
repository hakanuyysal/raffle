const router = require("express").Router();
const RaffleEntry = require("../models/RaffleEntry");
const Match = require("../models/Matches");
const UserMatch = require("../models/UserMatches");

router.post("/add-user", async (req, res) => {
  const newUser = new RaffleEntry({
    name: req.body.name,
  });

  try {
    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/match-users", async (req, res) => {
  try {
    // console.log("Endpoint çalıştı");
    const users = await RaffleEntry.find();

    // Eğer kullanıcı sayısı tekse, bir kullanıcıyı eşleştiremeyiz, bu durumu kontrol etmek önemlidir.
    if (users.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Eşleştirme için en az iki kullanıcı gereklidir.",
      });
    }

    const shuffledUsers = shuffleArray(users);
    const matches = matchUsers(shuffledUsers);
    // Eşleştirmeleri veritabanına kaydetme
    await saveMatchesToDatabase(matches);
    console.log("matches: " + matches);

    res.status(200).json("Otomatik eşleştirme tamamlandı");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Kullanıcıları rastgele sıralayan fonksiyon
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Kullanıcıları eşleştiren fonksiyon
function matchUsers(users) {
  const matches = [];
  const alreadyMatched = new Set();

  for (let i = 0; i < users.length; i++) {
    if (alreadyMatched.has(users[i]._id)) {
      continue;
    }

    let matchFound = false;
    let attemptCount = 0; //deneme sayısı

    while (!matchFound && attemptCount < users.length) {
      const randomIndex = Math.floor(Math.random() * users.length);
      const user1 = users[i];
      const user2 = users[randomIndex];

      if (
        user1 !== user2 &&
        !alreadyMatched.has(user1._id) &&
        !alreadyMatched.has(user2._id)
      ) {
        matches.push({
          user1: { _id: user1._id, name: user1.name },
          user2: { _id: user2._id, name: user2.name },
        });
        alreadyMatched.add(user1._id);
        alreadyMatched.add(user2._id);
        matchFound = true;
      }

      attemptCount++;
    }
  }

  return matches;
}

// Eşleştirmeleri veritabanına kaydeden fonksiyon
async function saveMatchesToDatabase(matches) {
  Match.createCollection();

  for (const match of matches) {
    const { user1, user2 } = match;

    const matchRecord = new Match({
      user1: user1._id,
      user2: user2._id,
    });

    await matchRecord.save();
  }
}

router.get("/get-matched-user/:userName", async (req, res) => {
  try {
    const userName = req.params.userName;
    const user = await RaffleEntry.findOne({ name: userName });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Kullanıcı bulunamadı" });
    }

    const matches = await Match.find({
      $or: [{ user1: user._id }, { user2: user._id }],
    });

    if (!matches || matches.length === 0) {
      return res.json({
        success: true,
        message: "Eşleşme bulunamadı",
        matches: [],
      });
    }

    const matchedUsers = matches.map((match) => {
      return {
        user: userName,
        matchedUser:
          match.user1.toString() === user._id.toString()
            ? match.user2
            : match.user1,
      };
    });

    res.json({
      success: true,
      message: "Eşleşmeler getirildi",
      matches: matchedUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;

const router = require("express").Router();
const RaffleEntry = require("../models/RaffleEntry");
const Match = require("../models/Matches");
const Team = require("../models/Team");

router.post("/add-user", async (req, res) => {
  const { name, team } = req.body;

  try {
    const newUser = new RaffleEntry({
      name,
      team,
    });
    const savedUser = await newUser.save();
    const existingTeam = await Team.findOne({ name: team });

    if (existingTeam) {
      existingTeam.members.push(newUser._id);
      await existingTeam.save();
    } else {
      const newTeam = new Team({
        name: team,
        members: [newUser._id],
      });
      await newTeam.save();
    }
    res.status(200).json(savedUser);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Ekipleri ve Üyeleri Getir Endpoint'i
router.get("/get-teams", async (req, res) => {
  try {
    const teams = await Team.find().populate("members");
    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ekipler getirilirken bir hata oluştu",
      error,
    });
  }
});

router.get("/match-users/:teamName", async (req, res) => {
  try {
    const teamName = req.params.teamName;

    if (!teamName) {
      return res
        .status(400)
        .json({ success: false, message: "Ekip adı belirtilmedi" });
    }

    const team = await Team.findOne({ name: teamName }).populate("members");

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Belirtilen ekip bulunamadı" });
    }

    const matches = matchTeamMembers(team.members);
    res.json({ success: true, matches });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Ekipler arasında eşleşme yapılırken bir hata oluştu",
        error,
      });
  }
});

// Belirli bir ekip altındaki katılımcılar arasında eşleşme yapma fonksiyonu
function matchTeamMembers(members) {
  const matches = [];
  const alreadyMatched = new Set();

  for (let i = 0; i < members.length; i++) {
    if (alreadyMatched.has(members[i]._id)) {
      continue;
    }

    let matchFound = false;
    let attemptCount = 0;

    while (!matchFound && attemptCount < members.length) {
      const randomIndex = Math.floor(Math.random() * members.length);
      const user1 = members[i];
      const user2 = members[randomIndex];

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

// Ekipler Arasında Eşleşme Yap Fonksiyonu
function matchTeams(teams) {
  const matches = [];
  const alreadyMatched = new Set();

  teams.forEach((team) => {
    const teamMembers = team.members;

    for (let i = 0; i < teamMembers.length; i++) {
      if (alreadyMatched.has(teamMembers[i]._id)) {
        continue;
      }

      let matchFound = false;
      let attemptCount = 0;

      while (!matchFound && attemptCount < teamMembers.length) {
        const randomIndex = Math.floor(Math.random() * teamMembers.length);
        const user1 = teamMembers[i];
        const user2 = teamMembers[randomIndex];

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
  });

  return matches;
}
// Kullanıcıları rastgele sıralayan fonksiyon
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Kullanıcıları eşleştiren fonksiyon
function matchTeams(users) {
  const teams = {};

  // Kullanıcıları ekiplerine göre grupla
  users.forEach((user) => {
    const teamName = user.team; // Ekip ismini al, örneğin user.team = "aloha"

    if (!teams[teamName]) {
      teams[teamName] = [];
    }

    teams[teamName].push(user);
  });

  const matches = [];
  const alreadyMatched = new Set();

  // Her ekip içinde çekiliş yap
  Object.keys(teams).forEach((teamName) => {
    const teamMembers = teams[teamName];

    for (let i = 0; i < teamMembers.length; i++) {
      if (alreadyMatched.has(teamMembers[i]._id)) {
        continue;
      }

      let matchFound = false;
      let attemptCount = 0; // Deneme sayısı

      while (!matchFound && attemptCount < teamMembers.length) {
        const randomIndex = Math.floor(Math.random() * teamMembers.length);
        const user1 = teamMembers[i];
        const user2 = teamMembers[randomIndex];

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
  });

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

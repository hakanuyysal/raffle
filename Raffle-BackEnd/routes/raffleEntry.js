require("dotenv").config();
const router = require("express").Router();
const RaffleEntry = require("../models/RaffleEntry");
const Match = require("../models/Matches");
const Team = require("../models/Team");

router.post("/add-user", async (req, res) => {
  const { name, team } = req.body;

  try {
    // Aynı isimde kullanıcıyı kontrol et
    const existingUser = await RaffleEntry.findOne({ name, team });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Bu isimde bir katılımcı zaten var.",
      });
    }
    if (!team) {
      return res
        .status(400)
        .json({ success: false, message: "Takım adı zorunludur" });
    }

    let existingTeam = await Team.findOne({ name: team });

    if (!existingTeam) {
      // Eğer takım yoksa, yeni bir takım oluştur
      existingTeam = new Team({ name: team, members: [] });
      await existingTeam.save();
    }

    if (name) {
      // Eğer isim de varsa, kullanıcıyı kaydet
      const newUser = new RaffleEntry({ name, team });
      const savedUser = await newUser.save();

      existingTeam.members.push(savedUser._id);
      await existingTeam.save();

      return res.status(200).json(savedUser);
    }

    res
      .status(400)
      .json({ success: false, message: "Katılımcı adı zorunludur" });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.delete("/delete-user/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const deletedParticipant = await RaffleEntry.findOneAndDelete({ name });

    if (!deletedParticipant) {
      return res
        .status(404)
        .json({ success: false, message: "Katılımcı bulunamadı." });
    }
    res.status(200).json("Katılımcı silinci");
  } catch (error) {
    res.status(500).json("Katılımcı silinirken bir hata oluştu.");
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

// Bu değişkeni modül düzeyinde tanımlayarak her istekte yeniden oluşturulmasını engelliyoruz
let cachedMatches = [];

router.get("/match-users/:teamName", async (req, res) => {
  try {
    const teamName = req.params.teamName;

    if (!teamName) {
      return res
        .status(400)
        .json({ success: false, message: "Ekip adı belirtilmedi" });
    }

    const team = await Team.findOne({
      name: { $regex: new RegExp(`^${teamName}$`, "i") },
    });

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Belirtilen ekip bulunamadı" });
    }

    // Eğer daha önce eşleşme listesi oluşturulmadıysa veya eşleşmeler boşsa oluştur
    if (cachedMatches.length === 0) {
      cachedMatches = matchTeamMembers(team.members);
    }

    // Eğer takım üyeleri sayısı, eşleşme listesindeki eşleşme sayısından fazlaysa
    // yeni bir eşleşme listesi oluştur
    if (team.members.length > cachedMatches.length) {
      cachedMatches = matchTeamMembers(team.members);
    }

    // Eğer eşleşme varsa, ilk eşleşmenin detaylarını al
    let matchedUserDetails = null;
    if (cachedMatches.length > 0) {
      const firstMatch = cachedMatches[0];

      // Güvenli bir şekilde özelliklere erişim sağlayarak hatayı önle
      const user1Id = firstMatch.user1 ? firstMatch.user1._id : null;
      const user2Id = firstMatch.user2 ? firstMatch.user2._id : null;

      const matchedUserId =
        user2Id && user2Id.toString() === team.members[0]._id.toString()
          ? user1Id
          : user2Id;

      if (matchedUserId) {
        const matchedUser = await RaffleEntry.findById(matchedUserId);
        matchedUserDetails = {
          _id: matchedUser._id,
          name: matchedUser.name,
          team: teamName,
        };

        // Eşleşme tamamlandığında kullanılan eşleşmeyi listeden kaldır
        cachedMatches = cachedMatches.filter(
          (match) =>
            match.user1 &&
            match.user1._id.toString() !== matchedUserId &&
            match.user2 &&
            match.user2._id.toString() !== matchedUserId
        );
      }
    }

    res.json({
      success: true,
      message: "Ekip üyeleri arasında eşleşme yapıldı",
      matchedUserDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ekipler arasında eşleşme yapılırken bir hata oluştu",
      error: error.message,
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
          user2: { _Id: user2._id, name: user2.name },
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

router.get("/match-users/:teamName/:participantName", async (req, res) => {
  try {
    const teamName = req.params.teamName;
    const participantName = req.params.participantName;

    if (!teamName || !participantName) {
      return res.status(400).json({
        success: false,
        message: "Ekip adı veya katılımcı adı belirtilmedi",
      });
    }

    const team = await Team.findOne({ name: teamName }).populate("members");

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Belirtilen ekip bulunamadı" });
    }

    const participant = team.members.find(
      (member) => member.name === participantName
    );

    if (!participant) {
      return res
        .status(404)
        .json({ success: false, message: "Belirtilen katılımcı bulunamadı" });
    }

    // Eğer daha önce eşleşme listesi oluşturulmadıysa veya eşleşmeler boşsa oluştur
    if (cachedMatches.length === 0) {
      cachedMatches = createMatchList(team.members);

      // Eğer eşleşme listesi oluşturulamazsa hata mesajı döndür
      if (cachedMatches.length === 0) {
        return res.json({
          success: false,
          message: "Eşleşme listesi oluşturulamadı",
          matchedUser: null,
        });
      }
    }

    // Eşleşme listesini kullanarak eşleşmeyi kontrol et
    const matchedUser = findMatchedUser(cachedMatches, participant._id);

    if (!matchedUser) {
      console.log("Uygun bir eşleşme bulunamadı.");
      return res.json({
        success: true,
        message: "Eşleşme bulunamadı",
        matchedUser: null,
      });
    }
    if (matchedUser._id.toString() === participant._id.toString()) {
      // Katılımcının kendisiyle eşleşmesi durumunu özel olarak ele alabilirsiniz
      return res.json({
        success: false,
        message: "Katılımcı kendisiyle eşleşmiştir",
        matchedUser: null,
      });
    }

    res.json({
      success: true,
      message: "Eşleşme bulundu",
      matchedUser: { _id: matchedUser._id, name: matchedUser.name },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ekipler arasında eşleşme yapılırken bir hata oluştu",
      error: error.message,
    });
  }
});

// Eşleşme listesini oluştur
function createMatchList(members) {
  const matches = [];
  const alreadyMatched = new Set();

  for (let i = 0; i < members.length; i++) {
    const randomIndex = getRandomUnmatchedIndex(
      i,
      members.length,
      alreadyMatched
    );
    const user1 = members[i];
    const user2 = members[randomIndex];

    matches.push({
      user1: { _id: user1._id, name: user1.name },
      user2: { _id: user2._id, name: user2.name },
    });

    alreadyMatched.add(user1._id);
    alreadyMatched.add(user2._id);
  }

  return matches;
}

// Verilen bir aralıkta henüz eşleşmemiş bir index bul
function getRandomUnmatchedIndex(currentIndex, maxIndex, alreadyMatched) {
  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * maxIndex);
  } while (randomIndex === currentIndex || alreadyMatched.has(randomIndex));

  return randomIndex;
}

// Her seferinde eşleşme listesini kullanarak eşleşmeyi kontrol et
function findMatchedUser(matchedUserList, participantId) {
  for (const match of matchedUserList) {
    if (match.user1._id.toString() === participantId.toString()) {
      return match.user2;
    } else if (match.user2._id.toString() === participantId.toString()) {
      return match.user1;
    }
  }
  return null;
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

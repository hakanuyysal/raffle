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

router.delete("/delete-all-users", async (req, res) => {
  try {
    // Tüm katılımcıları sil
    const result = await RaffleEntry.deleteMany();

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Silinecek katılımcı bulunamadı." });
    }

    res
      .status(200)
      .json({ success: true, message: "Tüm katılımcılar silindi" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Katılımcılar silinirken bir hata oluştu.",
    });
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

// Belirli bir ekip adına göre üyeleri getir Endpoint'i
router.get("/get-teams/:teamName", async (req, res) => {
  try {
    const teamName = req.params.teamName;

    if (!teamName) {
      return res
        .status(400)
        .json({ success: false, message: "Ekip adı belirtilmedi" });
    }

    const team = await Team.findOne({
      name: { $regex: new RegExp(`^${teamName}$`, "i") },
    }).populate("members");

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Belirtilen ekip bulunamadı" });
    }

    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ekip üyeleri getirilirken bir hata oluştu",
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
      // name: teamName,
    });

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Belirtilen ekip bulunamadı" });
    }
    // Her istek başında cachedMatches'i sıfırla
    let cachedMatches = [];

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
      const user1Id =
        firstMatch.user1 && firstMatch.user1._id ? firstMatch.user1._id : null;
      const user2Id =
        firstMatch.user2 && firstMatch.user2._id ? firstMatch.user2._id : null;

      // Eğer her iki kullanıcı da varsa ve user2Id null değilse işleme devam et
      if (user1Id && user2Id) {
        const matchedUserId =
          user2Id.toString() === team.members[0]._id.toString()
            ? user1Id
            : user2Id;

        // Eşleşme tamamlandığında kullanılan eşleşmeyi listeden kaldır
        cachedMatches = cachedMatches.filter(
          (match) =>
            (match.user1 && match.user1._id.toString() !== matchedUserId) ||
            (match.user2 && match.user2._id.toString() !== matchedUserId)
        );
      } else {
        // Eğer her iki kullanıcı da yoksa veya user2Id null ise bir hata durumu oluştu demektir
        throw new Error(
          "Eşleşme sırasında bir hata oluştu: Kullanıcı bilgileri eksik veya hatalı"
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
  try {
    const matches = [];
    const pairedMembers = new Set();

    for (let i = 0; i < members.length; i++) {
      const user1 = members[i];

      // Eşleşmemiş bir kişi bulana kadar döngüyü çalıştır
      let matchFound = false;
      while (!matchFound) {
        const randomIndex = Math.floor(Math.random() * members.length);
        const user2 = members[randomIndex];

        // Aynı kişiyle eşleşme ve daha önce eşleştiyse, tekrar dene
        if (
          user1 !== user2 &&
          !pairedMembers.has(user1) &&
          !pairedMembers.has(user2)
        ) {
          matches.push({
            user1: { _id: user1._id, name: user1.name },
            user2: { _id: user2._id, name: user2.name },
          });

          // Eşleşme tamamlandığında kullanılan eşleşmeyi işaretle
          pairedMembers.add(user1);
          pairedMembers.add(user2);
          matchFound = true;
        }
      }
    }
    return matches;
  } catch (error) {
    console.log(error.message);
    return [];
  }
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
    const matchedUser = findMatchedUser(
      cachedMatches,
      participant._id,
      participant.name
    );

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

module.exports = router;

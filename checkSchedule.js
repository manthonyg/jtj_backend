const cron = require("node-cron");
const fetch = require("node-fetch");

const getIsoDate = () => {
  let yourDate = new Date();
  yourDate.toISOString().split("T")[0];
  const offset = yourDate.getTimezoneOffset();
  yourDate = new Date(yourDate.getTime() - offset * 60 * 1000);
  return yourDate.toISOString().split("T")[0];
};

const checkScheduledGames = async () => {
  const isoDate = getIsoDate();

  try {
    const data = await fetch(
      "https://baseballsavant.mlb.com/schedule?date=" + isoDate
    );
    const response = await data.json();
    const scheduleList = response.schedule.dates[0].games.map((game) => {
      return {
        gamePk: game.gamePk,
        home: game.teams.home.team.teamName,
        away: game.teams.away.team.teamName,
      };
    });
    const yankeesGame = scheduleList.filter(
      (game) => game.home === "Yankees" || game.away === "Yankees"
    )[0];

    if (!yankeesGame) {
      return {
        error: "Try Back on Game Day",
      };
    } else {
      try {
        const gameDataCall = await fetch(
          `https://baseballsavant.mlb.com/gf?game_pk=${yankeesGame.gamePk}`
        );
        const gameDataResponse = await gameDataCall.json();
        const gameData = {
          game_status_code: gameDataResponse.game_status_code,
          game_status: gameDataResponse.game_status,
          scoreboard: gameDataResponse.scoreboard,
        };

        return gameData;
      } catch (error) {
        return {
          error: "Could not get game data",
        };
      }
    }
  } catch (error) {
    console.log({ error });
    console.log("error");
  }
};

//const getGameData =
//fetch(`https://baseballsavant.mlb.com/gf?game_pk=${gamePk}`)
//      .then(function(response) {
//        console.log(response)
//        return response.json()
//      })
//      .then(function(gameData) {
//      console.log(gameData)
//
//
//
//       const gameStatusCode = gameData.game_status_code;
//       const gameStatus = gameData.game_status;
//
//       if (gameStatusCode === 'S' || gameStatus === 'S') {
//        return res.status(400).json({
//            error: "Game has not started yet",
//            data: null
//        });
//       };
//
//       const currentBatter = gameData.scoreboard.linescore.offense.batter.fullName;
//       const homeTeam = gameData.home_team_data.teamName;
//       const awayTeam = gameData.away_team_data.teamName;
//
//        console.dir({gameStatusCode, gameStatus, currentBatter, homeTeam, awayTeam})
//
//            switch(true) {
////                case gameStatusCode !== 'I':
////                     return res.status(400).json({
////                        error: 'Game status code is not in progress',
////                     });
////                case gameStatus !== 'I':
////                    return res.status(400).json({
////                        error: 'Game is not in progress',
////                    });
////                case currentBatter !== 'Aaron Judge':
////                    return res.status(400).json({
////                       error: 'Aaron Judge not up to bat',
////                    });
////                case ![homeTeam, awayTeam].includes('Yankees'):
////                    return res.status(400).json({
////                        error: 'Yankees aren\'t playing',
////                    });
//                default:
//                console.log(gameData)
//                    return res.status(200).json({
//                    error: null,
//                    data: parseGameData(gameData)
//                })
//            }
//         })
//      .catch(error => {
//        res.status(500).send('BAD')
//      });

//               const yankeesGames = scheduleList.filter(schedule => schedule.home === 'Yankees' || schedule.away === 'Yankees');
//
//                 switch (true) {
//                               case yankeesGames.length === 0:
//                                      return {
//                                          error: "Yankees do not play today",
//                                          data: null
//                                      }
//                               case yankeesGames.length === 1:
//                                   return {
//                                       error: null,
//                                       data: yankeesGames
//                                   }
//                               default:
//                                   return {
//                                       error: "Double header today, don't know how to handle this yet",
//                                       data: null
//                                   }
//                               }
//                       })
//                       }
//
//
//
//  const getIsoDate = () => {
//      let yourDate = new Date()
//      yourDate.toISOString().split('T')[0]
//      const offset = yourDate.getTimezoneOffset()
//      yourDate = new Date(yourDate.getTime() - (offset*60*1000))
//      return yourDate.toISOString().split('T')[0]
//  };

//  }

module.exports = checkScheduledGames;

const express = require('express')
const router = express.Router()
const fetch = require('node-fetch')

const getGameSchedule = () => {

const isoDate = getIsoDate();

fetch('https://baseballsavant.mlb.com/schedule?date='+ isoDate)
        .then(function(response) {
            return response.json();
        })
        .then(function(scheduledGames) {
             const scheduleList = scheduledGames.schedule.dates[0].games.map(game => {
                return {
                    gamePk: game.gamePk,
                    home: game.teams.home.team.teamName,
                    away: game.teams.away.team.teamName
                   }
                })
             const yankeesGames = scheduleList.filter(schedule => schedule.home === 'Yankees' || schedule.away === 'Yankees');

               switch (true) {
                             case yankeesGames.length === 0:
                                    return {
                                        error: "Yankees do not play today",
                                        data: null
                                    }
                             case yankeesGames.length === 1:
                                 return {
                                     error: null,
                                     data: yankeesGames
                                 }
                             default:
                                 return {
                                     error: "Double header today, don't know how to handle this yet",
                                     data: null
                                 }
                             }
                     })

}

const getIsoDate = () => {
    let yourDate = new Date()
    yourDate.toISOString().split('T')[0]
    const offset = yourDate.getTimezoneOffset()
    yourDate = new Date(yourDate.getTime() - (offset*60*1000))
    return yourDate.toISOString().split('T')[0]
};

const parseGameData = (gameData) => {
    const parsedGameData = {};

    const homeTeam = gameData.home_team_data.teamName;
    const awayTeam = gameData.away_team_data.teamName;

    // handle_pitch_counts(html)
    const balls = gameData.scoreboard.linescore.balls;
    const strikes = gameData.scoreboard.linescore.strikes;
    const counts = `${balls}-${strikes}`;
    parsedGameData.pitch_counts = counts;

    // handle_pitch_hand(html)
    const pitchHand = gameData.scoreboard.currentPlay.matchup.pitchHand.code
    parsedGameData.pitchHand = pitchHand;

// TODO this only works when judge is at bat
    // handle_order_pos(html)
//    try {
//        const orderPosition = gamedata.scoreboard.linescore.offense.battingOrder;
//        console.log({orderPosition})
//        parsedGameData.order_position = orderPosition;
//    }
//    catch(error) {
//        throw new Error('Could not find order position');
//    }

    // handle_def_pos(html)
//    const defensePosition = gameData.scoreboard.linescore.defense

    // handle_rel_score(html)


    // handle_inning(html)
    const inning = gameData.scoreboard.linescore.currentInningOrdinal;
    parsedGameData.inning = inning;
    console.log({ inning });

    // handle_bases(html)
    const menOnBase = gameData.scoreboard.currentPlay.matchup.splits.menOnBase;
    parsedGameData.bases = menOnBase;
    console.log({ menOnBase });

    // handle_pitches_thrown(html)
    const pitchesThrown = balls + strikes; // TODO I know this is not right lol
    parsedGameData.pitches_thrown = pitchesThrown;
    console.log({ pitchesThrown })

    // handle_outs(html)
    const outs = gameData.scoreboard.linescore.outs;
    parsedGameData.outs = outs;
    console.log({ outs });

    // handle_home_road(html)
    const homeRoad = homeTeam === 'Yankees' ? 'home' : 'away';
    parsedGameData.home_road = homeRoad;
    console.log({ homeRoad });

    console.log({ parsedGameData })
    return parsedGameData

}

router.get('/gameSchedule', (req, res) => {
    const isoDate = getIsoDate();
    console.log(isoDate);

    fetch('https://baseballsavant.mlb.com/schedule?date='+ isoDate)
        .then(function(response) {
            return response.json();
        })
        .then(function(scheduledGames) {
             const scheduleList = scheduledGames.schedule.dates[0].games.map(game => {
                return {
                    gamePk: game.gamePk,
                    home: game.teams.home.team.teamName,
                    away: game.teams.away.team.teamName
                   }
                })
             const yankeesGames = scheduleList.filter(schedule => schedule.home === 'Yankees' || schedule.away === 'Yankees');

             switch (true) {
                case yankeesGames.length === 0:
                    return res.status(404).json({
                        error: "Yankees do not play today",
                        data: null
                    });
                case yankeesGames.length === 1:
                    return res.status(404).json({
                        error: null,
                        data: yankeesGames
                    })
                default:
                    return res.status(404).json({
                        error: "Double header today, don't know how to handle this yet",
                        data: null
                    })
                }
        })
    })




router.get('/gameData', (req, res) => {

 const gamePk = req.query.gamePk;

 fetch(`https://baseballsavant.mlb.com/gf?game_pk=${gamePk}`)
      .then(function(response) {
        console.log(response)
        return response.json()
      })
      .then(function(gameData) {
      console.log(gameData)



       const gameStatusCode = gameData.game_status_code;
       const gameStatus = gameData.game_status;

       if (gameStatusCode === 'S' || gameStatus === 'S') {
        return res.status(400).json({
            error: "Game has not started yet",
            data: null
        });
       };

       const currentBatter = gameData.scoreboard.linescore.offense.batter.fullName;
       const homeTeam = gameData.home_team_data.teamName;
       const awayTeam = gameData.away_team_data.teamName;

        console.dir({gameStatusCode, gameStatus, currentBatter, homeTeam, awayTeam})

            switch(true) {
//                case gameStatusCode !== 'I':
//                     return res.status(400).json({
//                        error: 'Game status code is not in progress',
//                     });
//                case gameStatus !== 'I':
//                    return res.status(400).json({
//                        error: 'Game is not in progress',
//                    });
//                case currentBatter !== 'Aaron Judge':
//                    return res.status(400).json({
//                       error: 'Aaron Judge not up to bat',
//                    });
//                case ![homeTeam, awayTeam].includes('Yankees'):
//                    return res.status(400).json({
//                        error: 'Yankees aren\'t playing',
//                    });
                default:
                console.log(gameData)
                    return res.status(200).json({
                    error: null,
                    data: parseGameData(gameData)
                })
            }
         })
      .catch(error => {
        res.status(500).send('BAD')
      });
  });

module.exports = router
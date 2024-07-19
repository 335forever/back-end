const players = {}

function newPlayer(playerInfo) {
    players[playerInfo.id] = {
        ...playerInfo
    }
    return playerInfo.id;
}

function removePlayer(playerId) {
    delete players[playerId];
}

module.exports = {
    players,
    newPlayer,
    removePlayer
}
const players = {}

function newPlayer(playerInfor) {
    players[playerInfor.id] = {
        ...playerInfor
    }
    return playerInfor.id;
}

function removePlayer(playerId) {
    delete players[playerId];
}

module.exports = {
    players,
    newPlayer,
    removePlayer
}
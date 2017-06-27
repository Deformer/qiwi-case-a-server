const Balance = require('../models/balance');

module.exports = {
  changeBalance: (delta, userId, dialogId) => {
    Balance.findOne({where: {userId, dialogId}}).then(balanceObject => {
      const balance = balanceObject.toJSON();
      Balance.update({money: balance.money + delta}, {where: {userId, dialogId}}).then(resolve);
    })
  }}
;
const router = require('express').Router();
const dialogService = require('../../services/dialog');
const messageService = require('../../services/message');
const balanceService = require('../../services/balance');
const User = require('../../models/user')

router.get('/', (req, res) => {
  dialogService.getAllDialogsToUser(req.user.id).then((dialogs) => {
    Promise.all(dialogs.map(dialog => dialog.getUsers().then(result =>  result.map(r => r.toJSON()))
    )).then((users) => {
      const _dialogs = dialogs.map(d => d.toJSON());
      for(let i = 0; i< _dialogs.length;i++){
        _dialogs[i].users = users[i];
      }
      res.status(200).send(_dialogs);
    });
  });
});
router.post('/', (req, res) => {
  const { members, balance } = req.body;
  dialogService.createDialog(members, -1*balance).then((dialog) => {

    res.status(200).send(dialog);
  });
});

/* {
  "message":{
    "type": "online",
    "money": 100,
    "comment": "your mom",
    "to":2,
    "dialogId": 6
}
}
 "2017-06-30T08:05:39.274Z"

*/
router.post('/postMessage', (req, res) => {
  const { user } = req;
  const { message } = req.body;
  message.from = user.id;
  if(message.type === 'online'){
    message.isConfirmed = true;
    messageService.saveMessage(message).then((response) => {
      balanceService.changeBalance(message.money, message.from, message.dialogId).then(() => {
        balanceService.changeBalance(-1*message.money, message.to, message.dialogId).then(() => {
          res.sendStatus(200);
        })
      })
    });
  } else if(message.type === 'cashe'){
    message.isConfirmed = false;
    messageService.saveMessage(message).then((response) => {
      res.sendStatus(200);
    })
  } else res.status(400).send("wrong type");
});

router.post('/confirmMessage', (req,res) => {
  const {user} = req;
  const {messageId} = req.body;
  messageService.confirmMessage(22, messageId).then((conf) => {
    if(conf[0] > 0){
      messageService.getById(messageId).then((message) => {
        balanceService.changeBalance(message.money, message.from, message.dialogId).then(() => {
          balanceService.changeBalance(-1*message.money, message.to, message.dialogId).then(() => {
            res.sendStatus(200);
          })
        })
      })
    } else res.status(400).send('wrong messageId or userId')

  })
});

module.exports = router;

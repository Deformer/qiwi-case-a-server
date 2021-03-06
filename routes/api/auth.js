const router = require('express').Router();
const generator = require('../../services/helpers/generator');
const userService = require('../../services/user');
const authService = require('../../services/auth');
const config = require('../../config');

router.post('/sendSms', (req, res) => {
  const { phoneNumber, userName } = req.body;
  const smsCode = generator.genSmsCode(6);
  userService.createNewUser(phoneNumber, userName, smsCode).then((userId) => {
    res.status(200).send({ userId });
  }).catch((err) => {
    userService.getUserWithPhoneNumber(phoneNumber).then((user) =>{
     if(user) {
       return res.status(200).send({userId: user.id});
     }
     res.sendStatus(500);
    })
  });
});

router.post('/confirmUserAccount', (req, res) => {
  const userId = req.body.userId;
  const smsCode = req.body.smsCode;
  userService.confirmUserAccount(userId, smsCode).then((userObjectToTokenize) => {
    authService.createToken(userObjectToTokenize, config.secret).then((token) => {
      res.status(200).send({ token });
    });
  }).catch((err) => {
    res.sendStatus(500);
  });
});

module.exports = router;

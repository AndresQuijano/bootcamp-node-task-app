const express = require('express');
const sharp = require('sharp');
const User = require('../models/user');
const authentication = require('../middleware/authentication');
const {sendWelcomeEmail, sendGoodbyeEmail} = require('../emails/account');
const multer = require('multer');
const router = new express.Router();


router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()

        sendWelcomeEmail(user.email, user.name);

        const token = await user.generateAuthToken();
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        console.log(error)
        res.status(400).send();
    }
});

router.post('/users/logout', authentication, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);

        await req.user.save();

        res.send();
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
});

router.post('/users/logoutAll', authentication, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/users/me', authentication, async (req, res) => {
    res.send(req.user);
})

//No longer required since the only one user I should be able to read is me, and for that
//the /users/me path is provided
// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id

//     try {
//         const user = await User.findById(_id)

//         if (!user) {
//             return res.status(404).send()
//         }

//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.patch('/users/me', authentication, async (req, res) => {
    try {
        const fieldsToUpdate = Object.keys(req.body);
        const fieldsAllowedToUpdate = ['name', 'email', 'password', 'age'];
        const isValidUpdate = fieldsToUpdate.every((field) => fieldsAllowedToUpdate.includes(field));

        if (!isValidUpdate) {
            res.status(400).send({ 'error': 'Invalid updates!' });
        }

        // const user = await User.findById(req.params.id);

        // if (!user) {
        //     return res.status(404).send();
        // }

        fieldsToUpdate.forEach((field) => req.user[field] = req.body[field]);

        await req.user.save();
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { 'new': true, 'runValidators': true });

        res.send(req.user);
    } catch (error) {
        console.log(error)
        res.status(400).send(error);
    }
});

router.delete('/users/me', authentication, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.params.id)

        // if (!user) {
        //     return res.status(404).send()
        // }

        await req.user.deleteOne();
        sendGoodbyeEmail(req.user.email, req.user.name);
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
});

const storage = multer.memoryStorage();
const upload = multer({
    //'dest':'avatars',Saves the file but doesn't pass it through the next()
    'limits': {
        'fileSize': 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback('Please upload an image');
        }

        callback(undefined, true);
    }
},
    storage);

router.post('/users/me/avatar', authentication, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize({ 'width': 250, 'height': 250 })
        .png()
        .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ 'error': error.message || error });
});

router.delete('/users/me/avatar', authentication, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');//Headers
        res.send(user.avatar);
    } catch (error) {

    }
});

module.exports = router;

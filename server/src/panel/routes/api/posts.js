const express = require('express');
const router = express.Router();

//Get Posts
router.get('/', async (req, res) => {
    global.mainDb.find({}).sort({time: -1}).limit(30).exec((err, docs) => {
        res.send(docs);
    })
});

//Add Posts
router.post('/', async (req, res) => {
    await global.mainDb.insert({
        user: req.body.user,
        text: req.body.text,
        time: new Date().getTime()
    });
    res.status(201).send();
});

//Delete Post
router.delete('/:id', async (req, res) => {
    await global.mainDb.remove({_id: req.params.id});
    res.status(200).send();
});

module.exports = router;

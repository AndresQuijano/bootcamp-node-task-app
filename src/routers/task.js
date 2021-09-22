const express = require('express');
const Task = require('../models/task');
const authentication = require('../middleware/authentication');
const router = new express.Router();

router.post('/tasks', authentication, async (req, res) => {
    const task = new Task({
        ...req.body,
        'owner': req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

//GET /tasks?completed=true
//Pagination: GET /tasks?limit=10&skip=10
//GET /tasks?sortBy=createdAt:asc
router.get('/tasks', authentication, async (req, res) => {
    try {
        const match = {};
        const sort = {};

        if (req.query.completed) {
            match.completed = req.query.completed === 'true';
        }

        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        }
        // const tasks = await Task.find({'owner':req.user._id})
        await req.user.populate({
            'path': 'tasks',
            match,
            'options': {
                'limit': parseInt(req.query.limit),
                'skip': parseInt(req.query.skip),
                sort
            }
        });//.execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        console.log(error);
        res.status(500).send()
    }
})

router.get('/tasks/:id', authentication, async (req, res) => {
    const _id = req.params.id

    try {
        // const task = await Task.findById(_id)
        const task = await Task.findOne({ _id, 'owner': req.user._id });

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', authentication, async (req, res) => {
    try {
        const fieldsToUpdate = Object.keys(req.body);
        const fieldsAllowedToUpdate = ['description', 'completed'];
        const isValidUpdate = fieldsToUpdate.every((field) => fieldsAllowedToUpdate.includes(field));

        if (!isValidUpdate) {
            res.status(400).send({ 'error': 'Invalid updates!' });
        }

        // const task = await Task.findById(req.params.id);
        const task = await Task.findOne({ '_id': req.params.id, 'owner': req.user._id });

        if (!task) {
            res.status(404).send();
        }

        fieldsToUpdate.forEach((field) => task[field] = req.body[field]);

        await task.save();
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {'new':true, 'runValidators':true});

        res.send(task);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', authentication, async (req, res) => {
    try {
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({ '_id': req.params.id, 'owner': req.user._id });

        if (!task) {
            res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
});

module.exports = router;
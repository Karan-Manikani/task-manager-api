const express = require("express");
const auth = require("../middleware/auth");
const Task = require("../models/task");
const User = require("../models/user");

const router = new express.Router();

// CREATE TASK
router.post("/tasks", auth, async (req, res) => {
	try {
		const task = new Task({
			...req.body,
			owner: req.user._id,
		});
		await task.save();
		res.status(201).send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

// GET ALL TASKS
router.get("/tasks", auth, async (req, res) => {
	const match = {};
	const sort = {};
	if (req.query.completed) {
		match.completed = req.query.completed === "true" ? true : false;
	}
	if (req.query.sortBy) {
		const parts = req.query.sortBy.split(":");
		sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
	}
	try {
		const user = req.user;
		await user.populate({
			path: "tasks",
			match: match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort: sort,
			},
		});
		res.send(user.tasks);
	} catch (error) {
		res.status(500).send();
	}
});

// GET TASK BY ID
router.get("/tasks/:id", auth, async (req, res) => {
	try {
		const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (error) {
		res.status(500).send();
	}
});

// UPDATE TASK
router.patch("/tasks/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["description", "completed"];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		return res.status(400).send({ error: "Invalid updates." });
	}

	try {
		const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		updates.forEach((update) => (task[update] = req.body[update]));
		await task.save();
		res.send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

// DELETE TASK
router.delete("/tasks/:id", auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (error) {
		res.status(500).send();
	}
});

module.exports = router;

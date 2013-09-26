var express = require('express'),
	app = express();

var mongoose = require('mongoose');

mongoose.connection.once('open', function () {
	console.log('MongoDB connection opened.');
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error: '));
mongoose.connect('mongodb://localhost:27017/comment');

var CommentSchema = new mongoose.Schema({
	author: { type: String},
	message: { type: String},
	added: { type: Date, default: Date.now},
	upvotes: { type: String}
});
var comments = mongoose.model('comment', CommentSchema);

// Setup CORS related headers
var corsSettings = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
	// deal with OPTIONS method during a preflight request
	if (req.method === 'OPTIONS') {
		res.send(200);
	} else {
		next();
	}
}

app.use(corsSettings);
app.use(express.bodyParser());

function listComments(req, res) {
	var options = {};
	if (req.query.skip) {
		options.skip = req.query.skip;
	}
	if (req.query.limit) {
		options.limit = req.query.limit;
	}
	comments.find(null, null, options, function (err, docs) {
		if (err) {
			console.log(err);
			res.send(500, err);
		} else {
			res.send(200, docs);
		}
	});
}

// Note: For security reasons, fields must be validated before saving to database in a real world scenario.
// This is only for training purposes so it's not necessary to do validation.
function createComments(req, res) {
	comments.create(req.body, function (err, doc) {
		if (err) {
			console.log(err);
			res.send(500, err);
		} else {
			res.send(200, doc);
		}
	});
}

function deleteCommentsById(req, res) {
	var id = req.params.id;
	comments.findByIdAndRemove(id, function (err, doc) {
		if (err) {
			console.log(err);
			res.send(404, err);
		} else {
			res.send(200, doc);
		}
	})
}

function updateCommentsById(req, res) {
	var id = req.params.id;
	var newData = {
		author: req.body.author,
		message: req.body.message,
		added: req.body.added,
		upvotes: req.body.upvotes
	};
	comments.findByIdAndUpdate(id, newData, function (err, doc) {
		if (err) {
			console.log(err);
			res.send(404, err);
		} else {
			res.send(200, doc);
		}
	});
}
function welcomeComments(req, res) {
	res.send(200, "Welcome to comment API!");
}
//app.get('/', welcomeComments);
app.get('/comments', listComments);
app.post('/comments', createComments);
app.put('/comments/:id', updateCommentsById);
app.delete('/comments/:id', deleteCommentsById);

app.listen(9090);

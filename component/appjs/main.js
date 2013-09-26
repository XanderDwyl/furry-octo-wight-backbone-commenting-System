(function ($, BB, _) {
	var App = Backbone.View.extend({
		el: "#comments",
		events: {
			'click #add_comment': 'addComment'
		},
		initialize: function () {
			this.$input_author = $('.field input[name=author]');
			this.$input_message = $('#message');
			this.$counter = $('div#comment_count');
			this.$comment_list = $('#comment_list');

			this.listenTo(this.collection, 'add', this.createView);
			this.listenTo(this.collection, 'add remove', this.updateCommentCounter);
			this.listenTo(this.collection, 'remove', this.render);

			// Fetch contacts from server
			this.collection.fetch();
		},
		clearInputs: function () {
			this.$input_author.val('');
			this.$input_message.val('');
		},
		updateCommentCounter: function () {
			this.$counter.text(this.collection.length);
		},
		addComment: function (evt) {
			evt.preventDefault();
			var _this = this;
			var comment = new CommentModel({
				author: this.$input_author.val(),
				message: this.$input_message.val(),
				upvotes: 0
			});
			comment.save(null, {
				success: function (model, resp, options) {
					_this.collection.add(model);
				}, 
				error: function (model, xhr, options) {
					alert('Error on save');
				}
			});
		},
		createView: function (model, collection) {
			model.set('time_elapsed', moment(model.get('added'), "YYYYMMDD").fromNow());
			var view = new CommentView({model: model});
			this.$comment_list.append(view.render().el);
			this.clearInputs();
		}
	});

	var CommentModel = Backbone.Model.extend({
		defaults: {
			'author': '-',
			'message': '-',
			'upvotes': 0
		},
		idAttribute: '_id',
		url: function () {
			var location = 'http://localhost:9090/comments';
			return this.id ? (location + '/' + this.id) : location;
		},
		initialize: function () {
			this.validKeys = ['author', 'message', 'upvotes'];
		},
		// Checks if the new attributes are similar to the current attributes
		// Returns: true if all or one attr has changed
		// false if none is changing
		attrChanged: function (newAttr) {
			var changed = _.isEqual(_.pick(this.attributes, this.validKeys), newAttr);
			return !changed;
		}
	});

	var CommentCollection = Backbone.Collection.extend({
		model: CommentModel,
		url: 'http://localhost:9090/comments',
		initialize: function () {

		}
	});

	var CommentView = Backbone.View.extend({
		template: $('#comment-template').html(),
		events: {
			'click .upvote': 'voteComment',
			'click .delete': 'deleteFromDatabase'
		},
		initialize: function() {
			// Triggers after a model is deleted in the database
			this.listenTo(this.model, 'destroy', this.removeView);
			// Triggers after a model's field changed or updated in the database
			this.listenTo(this.model, 'change', this.showDefaultView);
		},
		deleteFromDatabase: function () {
			this.model.destroy({
				wait: true,
				success: function (model, resp, opt) {
					console.log('model destroy success: ', model);
				},
				error: function (model, xhr, opt) {
					console.log('model destroy error: ', model);
				}
			})
		},
		voteComment: function () {
			var vote = parseInt(this.model.get('upvotes')) + 1;
			var newAttrs = {
				author: this.model.get('author'),
				message: this.model.get('message'),
				added: this.model.get('added'),
				upvotes: vote
			}
			if (!this.model.attrChanged(newAttrs)) {

				this.showDefaultView();
			} else {
				this.model.save(newAttrs, {
					wait: true,
					success: function (model, resp, opt) {
						console.log('model update success: ', model);
					},
					error: function (model, xhr, opt) {
						console.log('model update error: ', model);
					}
				});
			}
		},
		showDefaultView: function () {
			var compiledTemplate = _.template(this.template);
			this.$el.html(compiledTemplate(this.model.toJSON()));
			this.$el.removeClass('highlight');
		},
		removeView: function () {
			this.undelegateEvents();
			this.stopListening();
			this.remove();
		},
		render: function() {
			var compiledTemplate = _.template(this.template);
			this.$el.html(compiledTemplate(this.model.toJSON()))
			return this;
		}
	});

	var commentApp = new App({ collection: new CommentCollection() });

	// for debugging purposes
	window.app = commentApp;
})(jQuery, Backbone, _)
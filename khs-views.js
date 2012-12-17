(function(){
	
	// Hold reference to Underscore.js and Backbone.js in the closure in order
	// to make things work even if they are removed from the global namespace
	var _ = this._;
	var $ = this.$;
	var Backbone = this.Backbone;
	var Dw = Backbone.Dw || (Backbone.Dw = { });
	var View = Dw.Views = { };
	
    // List of view options to be merged as properties.
    var baseOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'parent', 'cel', 'cview'];
	
	// just a shell to use
	// doesn't auto render
	var Base = Backbone.View.extend();
	_.extend(Base.prototype, {
		// parent view
		parent: undefined,
		// child el
		cel: undefined,
		// child view object
		cview: undefined,
		
	    // Performs the initial configuration of a View with a set of options.
	    // Keys with special meaning *(model, collection, id, className)*, are
	    // attached directly to the view.
	    _configure: function(options) {
			if (this.options) options = _.extend({}, this.options, options);
			for (var i = 0, l = baseOptions.length; i < l; i++) {
				var attr = baseOptions[i];
				if (options[attr]) this[attr] = options[attr];
			}
			this.options = options;
	    },
		
	    // 
		_render: function(event, data) {
			var _data = {id:undefined};
			if(data != undefined && data != null) _.extend(_data, data);
			
			if(this.model != undefined && this.model != null) {
				_.extend(_data, this.model.toJSON());
			}
			
			var _compiled_temp = _.template(this.template, _data,  {variable: 'data'});
			
			if(this.$el.length > 0 && this.$el.get(0).tagName.toLowerCase() != this.tagName) {
				this.setElement(this.make(this.tagName, {'data-view': this.cid}, _compiled_temp));
			} else {
				this.setElement(this.$el.html(_compiled_temp));
			}
			
			this.$el.attr('data-view', this.cid);
			
			if(Backbone.secure !== undefined) {
				this.secureHtml();
			}
			return this;
		},
		
		// basic render method
		// allow for easy overriding
		render: function(event) {
			var data = undefined;
			if(_.isFunction(this.beforeRender)) data = this.beforeRender(event);
			this._render(event, data);
			if(_.isFunction(this.afterRender)) this.afterRender(event);
			return this;
		},
		// should be renamed..
		visible: function() {
			return $('[data-view="'+this.cid+'"]').length === 1? true:false; 
		},
		
		crender: function(view) {
			if(this.cview !== undefined) {
				this.cview.$el.remove();
			}
			this.cview = view;
			view.parent = this;
			this.$(this.cel).html(view.render().$el);
		}
		
	});
	
	// May or may not have a parent
	// May or may not have a model
	var Basic = View.Basic = Base.extend();
	_.extend(Basic.prototype, {
		// nothing changed form Base
	});
	
	_.extend(Backbone.Collection.prototype, {
		// Override
		initialize: function(props) { 
        	if(props) {
        		this.url = props.url;
        	}
        }
	});
	
	// May or may not have a model
	// Must have a parent
	// Must contain a collection defined
	var Collection = View.Collection = Base.extend();
	_.extend(Collection.prototype, {
		cview: undefined,
		// Override
		initialize: function() {
			if(this.collection !== undefined) {
				_(this).bindAll('add', 'update', 'remove', 'fetch');
				_(this).bindAll('addEvent', 'resetEvent', 'removeEvent');
				this.collection.bind('add', this.addEvent);
				this.collection.bind('reset', this.resetEvent);
				this.collection.bind('remove', this.removeEvent);
				if(this.collection.url !== undefined) this.fetch();
			}
		},
		
		fetch: function() {
			this.collection.fetch();
		},
		add: function(model) {
			this.collection.add(model);
		},
		remove: function(model) {
			this.collection.remove(model);
		},
		update: function(model) {
			this.resetEvent(this.collection);
		},
		
		addEvent: function(model) {
			var _view = model.BackboneView = new this.cview({model:model, parent:this}).render();
			this.$(this.cel).append(_view.el);
		},
		resetEvent: function(col) {
			this.$(this.cel).empty();
			col.each(this.addEvent, this);
		},
		removeEvent: function(model) {
			model.BackboneView.remove();
		}
	});
	
	// Must have a parent view
	// Must contain a model defined
	var Model = View.Model = Base.extend();
	_.extend(Model.prototype, {
		
	});
	
}).call(this);
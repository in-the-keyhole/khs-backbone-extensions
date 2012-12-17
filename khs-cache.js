(function(){

	// Hold reference to Underscore.js and Backbone.js in the closure in order
	// to make things work even if they are removed from the global namespace
	var _ = this._;
	var Backbone = this.Backbone;
	
	var View = Backbone.View;
	_.extend(View.prototype, {
		cache: function() {
			Backbone.cache.add(this);
		},
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
		initialize: function(){
			this.cache();
		},
	   
		// this will remove the view from the DOM
		// evict the object from the cache
		destroy: function() {
	   		Backbone.cache.evict(this);
			this.remove();
		}
	});
	
	var Model = Backbone.Model;
	_.extend(Model.prototype, {
		cache: function() {
 		   Backbone.cache.add(this);
 		   this.on('destory', function() {
 			   Backbone.cache.evict(this);
 		   });
		},
		
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
		initialize: function(){
			this.cache();
		},		
	});
	
    // Creating a Backbone.Cache creates its initial element outside of the DOM,
    // if an existing element is not provided...
	var Cache = Backbone.Cache = function(options) {
//	    this._configure(options || {});
	    this.initialize.apply(this, arguments);
	};
	
	_.extend(Cache.prototype, {
		// collection to hold the objects.
		// don't need to work about duplicat cid 
		// backbone make sure they are unique
		cache: {},
		
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},
		
		add: function(object) {
			this.cache[object.cid] = object;
		},
		
		// this will also call remove on the object.
		// it will remove it from the DOM and the cache
		evict: function(object) {
			this.cache[object.cid] = null;	// for IE 6/7/8
			delete this.cache[object.cid];
		},
		
		// find a Backbone object from the cid
		find: function(cid) {
			return this.cache[cid];
		},
		
//	    _configure: function(options) { },
	});
	
	Backbone.cache = new Cache();
	
}).call(this);
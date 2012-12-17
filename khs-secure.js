(function(){
	
	// Hold reference to Underscore.js and Backbone.js in the closure in order
	// to make things work even if they are removed from the global namespace
	var _ = this._;
	var $ = this.$;
	var Backbone = this.Backbone;
	var Dw = Backbone.Dw || (Backbone.Dw = {});
	
	// Must be authenicated to route. Even none secure routes will require authenticate
	var Router = Dw.Router = Backbone.Router.extend();
	_.extend(Router.prototype, {
		// require the Backbone.secure to be authenicated for all routes
		routes: undefined,
		secure: undefined,
		
		// Override this method to create your own error or error pages.
		notAuthorized: function() {
			Backbone.secure.notAuthorized();
		},
		
		// !! Override !!
		// Bind all defined routes to `Backbone.history`. We have to reverse the
		// order of the routes here to support behavior where the most general
		// routes can be defined at the bottom of the route map.
		_bindRoutes: function() {
			if (!this.secure && !this.routes) return;
			Backbone.secure.routers.push(this);
			var routes = [];
			for (var route in this.routes) {
				if(!Backbone.secure.isAuthenticate) routes.unshift([route, 'notAuthorized']);
				else routes.unshift([route, this.routes[route]]);
			}
			for (var route in this.secure) {
				if(this.validateRoles(this.secure[route]) && Backbone.secure.isAuthenticate) routes.unshift([route, this.secure[route].method]);
				else routes.unshift([route, 'notAuthorized']);
			}
			for (var i = 0, l = routes.length; i < l; i++) {
				this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
			}
		},
		
		// Check to see if the route passes
		validateRoles: function(secure) {
			var _roles = undefined;
			if(secure.hasRoles) _roles = secure.hasRoles;
			else if(secure.hasAllRoles) _roles = secure.hasAllRoles;
			else if(secure.hasNoRoles) _roles = secure.hasNoRoles;
			
			_roles = Backbone.secure._getRolesAsArray(_roles);
			
			if(secure.hasRoles) return Backbone.secure.hasRole(_roles);
			else if(secure.hasAllRoles) return Backbone.secure.hasAllRoles(_roles);
			else if(secure.hasNoRoles) return Backbone.secure.hasNoRoles(_roles);
			return false;
		}
		
	});
	
	var View = Backbone.View;
	_.extend(View.prototype, {		
		// this will remove all secure object from $el
		secureHtml: function() {
			this.setElement(Backbone.secure.cleanHtml(this.el));
		}
	});
	
	var Secure = Backbone.Secure = function(options) {
	    this._configure(options || {});
	    this.initialize.apply(this, arguments);
	    _(this).bindAll('hasRole', 'hasAllRoles', 'hasNoRoles');
	};
	
	 var secureOptions = ['secureTag'];
	 
	_.extend(Secure.prototype, {
		secureTag: 'data-secure',
		
		// princial name
		principal: undefined,
		
		// roles to be used 
		roles: undefined,
		
		// is authenicated
	    isAuthenticate: false,
		
		// loaded routers
		// need to refresh on authenicated & invalidate
		routers: [],
		
		// Override this method to create your own error or error pages.
		notAuthorized: function() {
			throw new Error("Uses does not have permissions to view this page!");
		},
		
		// Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function() { },
		
		// create an authenicated secure object
		/*
			{
				principal: 'Username',
				roles: ['ROLE_1', 'ROLE_2']
			}
		*/
		authenticate: function(auth) {
			if(auth === undefined) throw new Error('Authentication failed');
			this.principal = auth.principal;
			this.roles = auth.roles;
			this.isAuthenticate = true;
			this.refresh();
		},
		// invaliate the authenticate
		invalidate: function() {
			this.roles = this.principal = undefined;
			this.isAuthenticate = false;
			this.refresh();
		},
		
		// reload the routers
		refresh:function() {
			_.each(this.routers, function(router) {
				// rebind the routes 
				// this will overwrite what is currently set
				router._bindRoutes();
			});
		},
		
		// clean html that is passed in.
		// this will return html to use
		// this will not effect the DOM
		cleanHtml: function(el) {
			var $el = $(el);
			_.each($el.find('[data-secure]'), function(e) {
				var $e = $(e);
				var _secure = $e.attr(this.secureTag);
				var _method = _secure.split('(')[0];
				var _roles = _secure.split('(')[1].replace(/\[|\]|\)|\'/ig, '').split(',');
				if(_.isFunction(this[_method]) && !this[_method].apply(this, _roles)) $e.remove();
				$e.removeAttr('data-secure');
			}, this);
			
			return $el[0];
		},
		
		// cleans all tags in the DOM
		// No html is return
		cleanDom: function() {
			this.cleanHtml($('*'));
		},
		
		// Performs the initial configuration of a Secure with a set of options.
	    _configure: function(options) {
			if (this.options) options = _.extend({}, this.options, options);
			for (var i = 0, l = secureOptions.length; i < l; i++) {
				var attr = secureOptions[i];
				if (options[attr]) this[attr] = options[attr];
			}
			this.options = options;
	    },

		// check if Secure Object has one of the roles
		// example: hasRole('ROLE_1') or hasRole(['ROLE_1', 'ROLE_2'])
		hasRole: function(roles) {
			var _r = _.intersection(this._getRolesAsArray(this.roles), this._getRolesAsArray(roles));
			if(_r.length > 0) return true;
			return false;
		},
		
		// check if Secure Object has all of the roles listed
		// example: hasAllRoles('ROLE_1') or hasAllRoles(['ROLE_1', 'ROLE_2'])
		hasAllRoles: function(roles) {
			var _r = _.intersection(this._getRolesAsArray(this.roles), this._getRolesAsArray(roles));
			if(_r.length === _roles.length) return true;
			return false;
		},
		
		// check if Secure Object has any of the roles
		// hasNoRoles('ROLE_1') or hasNoRoles(['ROLE_1', 'ROLE_2'])
		hasNoRoles: function(roles) {
			var _r = _.intersection(this._getRolesAsArray(this.roles), this._getRolesAsArray(roles));
			if(_r.length === 0) return true;
			return false;
		},
		
		// get the roles as array
		_getRolesAsArray: function(roles) {
			var _roles;
			if(_.isFunction(roles)) _roles = roles();
			else _roles = roles;
			if(!_.isArray(_roles)) _roles = [_roles];
			return _roles;
		}	
	});
	
	// should auto load
	Backbone.secure = new Secure();
	
}).call(this);
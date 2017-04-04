
caercam = window.caercam = {
	controllers : [],
	models      : [],
	views       : []
};

(function( $ ) {

	/**
	 * Custom, Mustache-like template.
	 *
	 * Borrowed from WordPress.
	 *
	 * @since    0.8
	 */
	caercam.template = _.memoize( function ( id ) {

		var compiled,
		     options = {
			evaluate:    /<#([\s\S]+?)#>/g,
			interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
			escape:      /\{\{([^\}]+?)\}\}(?!\})/g,
			variable:    'data'
		};

		return function ( data ) {
			compiled = compiled || _.template( $( '#tmpl-' + id ).html(),  options );
			return compiled( data );
		};
	} );

	_.extend( caercam.controllers, {

		/**
		 * Desktop Controller.
		 *
		 * @since    0.8
		 */
		Desktop : Backbone.Model.extend( {

			/**
			 * Initialize the Controller.
			 *
			 * @param    object    attributes
			 * @param    object    options
			 *
			 * @since    0.8
			 */
			initialize: function( attributes, options ) {

				this.windows = new Backbone.Collection;
			}

		} )

	} );

	_.extend( caercam.models, {

		/**
		 * Clock ticker Model.
		 *
		 * @since    0.8
		 */
		Clock : Backbone.Model.extend( {

			defaults : {
				date : '',
				time : ''
			},

			/**
			 * Initialize the Model.
			 *
			 * @param    object    attributes
			 * @param    object    options
			 *
			 * @since    0.8
			 */
			initialize: function( attributes, options ) {

				this.timer = setInterval( _.bind( this.tick, this ), 1000 );
			},

			/**
			 * Tick. Tick. Tick.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			tick : function() {

				var date = new Date;

				this.set({
					date : date.toLocaleDateString(),
					time : date.toLocaleTimeString()
				});

				return this;
			}
		} ),

		/**
		 * Window Model.
		 *
		 * @since    0.8
		 */
		Window : Backbone.Model.extend( {

			defaults : {
				id    : '',
				type  : '',
				icon  : '',
				title : '',
				state : 'asleep'
			}

		} )

	} );

	_.extend( caercam.views, {

		/**
		 * Clock ticker View.
		 *
		 * @since    0.8
		 */
		Clock : Backbone.View.extend( {

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize: function( options ) {

				this.model = new caercam.models.Clock;

				this.listenTo( this.model, 'change', this.tick );
			},

			/**
			 * Tick. Tick. Tick.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 * @param    object    options
			 *
			 * @return   Returns itself to allow chaining.
			 */
			tick : function( model, options ) {

				this.$( '.date' ).text( model.get( 'date' ) );
				this.$( '.time' ).text( model.get( 'time' ) );

				return this;
			},
		} ),

		/**
		 * Menu launcher View.
		 *
		 * @since    0.8
		 */
		Menu : Backbone.View.extend( {

			events : {
				'click [data-target]' : 'open'
			},

			/**
			 * Close the submenu.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			close : function() {

				this.$( '.menu-item' ).removeClass( 'active' );

				return this;
			},

			/**
			 * Open the submenu.
			 *
			 * @since    0.8
			 *
			 * @param    object    JS 'click' event.
			 *
			 * @return   Returns itself to allow chaining.
			 */
			open : function( e ) {

				var $target = this.$( e.currentTarget ),
				    $parent = $target.parents( '.menu-item' );

				this.close();

				$parent.addClass( 'active' );

				$( '#desktop' ).one( 'click', _.bind( this.close, this ) );

				return this;
			},

		} ),

		/**
		 * Context menu View.
		 *
		 * @since    0.8
		 */
		ContextMenu : Backbone.View.extend( {

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;
			},

			/**
			 * Close the menu.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			close : function() {

				this.$el.hide();

				return this;
			},

			/**
			 * Open the menu.
			 *
			 * @since    0.8
			 *
			 * @param    object    JS 'click' event.
			 *
			 * @return   Returns itself to allow chaining.
			 */
			open : function( e ) {

				this.$el.show();
				this.position( e.clientX, e.clientY );

				$( '#desktop' ).one( 'click', _.bind( this.close, this ) );

				return this;
			},

			/**
			 * Reposition the menu.
			 *
			 * @since    0.8
			 *
			 * @param    int    x
			 * @param    int    y
			 *
			 * @return   Returns itself to allow chaining.
			 */
			position : function( x, y ) {

				var width = this.$el.innerWidth(),
				   height = this.$el.innerHeight(),
				 desktopX = $( '#desktop' ).innerWidth(),
				 desktopY = $( '#desktop' ).innerHeight(),
				     left, top;

				left = x;
				if ( desktopX - x < width ) {
					left -= width;
				}

				top = y - 30;
				if ( desktopY - y < height ) {
					top -= height;
				}

				this.$el.css({
					left : left,
					top  : top,
				});

				return this;
			},

		} ),

		/**
		 * Window View.
		 *
		 * @since    0.8
		 */
		Window : Backbone.View.extend( {

			tagName : 'article',

			className : 'window',

			events : {
				'click [data-action="close"]'    : 'close',
				'click [data-action="expand"]'   : 'expand',
				'click [data-action="collapse"]' : 'collapse',
				'dblclick header'                : 'expand',
			},

			template : caercam.template( 'window' ),

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;
				this.collection = this.controller.windows;

				this.listenTo( this.model, 'change:state', this.resize );
			},

			/**
			 * Close the window.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			close : function() {

				this.controller.trigger( 'window:close', this.model );

				return this;
			},

			/**
			 * Expand the window.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			expand : function() {

				var state;

				if ( this.$el.hasClass( 'expanded' ) || this.$el.hasClass( 'collapsed' ) ) {
					state = 'active';
				} else {
					state = 'expanded';
				}

				this.model.set({ state : state });

				return this;
			},

			/**
			 * Collapse the window.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			collapse : function() {

				var state;

				if ( this.$el.hasClass( 'expanded' ) || this.$el.hasClass( 'collapsed' ) ) {
					state = 'active';
				} else {
					state = 'collapsed';
				}

				this.model.set({ state : state });

				return this;
			},

			resize : function( state ) {

				this.$el.removeClass();
				this.$el.addClass( this.className + ' type-' + this.model.get( 'type' ) + ' ' + this.model.get( 'state' ) );

				this.$el.resizable({
					minHeight : 64,
					minWidth  : 200,
					start : _.bind( function() {
						if ( 'expanded' === this.model.get( 'state' ) ) {
							this.expand();
						}
					}, this )
				});

				this.$el.draggable({
					handle  : 'header',
					opacity : .95
				});
			},

			/**
			 * Render the View.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			render : function() {

				var data = this.model.toJSON();

				this.$el.html( this.template( data ) );
				this.$el.prop( 'id', 'window-' + data.id );

				this.resize( data.state );

				return this;
			}
		} ),

		/**
		 * Windows View.
		 *
		 * @since    0.8
		 */
		Windows : Backbone.View.extend( {

			$windows : {},

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;

				this.listenTo( this.controller, 'window:open',  this.createWindow );
				this.listenTo( this.controller, 'window:close', this.deleteWindow );
			},

			/**
			 * Create a new window.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 *
			 * @return   Returns itself to allow chaining.
			 */
			createWindow : function( model ) {

				if ( _.has( this.$windows, model.get( 'id' ) ) ) {
					return;
				}

				var window = new caercam.views.Window({
					model      : model,
					controller : this.controller
				});

				this.$windows[ model.get( 'id' ) ] = window;

				this.$el.append( window.render().el );

				return this;
			},

			/**
			 * Delete a window.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 *
			 * @return   Returns itself to allow chaining.
			 */
			deleteWindow : function( model ) {

				this.$windows[ model.get( 'id' ) ].remove();

				delete this.$windows[ model.get( 'id' ) ];

				return this;
			}
		} ),

		/**
		 * Icon View.
		 *
		 * @since    0.8
		 */
		Icon : Backbone.View.extend( {

			events : {
				'dblclick [data-target]' : 'open',
			},

			template : caercam.template( 'icon' ),

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;
			},

			/**
			 * Open the related window.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			open : function() {

				this.controller.trigger( 'window:open', this.model );

				return this;
			},

			/**
			 * Render the View.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			render : function() {

				var data = this.model.toJSON();

				this.$el.html( this.template( data ) );

				return this;
			}

		} ),

		/**
		 * Icons View.
		 *
		 * @since    0.8
		 */
		Icons : Backbone.View.extend( {

			$icons : {},

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;
				this.collection = this.controller.windows;

				this.listenTo( this.collection, 'add',    this.createIcon );
				this.listenTo( this.collection, 'remove', this.deleteIcon );
			},

			/**
			 * Create a new icon.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 *
			 * @return   Returns itself to allow chaining.
			 */
			createIcon : function( model ) {

				var icon = new caercam.views.Icon({
					model      : model,
					controller : this.controller
				});

				this.$icons[ model.get( 'id' ) ] = icon;

				this.$el.append( icon.render().el );

				return this;
			},

			/**
			 * Delete a specific icon.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 *
			 * @return   Returns itself to allow chaining.
			 */
			deleteIcon : function( model ) {

				this.$icons[ model.get( 'id' ) ].remove();

				delete this.$icons[ model.get( 'id' ) ];

				return this;
			}

		} ),

		/**
		 * Task View.
		 *
		 * @since    0.8
		 */
		Task : Backbone.View.extend( {

			tagName : 'li',

			className : 'menu-item',

			events : {
				'click [data-target]' : 'toggleWindow',
			},

			template : caercam.template( 'task' ),

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;

				this.listenTo( this.model, 'change:state', this.render );
			},

			/**
			 * Toggle the related window.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			toggleWindow : function( e ) {

				if ( 'collapsed' === this.model.get( 'state' ) ) {
					this.model.set({ state : 'active' });
				} else {
					this.model.set({ state : 'collapsed' });
				}

				return this;
			},

			/**
			 * Render the View.
			 *
			 * @since    0.8
			 *
			 * @return   Returns itself to allow chaining.
			 */
			render : function() {

				var data = this.model.toJSON();

				this.$el.html( this.template( data ) );

				this.$el.removeClass();
				this.$el.addClass( this.className + ' ' + data.state );

				return this;
			}

		} ),

		/**
		 * Taskbar View.
		 *
		 * @since    0.8
		 */
		Taskbar : Backbone.View.extend( {

			$tasks : {},

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;

				this.listenTo( this.controller, 'window:open',  this.createTask );
				this.listenTo( this.controller, 'window:close', this.deleteTask );
			},

			/**
			 * Create a new task.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 *
			 * @return   Returns itself to allow chaining.
			 */
			createTask : function( model ) {

				if ( _.has( this.$tasks, model.get( 'id' ) ) ) {
					return;
				}

				var task = new caercam.views.Task({
					model      : model,
					controller : this.controller
				});

				this.$tasks[ model.get( 'id' ) ] = task;

				this.$( '.taskbar-launcher' ).append( task.render().el );

				return this;
			},

			/**
			 * Delete a task.
			 *
			 * @since    0.8
			 *
			 * @param    object    model
			 *
			 * @return   Returns itself to allow chaining.
			 */
			deleteTask : function( model ) {

				this.$tasks[ model.get( 'id' ) ].remove();

				delete this.$tasks[ model.get( 'id' ) ];

				return this;
			}

		} ),

		/**
		 * Desktop View.
		 *
		 * @since    0.8
		 */
		Desktop : Backbone.View.extend( {

			events : {
				'contextmenu' : 'openContextMenu',
			},

			/**
			 * Initialize the View.
			 *
			 * @since    0.8
			 *
			 * @param    object    options
			 */
			initialize : function( options ) {

				this.controller = options.controller;

				this.icons   = new caercam.views.Icons({ el : $( '#icon-group' ), controller : this.controller });
				this.windows = new caercam.views.Windows({ el : $( '#windows' ), controller : this.controller });
				this.taskbar = new caercam.views.Taskbar({ el : $( '#taskbar' ), controller : this.controller });
				this.context = new caercam.views.ContextMenu({ el : $( '#context-menu' ), controller : this.controller });
			},

			/**
			 * Open the context menu.
			 *
			 * @since    0.8
			 *
			 * @param    object    JS 'contextmenu' event.
			 *
			 * @return   Returns itself to allow chaining.
			 */
			openContextMenu : function( e ) {

				e.preventDefault();
				e.stopPropagation();

				this.context.open( e );

				return this;
			},

		} ),

	} );

	_.extend( caercam, {

		menu : _.extend( {}, {

			run : function() {

				var $launcher = $( '#launcher' ),
				         menu = new caercam.views.Menu({ el : $launcher });

				return menu;
			}

		} ),

		ticker : _.extend( {}, {

			run : function() {

				var $ticker = $( '#date' ),
				      clock = new caercam.views.Clock({ el : $ticker });

				return clock;
			},
		} ),

		desktop : _.extend( {}, {

			windows : [
				{
					id    : 'personal',
					type  : 'folder',
					icon  : 'icon-folder',
					title : 'Personal',
				},
				{
					id    : 'projects',
					type  : 'folder',
					icon  : 'icon-folder',
					title : 'Projects',
				},
				{
					id    : 'work',
					type  : 'folder',
					icon  : 'icon-folder',
					title : 'Work',
				},
				{
					id    : 'contact',
					type  : 'app',
					icon  : 'icon-mail',
					title : 'Contact',
				}
			],

			run : function() {

				var $desktop = $( '#desktop' ),
				     desktop = new caercam.views.Desktop({
					el         : $desktop,
					controller : new caercam.controllers.Desktop,
				});

				_.each( this.windows, function( window ) {
					desktop.controller.windows.add( new caercam.models.Window( window ) );
				}, this );

				return desktop;
			},
		} ),

		run: function() {

			this.menu   = this.menu.run();
			this.ticker = this.ticker.run();

			this.desktop = this.desktop.run();
		}
	} );

} )( jQuery );

jQuery( document ).ready( caercam.run() );

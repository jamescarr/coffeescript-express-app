$(function(){
  // -- local storage
  function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  };
  var Store = function(name) {
    this.name = name;
    var store = localStorage.getItem(this.name);
    this.data = (store && JSON.parse(store)) || {};
  };
  _.extend(Store.prototype, {
    save: function() {
      localStorage.setItem(this.name, JSON.stringify(this.data));
    },
    create: function(model) {
      if (!model.id) model.id = model.attributes.id = guid();
      this.data[model.id] = model;
      this.save();
      return model;
    },
    update: function(model) {
      this.data[model.id] = model;
      this.save();
      return model;
    },
    find: function(model) {
      return this.data[model.id];
    },
    findAll: function() {
      return _.values(this.data);
    },
    destroy: function(model) {
      delete this.data[model.id];
      this.save();
      return model;
    }
  });

  Backbone.sync = function(method, model, options) {
    var resp;
    var store = model.localStorage || model.collection.localStorage;

    switch (method) {
      case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
      case "create":  resp = store.create(model);                            break;
      case "update":  resp = store.update(model);                            break;
      case "delete":  resp = store.destroy(model);                           break;
    }

    if (resp) {
      options.success(resp);
    } else {
      options.error("Record not found");
    }
  };
  // -- end local storage
  
  window.Todo = Backbone.Model.extend({
    defaults: {
      content: "empty todo...",
      done: false
    },
    initialize: function(){
      if(!this.get("content")){
        this.set({"content":this.defaults.content})
      }
    },
    toggle: function(){
      this.save({done: !this.get("done") })
    },
    clear: function(){
      this.destroy();
      this.view.remove();
    }
  });
  
  window.TodoList = Backbone.Collection.extend({
    model: Todo,
    localStorage: new Store("todos"),
    done: function(){
      return this.filter(function(todo){ return todo.get('done'); });
    },
    remaining: function(){
      return this.without.apply(this, this.done());
    },
    nextOrder: function(){
      if(!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: function(todo){
      return todo.get('order')
    }
  });
  
  window.Todos = new TodoList;

  window.TodoView = Backbone.View.extend({
    tagName: 'li', 
    template: _.template($('#item-template').html()),
    events: {
      "click .check"              : "toggleDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "clear",
      "keypress .todo-input"      : "updateOnEnter"
    },
    initialize: function() {
      _.bindAll(this, 'render', 'close');
      this.model.bind('change', this.render);
      this.model.view = this;
    },
    render: function(){
      $(this.el).html(this.template(this.model.toJSON()));
      this.setContent();
      return this;
    },
    setContent: function() {
      var content = this.model.get('content');
      this.$('.todo-content').text(content);
      this.input = this.$('.todo-input');
      this.input.bind('blur', this.close);
      this.input.val(content);
    },
    toggleDone: function(){
      this.model.toggle();
    },
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },
    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },
    remove: function() {
      $(this.el).remove();
    },
    clear: function() {
      this.model.clear();
    }
  });
  
  window.AppView = Backbone.View.extend({
    el: $('#todoapp'),
    statsTemplate: _.template($('#stats-template').html()),
    events: {
      "keypress #new-todo":  "createOnEnter",
      "keyup #new-todo":     "showTooltip",
      "click .todo-clear a": "clearCompleted"
    },

    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');

      this.input    = this.$("#new-todo");

      Todos.bind('add',     this.addOne);
      Todos.bind('reset',   this.addAll);
      Todos.bind('all',     this.render);

      Todos.fetch();
    },
    clearCompleted: function() {
      _.each(Todos.done(), function(todo){ todo.clear(); });
      return false;
    },
    render: function() {
      this.$('#todo-stats').html(this.statsTemplate({
        total:      Todos.length,
        done:       Todos.done().length,
        remaining:  Todos.remaining().length
      }));
    },
    addOne: function(todo){
      var view = new TodoView({model:todo});
      this.$('#todo-list').append(view.render().el);
    },
    addAll: function(){
      Todos.each(this.addOne);
    },
    newAttributes: function(){
      return {
        content: this.input.val(),
        order: Todos.nextOrder(),
        done: false
      };
    },
    createOnEnter: function(e){
      if (e.keyCode != 13) return;
      Todos.create(this.newAttributes());
      this.input.val('');
    },
    showTooltip: function(e){
      var tooltip = this.$('.ui-tooltip-top');
      var val = this.input.val();
      tooltip.fadeOut();
      if(this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      var show = function(){ tooltip.show().fadeIn(); };
      this.tooltipTimeout = _.delay(show, 1000);
    }
    
  });
  window.App = new AppView;
});

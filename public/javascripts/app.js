(function() {
  $(function() {
    var S4, Store, guid;
    S4 = function() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    guid = function() {
      return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
    };
    Store = (function() {
      function Store(name) {
        var store;
        this.name = name;
        store = localStorage.getItem(this.name);
        this.data = (store && JSON.parse(store)) || {};
      }
      Store.prototype.save = function() {
        return localStorage.setItem(this.name, JSON.stringify(this.data));
      };
      Store.prototype.create = function(model) {
        if (!model.id) {
          model.id = model.attributes.id = guid();
        }
        this.data[model.id] = model;
        this.save();
        return model;
      };
      Store.prototype.update = function(model) {
        this.data[model.id] = model;
        this.save();
        return model;
      };
      Store.prototype.find = function(model) {
        return this.data[model.id];
      };
      Store.prototype.findAll = function() {
        return _.values(this.data);
      };
      Store.prototype.destroy = function(model) {
        delete this.data[model.id];
        this.save();
        return model;
      };
      return Store;
    })();
    Backbone.sync = function(method, model, options) {
      var resp, store;
      store = model.localStorage || model.collection.localStorage;
      switch (method) {
        case "read":
          resp = (model.id ? store.find(model) : store.findAll());
          break;
        case "create":
          resp = store.create(model);
          break;
        case "update":
          resp = store.update(model);
          break;
        case "delete":
          resp = store.destroy(model);
      }
      if (resp) {
        return options.success(resp);
      } else {
        return options.error("Record not found");
      }
    };
    window.Todo = Backbone.Model.extend({
      defaults: {
        content: "empty todo...",
        done: false
      },
      initialize: function() {
        if (!this.get("content")) {
          return this.set({
            content: this.defaults.content
          });
        }
      },
      toggle: function() {
        return this.save({
          done: !this.get("done")
        });
      },
      clear: function() {
        this.destroy();
        return this.view.remove();
      }
    });
    window.TodoList = Backbone.Collection.extend({
      model: Todo,
      localStorage: new Store("todos"),
      done: function() {
        return this.filter(function(todo) {
          return todo.get("done");
        });
      },
      remaining: function() {
        return this.without.apply(this, this.done());
      },
      nextOrder: function() {
        if (!this.length) {
          return 1;
        }
        return this.last().get("order") + 1;
      },
      comparator: function(todo) {
        return todo.get("order");
      }
    });
    window.Todos = new TodoList;
    window.TodoView = Backbone.View.extend({
      tagName: "li",
      template: _.template($("#item-template").html()),
      events: {
        "click .check": "toggleDone",
        "dblclick div.todo-content": "edit",
        "click span.todo-destroy": "clear",
        "keypress .todo-input": "updateOnEnter"
      },
      initialize: function() {
        _.bindAll(this, "render", "close");
        this.model.bind("change", this.render);
        return this.model.view = this;
      },
      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        this.setContent();
        return this;
      },
      setContent: function() {
        var content;
        content = this.model.get("content");
        this.$(".todo-content").text(content);
        this.input = this.$(".todo-input");
        this.input.bind("blur", this.close);
        return this.input.val(content);
      },
      toggleDone: function() {
        return this.model.toggle();
      },
      edit: function() {
        $(this.el).addClass("editing");
        return this.input.focus();
      },
      close: function() {
        this.model.save({
          content: this.input.val()
        });
        return $(this.el).removeClass("editing");
      },
      updateOnEnter: function(e) {
        if (e.keyCode === 13) {
          return this.close();
        }
      },
      remove: function() {
        return $(this.el).remove();
      },
      clear: function() {
        return this.model.clear();
      }
    });
    window.AppView = Backbone.View.extend({
      el: $("#todoapp"),
      statsTemplate: _.template($("#stats-template").html()),
      events: {
        "keypress #new-todo": "createOnEnter",
        "keyup #new-todo": "showTooltip",
        "click .todo-clear a": "clearCompleted"
      },
      initialize: function() {
        _.bindAll(this, "addOne", "addAll", "render");
        this.input = this.$("#new-todo");
        Todos.bind("add", this.addOne);
        Todos.bind("reset", this.addAll);
        Todos.bind("all", this.render);
        return Todos.fetch();
      },
      clearCompleted: function() {
        _.each(Todos.done(), function(todo) {
          return todo.clear();
        });
        return false;
      },
      render: function() {
        return this.$("#todo-stats").html(this.statsTemplate({
          total: Todos.length,
          done: Todos.done().length,
          remaining: Todos.remaining().length
        }));
      },
      addOne: function(todo) {
        var view;
        console.log(todo);
        view = new TodoView({
          model: todo
        });
        return this.$("#todo-list").append(view.render().el);
      },
      addAll: function() {
        return Todos.each(this.addOne);
      },
      newAttributes: function() {
        return {
          content: this.input.val(),
          order: Todos.nextOrder(),
          done: false
        };
      },
      createOnEnter: function(e) {
        if (e.keyCode !== 13) {
          return;
        }
        Todos.create(this.newAttributes());
        return this.input.val("");
      },
      showTooltip: function(e) {
        var show, tooltip, val;
        tooltip = this.$(".ui-tooltip-top");
        val = this.input.val();
        tooltip.fadeOut();
        if (this.tooltipTimeout) {
          clearTimeout(this.tooltipTimeout);
        }
        show = function() {
          return tooltip.show().fadeIn();
        };
        return this.tooltipTimeout = _.delay(show, 1000);
      }
    });
    return window.App = new AppView;
  });
}).call(this);

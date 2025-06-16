const fs = require('fs');
const path = require('path');
const os = require('os');

class TodoManager {
  constructor() {
    this.todoFile = path.join(os.homedir(), '.todos.json');
    this.ensureFileExists();
  }

  ensureFileExists() {
    if (!fs.existsSync(this.todoFile)) {
      fs.writeFileSync(this.todoFile, JSON.stringify([], null, 2));
    }
  }

  loadTodos() {
    try {
      const data = fs.readFileSync(this.todoFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  saveTodos(todos) {
    fs.writeFileSync(this.todoFile, JSON.stringify(todos, null, 2));
  }

  addTodo(text) {
    const todos = this.loadTodos();
    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    this.saveTodos(todos);
    return newTodo;
  }

  listTodos() {
    return this.loadTodos();
  }

  completeTodo(id) {
    const todos = this.loadTodos();
    const todo = todos.find(t => t.id === parseInt(id));
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos(todos);
      return todo;
    }
    return null;
  }

  deleteTodo(id) {
    const todos = this.loadTodos();
    const index = todos.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      const deleted = todos.splice(index, 1)[0];
      this.saveTodos(todos);
      return deleted;
    }
    return null;
  }

  clearCompleted() {
    const todos = this.loadTodos();
    const remaining = todos.filter(t => !t.completed);
    const cleared = todos.length - remaining.length;
    this.saveTodos(remaining);
    return cleared;
  }
}

module.exports = TodoManager;
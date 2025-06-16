#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const TodoManager = require('../lib/todoManager');

class TodoApp {
  constructor() {
    this.todoManager = new TodoManager();
    this.running = true;
  }

  async start() {
    console.log(chalk.bold.blue('\n🗒️  Todo CLI\n'));
    
    while (this.running) {
      await this.showTodoList();
    }
    
    console.log(chalk.green('\n👋 Goodbye!\n'));
  }

  async showTodoList() {
    const todos = this.todoManager.listTodos();
    const pendingCount = todos.filter(t => !t.completed).length;
    const completedCount = todos.filter(t => t.completed).length;

    console.clear();
    console.log(chalk.bold.blue('🗒️  Todo CLI'));
    console.log(chalk.gray(`📋 ${pendingCount} pending, ${completedCount} completed\n`));

    if (todos.length === 0) {
      console.log(chalk.gray('📭 No todos yet!\n'));
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '📝 Add new todo', value: 'add' },
            { name: '🚪 Quit', value: 'quit' }
          ]
        }
      ]);

      if (action === 'add') {
        await this.addTodo();
      } else {
        this.running = false;
      }
      return;
    }

    // Create todo choices with toggle action
    const todoChoices = todos.map(todo => ({
      name: `${todo.completed ? chalk.green('✅') : chalk.red('⭕')} ${todo.completed ? chalk.strikethrough.gray(todo.text) : todo.text}`,
      value: `toggle_${todo.id}`,
      short: `Toggle: ${todo.text}`
    }));

    // Add action choices
    const actionChoices = [
      new inquirer.Separator('━━━ Actions ━━━'),
      { name: '📝 Add new todo', value: 'add' },
      { name: '✏️  Edit mode (bulk operations)', value: 'edit' },
      { name: '🗑️  Clear completed todos', value: 'clear' },
      { name: '🚪 Quit', value: 'quit' }
    ];

    const allChoices = [...todoChoices, ...actionChoices];

    console.log(chalk.bold('Your Todos:'));
    console.log(chalk.gray('Select any todo to toggle completion, or choose an action below\n'));

    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Select todo or action:',
        choices: allChoices,
        pageSize: 20
      }
    ]);

    // Handle selection
    if (selection.startsWith('toggle_')) {
      const todoId = parseInt(selection.replace('toggle_', ''));
      const updated = this.todoManager.completeTodo(todoId);
      const status = updated.completed ? 'completed' : 'reopened';
      console.log(chalk.green(`\n✅ Todo ${status}: ${updated.text}`));
      setTimeout(() => {}, 500); // Brief pause to see the message
    } else {
      switch (selection) {
        case 'add':
          await this.addTodo();
          break;
        case 'edit':
          await this.editMode();
          break;
        case 'clear':
          await this.clearCompleted();
          break;
        case 'quit':
          this.running = false;
          break;
      }
    }
  }

  async addTodo() {
    console.log(chalk.bold('\n📝 Add New Todo'));
    
    const { text } = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Enter your todo:',
        validate: input => input.trim() ? true : 'Please enter a todo item'
      }
    ]);

    if (text.trim()) {
      const todo = this.todoManager.addTodo(text.trim());
      console.log(chalk.green('✅ Added:'), todo.text);
      setTimeout(() => {}, 800); // Brief pause
    }
  }

  async editMode() {
    const todos = this.todoManager.listTodos();
    
    if (todos.length === 0) {
      console.log(chalk.gray('\n📭 No todos found.\n'));
      setTimeout(() => {}, 1000);
      return;
    }

    console.clear();
    console.log(chalk.bold.blue('✏️  Edit Mode - Bulk Operations\n'));

    const choices = todos.map(todo => ({
      name: `${todo.completed ? chalk.green('✅') : chalk.red('⭕')} ${todo.completed ? chalk.strikethrough.gray(todo.text) : todo.text}`,
      value: todo.id,
      checked: false
    }));

    const { selectedIds } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedIds',
        message: 'Select todos for bulk operations (SPACE to select, ENTER to confirm):',
        choices: choices,
        pageSize: 15
      }
    ]);

    if (selectedIds.length === 0) {
      console.log(chalk.gray('\n❌ No items selected.'));
      setTimeout(() => {}, 1000);
      return;
    }

    const { bulkAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'bulkAction',
        message: `What would you like to do with ${selectedIds.length} selected item(s)?`,
        choices: [
          { name: '✅ Mark all as completed', value: 'complete' },
          { name: '⭕ Mark all as pending', value: 'uncomplete' },
          { name: '🗑️  Delete all selected', value: 'delete' },
          { name: '🔙 Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (bulkAction === 'cancel') return;

    let count = 0;
    selectedIds.forEach(id => {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      switch (bulkAction) {
        case 'complete':
          if (!todo.completed) {
            this.todoManager.completeTodo(id);
            count++;
          }
          break;
        case 'uncomplete':
          if (todo.completed) {
            this.todoManager.completeTodo(id);
            count++;
          }
          break;
        case 'delete':
          this.todoManager.deleteTodo(id);
          count++;
          break;
      }
    });

    const actionText = {
      'complete': 'completed',
      'uncomplete': 'marked as pending',
      'delete': 'deleted'
    };

    console.log(chalk.green(`\n✅ ${count} todo(s) ${actionText[bulkAction]}!`));
    setTimeout(() => {}, 1200);
  }

  async clearCompleted() {
    const cleared = this.todoManager.clearCompleted();
    if (cleared > 0) {
      console.log(chalk.green(`\n🗑️  Cleared ${cleared} completed todo(s)!`));
    } else {
      console.log(chalk.gray('\n📭 No completed todos to clear.'));
    }
    setTimeout(() => {}, 1200);
  }
}

const app = new TodoApp();
app.start().catch(console.error);
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-06-30

### Documentation Improvements
- **Comprehensive README Overhaul**: Complete rewrite of README.md to

---

## [1.1.1] - 2025-06-16

### Bug Fixes
- **Fixed Terminal Width Compatibility**: Resolved UI corruption when terminal window is narrower than todo content
  - Fixed line wrapping issues that caused display artifacts
  - Eliminated duplicate rendering and garbled text
  - Improved cursor positioning for narrow terminal windows
  - Navigation now works reliably across all terminal widths

### Technical Improvements
- **Simplified Display Logic**: Replaced complex cursor positioning with full-screen refresh approach
- **Enhanced Terminal Compatibility**: Better handling of various terminal sizes and line wrapping behavior

---

## [1.1.0] - 2025-06-16

### Major Features Added
- **Natural Language Input**: Complete redesign with natural language parsing for todo creation
  - Priority indicators: `!` for high priority, `_` for low priority
  - Tag support: `@work`, `@home`, etc.
  - Due date parsing: `(2d)`, `(tomorrow)`, `(2025-07-01)`, etc.
  - Example: `!Fix critical bug (2d) @work`

- **Tag-Based Organization**: Migrated from categories to flexible tagging system
  - Tags replace predefined categories for better flexibility
  - Backward compatibility with existing todos
  - Multiple tags per todo support

### Interface Improvements
- **Visual Grouping**: Todos now grouped by tags with visual separators
- **Smart Sorting**: Within each tag group:
  - Primary sort by priority (High → Medium → Low)
  - Secondary sort by due date (earliest first)
- **Tag Ordering**: `@global` appears first, then alphabetical tag sorting
- **Improved Spacing**: Added empty lines between tag groups and before Actions section
- **Enhanced Due Date Display**: Smart relative dates (Today, Tomorrow, 2d, etc.)

### New User Experience
- **True In-Place Todo Toggling**: Custom terminal control implementation
  - No screen refresh when toggling todos (⭕ ↔ ✅)
  - Cursor maintains exact position after status changes
  - Real-time visual feedback without interface disruption
- **Keyboard Shortcuts**: Instant action shortcuts implemented
  - `n` - Add new todo
  - `f` - Filter & search
  - `e` - Edit mode (bulk operations)
  - `o` - Options menu
  - `ESC/q` - Refresh/return
- **Custom Navigation System**: Raw terminal input handling
  - ↑↓ arrow key navigation
  - ENTER to toggle todos in-place
  - Direct keyboard shortcuts bypass menu navigation

### Enhanced Functionality
- **Comprehensive Filtering**: Filter by text, tag, priority, status, and overdue items
- **Bulk Operations**: Edit mode for mass updates (complete, priority changes, delete)
- **Advanced Statistics**: Detailed stats by priority and tag
- **Debug Mode**: Added `--debug` flag for troubleshooting
- **Overdue Tracking**: Clear visual indicators for overdue items

### Technical Improvements
- **Custom Terminal Control**: Raw keypress handling with proper cleanup
- **Advanced Cursor Management**: Precise positioning for in-place updates
- **Improved Error Handling**: Better user feedback and error messages
- **Code Refactoring**: Cleaner separation of concerns between UI and data management

### Bug Fixes
- Fixed duplicate variable declarations causing syntax errors
- Resolved issues with options menu items
- Fixed cursor positioning bugs in todo status updates
- Eliminated visual artifacts and duplicate display entries
- Improved stability of custom terminal input handling

---

## [1.0.0] - prior to 2025-06-16

### Initial Releases
- Basic CLI todo functionality
- Arrow key navigation
- Simple todo creation and completion
- File-based storage in `~/.todos.json`
- Multiple attempts at keyboard shortcuts (reverted due to compatibility issues)
- Various UI improvements and bug fixes
- Debug mode implementation
- Package preparation for npm publishing
- Item categories

---

## Upgrade Notes

### From 1.0.0 to 1.1.0
- **Automatic Migration**: Existing todos will be automatically migrated to the new format
- **Category → Tags**: Old categories become tags (e.g., "work" category becomes "@work" tag)
- **New Input Format**: Learn the natural language format for faster todo creation
- **Interface Changes**: Todos are now grouped by tags instead of showing inline

### Breaking Changes
- Natural language input format replaces multi-step todo creation
- Visual layout significantly changed with tag-based grouping
- Custom terminal navigation replaces inquirer.js prompts for main interface

### New Features in v1.1.0
- **Instant Keyboard Shortcuts**: Press `n`, `f`, `e`, or `o` from anywhere to quickly access actions
- **Perfect In-Place Toggling**: Toggle todo status without any screen refresh or cursor movement
- **Advanced Terminal Control**: Custom raw input handling for responsive user experience

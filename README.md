# Prompt Library Application

A simple, clean prompt library application built with HTML, CSS, and JavaScript that allows you to save, organize, and manage AI prompts locally in your browser.

## Features

- **Add Prompts**: Create new prompts with a title and content
- **Save to localStorage**: All prompts are stored locally in your browser
- **Display Cards**: View saved prompts in clean, modern cards
- **Content Preview**: See a preview of each prompt's content (first 12 words)
- **Delete Prompts**: Remove prompts you no longer need
- **Modern UI**: Clean, developer-themed interface with responsive design

## How to Use

1. Open `index.html` in your browser or use Live Server
2. Fill in the "Title" and "Content" fields in the form
3. Click "Save Prompt" to add it to your library
4. View your saved prompts in the cards below
5. Click "Delete" on any card to remove that prompt

## Technical Details

- **Storage**: Uses browser's localStorage for persistence
- **No Dependencies**: Pure HTML, CSS, and JavaScript
- **Responsive**: Works on desktop and mobile devices
- **Accessible**: Includes proper ARIA labels and keyboard navigation

## Files

- `index.html` - Main HTML structure
- `styles.css` - Modern CSS styling with developer theme
- `script.js` - JavaScript functionality for CRUD operations

## Prompt Used to Create This Project

```
Create a prompt library application in HTML, CSS, and JavaScript.

Create an HTML page with a form containing fields for the prompt title and content

Add a save prompt button that saves to localStorage

Display saved prompts in cards

Each prompt card should show the title, a content preview of a few words, and a delete button

Deleting should remove the prompt from localStorage and update the display

Style it with CSS to look clean and modern with a developer theme

Include all HTML structure, CSS styling, and JavaScript functionality in their own files, but that can be run immediately and includes no other features. I want to be able to use live server to press "go live" and see the application. do not add other dependencies, Do not add any other feature. update @README.md for junior developer about the projects and the prompt i used
```

This project demonstrates practical prompt engineering by creating a functional application from a detailed specification, showing how clear requirements can lead to effective code generation.
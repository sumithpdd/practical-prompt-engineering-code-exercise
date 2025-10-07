(function() {
  const STORAGE_KEY = 'promptLibrary.items.v1';

  const form = document.getElementById('prompt-form');
  const titleInput = document.getElementById('prompt-title');
  const contentInput = document.getElementById('prompt-content');
  const errorEl = document.getElementById('form-error');
  const listEl = document.getElementById('prompts-list');
  const emptyEl = document.getElementById('prompts-empty');
  const countEl = document.getElementById('prompt-count');
  const cardTemplate = document.getElementById('prompt-card-template');

  function loadPrompts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data
        .filter(p => p && typeof p.id === 'string')
        .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch (e) {
      console.warn('Failed to parse stored prompts', e);
      return [];
    }
  }

  function savePrompts(prompts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch (e) {
      console.error('Failed to save prompts', e);
    }
  }

  function createId() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function trim(str) { return (str || '').trim(); }

  function render(prompts) {
    listEl.innerHTML = '';

    if (!prompts.length) {
      emptyEl.hidden = false;
      countEl.textContent = '0';
      return;
    }
    emptyEl.hidden = true;
    countEl.textContent = String(prompts.length);

    const frag = document.createDocumentFragment();
    prompts.forEach(p => {
      const node = cardTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = p.id;
      node.querySelector('.card-title').textContent = p.title;
      node.querySelector('.card-preview').textContent = preview(p.content);
      
      // Set up rating component
      const ratingContainer = node.querySelector('.rating-container');
      ratingContainer.dataset.promptId = p.id;
      updateRatingDisplay(p.id, p.rating || null);
      
      // Add rating event listeners
      const starBtns = ratingContainer.querySelectorAll('.star-btn');
      starBtns.forEach(star => {
        star.addEventListener('click', () => setRating(p.id, parseInt(star.dataset.rating)));
        star.addEventListener('mouseenter', () => previewRating(p.id, parseInt(star.dataset.rating)));
        star.addEventListener('mouseleave', () => clearPreview(p.id));
      });
      
      // Set up notes section
      const notesSection = node.querySelector('.notes-section');
      notesSection.dataset.promptId = p.id;
      setupNotesSection(p.id, notesSection);
      
      const delBtn = node.querySelector('.delete-btn');
      delBtn.addEventListener('click', () => deletePrompt(p.id));
      frag.appendChild(node);
    });
    listEl.appendChild(frag);
  }

  function preview(text) {
    const words = trim(text).split(/\s+/).slice(0, 12);
    const joined = words.join(' ');
    return joined + (trim(text).split(/\s+/).length > words.length ? ' …' : '');
  }

  function deletePrompt(id) {
    const prompts = loadPrompts().filter(p => p.id !== id);
    savePrompts(prompts);
    render(prompts);
  }

  // Rating functionality
  function setRating(promptId, rating) {
    const prompts = loadPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    
    if (!prompt) return;
    
    // Toggle off if same rating clicked
    if (prompt.rating === rating) {
      prompt.rating = null;
    } else {
      prompt.rating = rating;
    }
    
    savePrompts(prompts);
    updateRatingDisplay(promptId, prompt.rating);
  }

  function updateRatingDisplay(promptId, rating) {
    const container = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (!container) return;
    
    const stars = container.querySelectorAll('.star-btn');
    stars.forEach((star, index) => {
      const starValue = index + 1;
      star.innerHTML = starValue <= (rating || 0) ? '★' : '☆';
      star.classList.toggle('active', starValue <= (rating || 0));
    });
  }

  function previewRating(promptId, rating) {
    const container = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (!container) return;
    
    const stars = container.querySelectorAll('.star-btn');
    stars.forEach((star, index) => {
      const starValue = index + 1;
      star.innerHTML = starValue <= rating ? '★' : '☆';
    });
  }

  function clearPreview(promptId) {
    const prompts = loadPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      updateRatingDisplay(promptId, prompt.rating);
    }
  }

  // Notes functionality
  function setupNotesSection(promptId, notesSection) {
    const notesToggleBtn = notesSection.querySelector('.notes-toggle-btn');
    const addNoteBtn = notesSection.querySelector('.add-note-btn');
    const notesContent = notesSection.querySelector('.notes-content');
    const notesList = notesSection.querySelector('.notes-list');
    const addNoteForm = notesSection.querySelector('.add-note-form');
    const noteTextarea = notesSection.querySelector('.note-textarea');
    const charCounter = notesSection.querySelector('.char-counter');
    const saveNoteBtn = notesSection.querySelector('.save-note-btn');
    const cancelNoteBtn = notesSection.querySelector('.cancel-note-btn');
    const noteError = notesSection.querySelector('.note-error');
    const notesCount = notesSection.querySelector('.notes-count');

    // Load and display notes
    const notes = getNotesForPrompt(promptId);
    updateNotesDisplay(notesList, notes, promptId);
    updateNotesCount(notesCount, notes.length);

    // Toggle notes section
    notesToggleBtn.addEventListener('click', () => {
      const isExpanded = notesContent.style.display !== 'none';
      if (isExpanded) {
        notesContent.style.display = 'none';
        notesToggleBtn.classList.remove('expanded');
        hideAddNoteForm();
      } else {
        notesContent.style.display = 'block';
        notesToggleBtn.classList.add('expanded');
      }
    });

    // Add note button
    addNoteBtn.addEventListener('click', () => {
      showAddNoteForm();
    });

    // Character counter
    noteTextarea.addEventListener('input', () => {
      const length = noteTextarea.value.length;
      charCounter.textContent = `${length}/500`;
      
      // Update counter color based on length
      charCounter.classList.remove('warning', 'error');
      if (length > 450) {
        charCounter.classList.add('warning');
      }
      if (length > 500) {
        charCounter.classList.add('error');
      }

      // Enable/disable save button
      saveNoteBtn.disabled = length < 5 || length > 500;
    });

    // Save note
    saveNoteBtn.addEventListener('click', () => {
      const content = noteTextarea.value.trim();
      if (content.length < 5) {
        showNoteError('Note must be at least 5 characters long');
        return;
      }
      if (content.length > 500) {
        showNoteError('Note cannot exceed 500 characters');
        return;
      }

      // Check for duplicates
      const existingNotes = getNotesForPrompt(promptId);
      if (existingNotes.some(note => note.content === content)) {
        showNoteError('This note already exists');
        return;
      }

      // Check note limit
      if (existingNotes.length >= 10) {
        showNoteError('Maximum of 10 notes per prompt');
        return;
      }

      addNoteToPrompt(promptId, content);
      hideAddNoteForm();
      updateNotesDisplay(notesList, getNotesForPrompt(promptId), promptId);
      updateNotesCount(notesCount, getNotesForPrompt(promptId).length);
    });

    // Cancel note
    cancelNoteBtn.addEventListener('click', () => {
      hideAddNoteForm();
    });

    function showAddNoteForm() {
      addNoteForm.style.display = 'block';
      noteTextarea.focus();
      noteTextarea.value = '';
      charCounter.textContent = '0/500';
      charCounter.classList.remove('warning', 'error');
      saveNoteBtn.disabled = true;
      hideNoteError();
    }

    function hideAddNoteForm() {
      addNoteForm.style.display = 'none';
      noteTextarea.value = '';
      hideNoteError();
    }

    function showNoteError(message) {
      noteError.textContent = message;
      noteError.style.display = 'block';
    }

    function hideNoteError() {
      noteError.style.display = 'none';
    }
  }

  function getNotesForPrompt(promptId) {
    const prompts = loadPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    return prompt?.notes || [];
  }

  function addNoteToPrompt(promptId, content) {
    const prompts = loadPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    
    if (!prompt) return;

    if (!prompt.notes) {
      prompt.notes = [];
    }

    const note = {
      id: 'note_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      content: content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    prompt.notes.unshift(note); // Add to beginning (newest first)
    savePrompts(prompts);
  }

  function updateNotesDisplay(notesList, notes, promptId) {
    notesList.innerHTML = '';

    if (notes.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'notes-empty';
      emptyDiv.textContent = 'No notes yet. Add your first note!';
      notesList.appendChild(emptyDiv);
      return;
    }

    notes.forEach(note => {
      const noteElement = createNoteElement(note, promptId);
      notesList.appendChild(noteElement);
    });
  }

  function createNoteElement(note, promptId) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item';
    noteDiv.dataset.noteId = note.id;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';
    contentDiv.textContent = note.content;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'note-meta';

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'note-timestamp';
    timestampSpan.textContent = formatTimestamp(note.createdAt);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'note-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'note-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editNote(note.id, promptId));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'note-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteNote(note.id, promptId));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    metaDiv.appendChild(timestampSpan);
    metaDiv.appendChild(actionsDiv);

    noteDiv.appendChild(contentDiv);
    noteDiv.appendChild(metaDiv);

    return noteDiv;
  }

  function editNote(noteId, promptId) {
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteElement) return;

    const contentDiv = noteElement.querySelector('.note-content');
    const originalContent = contentDiv.textContent;

    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'add-note-form';
    editForm.innerHTML = `
      <textarea class="note-textarea" maxlength="500" rows="3">${originalContent}</textarea>
      <div class="note-form-footer">
        <div class="char-counter">${originalContent.length}/500</div>
        <div class="note-form-actions">
          <button class="save-note-btn" type="button">Save</button>
          <button class="cancel-note-btn" type="button">Cancel</button>
        </div>
      </div>
      <div class="note-error" style="display: none;"></div>
    `;

    const textarea = editForm.querySelector('.note-textarea');
    const charCounter = editForm.querySelector('.char-counter');
    const saveBtn = editForm.querySelector('.save-note-btn');
    const cancelBtn = editForm.querySelector('.cancel-note-btn');
    const errorDiv = editForm.querySelector('.note-error');

    // Replace content with edit form
    noteElement.innerHTML = '';
    noteElement.appendChild(editForm);
    textarea.focus();
    textarea.select();

    // Character counter
    textarea.addEventListener('input', () => {
      const length = textarea.value.length;
      charCounter.textContent = `${length}/500`;
      charCounter.classList.remove('warning', 'error');
      if (length > 450) charCounter.classList.add('warning');
      if (length > 500) charCounter.classList.add('error');
      saveBtn.disabled = length < 5 || length > 500;
    });

    // Save changes
    saveBtn.addEventListener('click', () => {
      const newContent = textarea.value.trim();
      if (newContent.length < 5) {
        errorDiv.textContent = 'Note must be at least 5 characters long';
        errorDiv.style.display = 'block';
        return;
      }
      if (newContent.length > 500) {
        errorDiv.textContent = 'Note cannot exceed 500 characters';
        errorDiv.style.display = 'block';
        return;
      }

      updateNoteContent(noteId, promptId, newContent);
      
      // Refresh notes display
      const notesSection = document.querySelector(`[data-prompt-id="${promptId}"]`);
      const notesList = notesSection.querySelector('.notes-list');
      updateNotesDisplay(notesList, getNotesForPrompt(promptId), promptId);
    });

    // Cancel edit
    cancelBtn.addEventListener('click', () => {
      const notesSection = document.querySelector(`[data-prompt-id="${promptId}"]`);
      const notesList = notesSection.querySelector('.notes-list');
      updateNotesDisplay(notesList, getNotesForPrompt(promptId), promptId);
    });
  }

  function updateNoteContent(noteId, promptId, newContent) {
    const prompts = loadPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    
    if (!prompt || !prompt.notes) return;

    const note = prompt.notes.find(n => n.id === noteId);
    if (note) {
      note.content = newContent;
      note.updatedAt = new Date().toISOString();
      savePrompts(prompts);
    }
  }

  function deleteNote(noteId, promptId) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    const prompts = loadPrompts();
    const prompt = prompts.find(p => p.id === promptId);
    
    if (!prompt || !prompt.notes) return;

    prompt.notes = prompt.notes.filter(note => note.id !== noteId);
    savePrompts(prompts);

    // Refresh notes display
    const notesSection = document.querySelector(`[data-prompt-id="${promptId}"]`);
    const notesList = notesSection.querySelector('.notes-list');
    const notesCount = notesSection.querySelector('.notes-count');
    updateNotesDisplay(notesList, getNotesForPrompt(promptId), promptId);
    updateNotesCount(notesCount, getNotesForPrompt(promptId).length);
  }

  function updateNotesCount(countElement, count) {
    countElement.textContent = `(${count})`;
  }

  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    errorEl.textContent = '';

    const title = trim(titleInput.value);
    const content = trim(contentInput.value);

    if (!title) {
      errorEl.textContent = 'Title is required.';
      titleInput.focus();
      return;
    }
    if (!content) {
      errorEl.textContent = 'Content is required.';
      contentInput.focus();
      return;
    }

    const prompts = loadPrompts();
    prompts.unshift({ 
      id: createId(), 
      title, 
      content, 
      createdAt: new Date().toISOString() 
    });
    savePrompts(prompts);
    render(prompts);

    form.reset();
    titleInput.focus();
  }

  function init() {
    form.addEventListener('submit', handleSubmit);
    render(loadPrompts());
  }

  document.addEventListener('DOMContentLoaded', init);
})();

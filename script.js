document.addEventListener('DOMContentLoaded', () => {
    // Configuration constants
    const CONFIG = {
        TOOLTIP_DURATION: 2000,
        ANIMATION_DURATION: 300,
        SEARCH_DEBOUNCE_TIME: 300
    };

    // Utility query selectors
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);

    // Application State Management
    class AppState {
        constructor() {
            this.formData = { 
                agentName: '', 
                customerName: '', 
                intent: '' 
            };
        }

        // Update form data and placeholders
        updateFormData(key, value) {
            this.formData[key] = value;
            this.updatePlaceholders();
        }

        // Reset form data
        resetFormData(preserveAgentName = true) {
            if (preserveAgentName) {
                this.formData.customerName = '';
                this.formData.intent = '';
            } else {
                this.formData = { 
                    agentName: '', 
                    customerName: '', 
                    intent: '' 
                };
            }
            this.updatePlaceholders();
        }

        // Update placeholder texts across the application
        updatePlaceholders() {
            $$('.customer_name').forEach(el => {
                el.textContent = this.formData.customerName || '[Cx name]';
            });
            $$('.agent_name').forEach(el => {
                el.textContent = this.formData.agentName || '[Agent name]';
            });
            $$('.intent').forEach(el => {
                el.textContent = this.formData.intent || '[intent]';
            });
        }
    }

    // UI Management Class
    class UIManager {
        constructor(state) {
            this.state = state;
            this.initEventListeners();
            this.setupTouchSwipeHandling();
        }

        // Initialize all event listeners
        initEventListeners() {
            // Sidebar toggle
            $('#sidebarToggle')?.addEventListener('click', () => this.toggleSidebar());
            $('#closeSidebar')?.addEventListener('click', () => this.toggleSidebar());

            // Form input handling
            $$('.form-input').forEach(input => {
                input.addEventListener('input', e => {
                    this.state.updateFormData(e.target.id, e.target.value);
                });
            });

            // Clear form button
            $('#clearForm')?.addEventListener('click', () => this.clearForm());

            // Navigation buttons
            $$('.nav-btn').forEach(button => {
                button.addEventListener('click', () => this.handleNavigation(button));
            });

            // Search input with debounce
            $('.search-input')?.addEventListener('input', this.debounce(e => {
                const searchTerm = e.target.value.toLowerCase().trim();
                this.performSearch(searchTerm);
            }, CONFIG.SEARCH_DEBOUNCE_TIME));

            // Escape key to close sidebar
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') this.toggleSidebar();
            });
        }

        // Debounce utility function
        debounce(func, delay) {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }

        // Toggle sidebar visibility
        toggleSidebar() {
            const sidebar = $('#sidebar');
            const sidebarToggle = $('#sidebarToggle');
            
            sidebar.classList.toggle('open');
            sidebarToggle.classList.toggle('active');
            
            document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
            sidebarToggle.setAttribute('aria-expanded', sidebar.classList.contains('open'));
        }

        // Clear form and reset manual edits
        clearForm() {
            this.state.resetFormData();
            $$('.form-input').forEach(input => {
                if (input.id !== 'agentName') input.value = '';
            });
        
            // Reset manual edits on all script cards
            $$('.script-card').forEach(card => {
                resetManualEdits(card);
            });
        }
        
        // Handle navigation between sections
        handleNavigation(button) {
            // Remove active state from all buttons
            $$('.nav-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
    
            // Hide all sections
            $$('.interaction-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';

                section.querySelectorAll('.section-headers, .section-scripts, .script-card').forEach(el => {
                    el.style.display = '';
                });
            });
    
            // Show target section
            const sectionId = button.id.replace('-nav', '-section');
            const targetSection = $(`#${sectionId}`);
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
    
            // Perform search if search input is not empty
            const searchInput = $('.search-input');
            if (searchInput && searchInput.value.trim() !== '') {
                this.performSearch(searchInput.value.toLowerCase().trim());
            }
        }

        // Reset section visibility
        resetSectionVisibility(section) {
            section.querySelectorAll('.section-header, .section-scripts, .script-card').forEach(el => {
                el.style.display = '';
            });
        }
        
        // Perform search across sections
        performSearch(searchTerm) {
            const sections = $$('.interaction-section');
            const activeNavBtn = $('.nav-btn.active');
            const activeSectionId = activeNavBtn.id.replace('-nav', '-section');
        
            if (searchTerm === '') {
                // Reset visibility for all sections before showing active one
                sections.forEach(section => {
                    section.querySelectorAll('.section-headers, .section-scripts, .script-card').forEach(el => {
                        el.style.display = '';
                    });
                    section.style.display = section.id === activeSectionId ? 'block' : 'none';
                });
                return;
            }
        
            sections.forEach(section => {
                let sectionHasMatch = this.searchSectionHeaders(section, searchTerm);
                section.style.display = sectionHasMatch ? 'block' : 'none';
            });
        }
        
        // Update the searchSectionHeaders method
        searchSectionHeaders(section, searchTerm) {
            let sectionHasMatch = false;
        
            const headers = section.querySelectorAll('.section-headers');
            headers.forEach(header => {
                // Search within the text of header and its child elements
                const headerText = header.textContent.toLowerCase();
                const headerMatch = headerText.includes(searchTerm);
                
                // Toggle visibility of the header and its scripts
                const scriptContainer = header.nextElementSibling;
                if (scriptContainer && scriptContainer.classList.contains('section-scripts')) {
                    header.style.display = headerMatch ? '' : 'none';
                    scriptContainer.style.display = headerMatch ? '' : 'none';
                }
                
                if (headerMatch) {
                    sectionHasMatch = true;
                }
            });
        
            return sectionHasMatch;
        }
    
        resetSearchView(sections, activeSectionId) {
            sections.forEach(section => {
                if (section.id === activeSectionId) {
                    // Show the active section
                    section.style.display = 'block';
                    
                    // Reset all headers and script containers in the active section
                    section.querySelectorAll('.section-headers, .section-scripts, .section-scripts').forEach(el => {
                        el.style.display = '';
                    });
                } else {
                    // Hide other sections
                    section.style.display = 'none';
                }
            });
        }

        // Setup touch swipe handling for mobile
        setupTouchSwipeHandling() {
            let touchStartX = 0;

            document.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
            });

            document.addEventListener('touchend', e => {
                const touchEndX = e.changedTouches[0].screenX;
                const swipeDistance = touchEndX - touchStartX;
                
                const sidebar = $('#sidebar');
                if (Math.abs(swipeDistance) > 100) {
                    if (swipeDistance > 0 && !sidebar.classList.contains('open')) {
                        sidebar.classList.add('open');
                    } else if (swipeDistance < 0 && sidebar.classList.contains('open')) {
                        sidebar.classList.remove('open');
                    }
                }
            });
        }
    }

    // Enable text editing for manual edit spans
    window.enableTextEdit = function(element) {
        const currentText = element.innerText;
        const defaultText = element.getAttribute('data-default-text');

        if (currentText === defaultText) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = '';
            input.classList.add('edit-input');

            element.innerHTML = '';
            element.appendChild(input);
            input.focus();

            input.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    saveEditedText(element, input);
                }
            });

            input.addEventListener('blur', function() {
                saveEditedText(element, input);
            });
        }
    };

    // Save edited text back to span
    function saveEditedText(element, input) {
        const newText = input.value.trim();
        const defaultText = element.getAttribute('data-default-text');

        element.innerHTML = newText || defaultText;
    }

    // Check if all manual edit spans have been modified
    function checkIfAllEdited(scriptCard) {
        const manualEditSpans = scriptCard.querySelectorAll('.manual-edit');
        
        for (let span of manualEditSpans) {
            const currentText = span.innerText;
            const defaultText = span.getAttribute('data-default-text');
            if (currentText === defaultText) {
                enableTextEdit(span);
                return false;
            }
        }

        return true;
    }

    // Copy text to clipboard
    function copyToClipboard(element) {
        const allEdited = checkIfAllEdited(element);
        if (!allEdited) return;

        const textToCopy = element.innerText || element.textContent;

        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;

        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        tempTextArea.setSelectionRange(0, 99999); 
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);

        showTooltip(element);
    }

    // Show tooltip after copying
    function showTooltip(element) {
        const tooltip = document.getElementById('tooltip');
        const rect = element.getBoundingClientRect();

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        const topPosition = rect.top + window.scrollY - tooltipHeight - 10;
        const leftPosition = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;

        tooltip.style.top = `${Math.max(0, topPosition)}px`;
        tooltip.style.left = `${Math.max(0, leftPosition)}px`;

        tooltip.style.opacity = 1;

        setTimeout(() => {
            tooltip.style.opacity = 0;
        }, CONFIG.TOOLTIP_DURATION);
    }

    // Reset manual edits
    function resetManualEdits(card) {
        const manualEditSpans = card.querySelectorAll('.manual-edit');
        
        manualEditSpans.forEach(function(span) {
            const defaultText = span.getAttribute('data-default-text');
            span.innerHTML = defaultText;
        });
    }

    // Add reset buttons to script cards
    function addResetButtonToScriptCards() {
        document.querySelectorAll('.script-card').forEach(function(card) {
            const manualEditSpans = card.querySelectorAll('.manual-edit');

            if (manualEditSpans.length > 0) {
                const resetButton = document.createElement('button');
                resetButton.innerHTML = '<i class="fas fa-undo"></i>';
                resetButton.classList.add('reset-btn');
                resetButton.type = 'button';

                resetButton.addEventListener('click', function() {
                    resetManualEdits(card);
                });

                card.appendChild(resetButton);
            }
        });
    }

    // Attach copy functionality to script cards
    function attachCopyFunctionality() {
        document.querySelectorAll('.script-card').forEach(function(card) {
            card.addEventListener('click', function(event) {
                if (event.target.classList.contains('manual-edit')) return;
                copyToClipboard(card);
            });
        });
    }

    // Initialize the application
    const appState = new AppState();
    const uiManager = new UIManager(appState);
    
    // Additional initialization
    addResetButtonToScriptCards();
    attachCopyFunctionality();
    appState.updatePlaceholders();
});

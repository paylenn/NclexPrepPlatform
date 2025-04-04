/**
 * Questions functionality for practice pages and NGN examples
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Questions script loaded');
    
    // Initialize NGN examples if on the ngn-types page
    if (window.location.pathname.includes('ngn-types.html')) {
        initializeNGNExamples();
    }
    
    // Initialize practice exam if on the practice page
    if (window.location.pathname.includes('practice.html')) {
        initializePracticeExam();
    }
});

/**
 * Initialize the practice exam functionality
 */
function initializePracticeExam() {
    console.log('Initializing practice exam');
    
    // Check URL parameters for exam type
    const urlParams = new URLSearchParams(window.location.search);
    const examType = urlParams.get('exam');
    
    setupExamQuestions(examType || 'practice');
}

/**
 * Setup the exam questions based on the exam type
 * @param {string} examType - The type of exam to load
 */
function setupExamQuestions(examType) {
    // Load questions from JSON file
    fetch('../data/practice-questions.json')
        .then(response => response.json())
        .then(data => {
            let questions;
            
            // Set questions based on exam type
            switch(examType) {
                case 'exam1':
                    questions = data.exam1;
                    document.getElementById('exam-title').textContent = 'NCLEX-RN Practice Exam 1';
                    break;
                case 'exam2':
                    questions = data.exam2;
                    document.getElementById('exam-title').textContent = 'NCLEX-RN Practice Exam 2';
                    break;
                case 'ngn':
                    questions = data.ngn;
                    document.getElementById('exam-title').textContent = 'Next Generation NCLEX Practice';
                    break;
                default:
                    questions = data.practice;
                    document.getElementById('exam-title').textContent = 'NCLEX Practice Questions';
            }
            
            // Save questions to session storage
            sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
            
            // Update total questions count
            document.getElementById('total-questions').textContent = questions.length;
            
            // Display first question
            displayQuestion(0);
            
            // Setup next/prev buttons
            document.getElementById('next-btn').addEventListener('click', () => {
                const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                if (currentIndex < questions.length - 1) {
                    displayQuestion(currentIndex + 1);
                }
            });
            
            document.getElementById('prev-btn').addEventListener('click', () => {
                const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                if (currentIndex > 0) {
                    displayQuestion(currentIndex - 1);
                }
            });
            
            // Setup show answer button
            document.getElementById('show-answer-btn').addEventListener('click', () => {
                const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                showAnswerRationale(currentIndex);
            });
            
            // Setup finish exam button
            document.getElementById('finish-exam-btn').addEventListener('click', showExamResults);
        })
        .catch(error => console.error('Error loading questions:', error));
}

/**
 * Display a specific question
 * @param {number} index - The index of the question to display
 */
function displayQuestion(index) {
    const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
    const question = questions[index];
    
    // Update current question number
    document.getElementById('current-question').textContent = index + 1;
    
    // Update question content
    document.getElementById('question-stem').innerHTML = question.stem;
    
    // Update options
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = `
            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
            <div class="option-text">${option}</div>
        `;
        
        // Add click handler
        optionElement.addEventListener('click', function() {
            // Remove selected class from all options
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Save answer
            const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
            answers[index] = i;
            sessionStorage.setItem('examAnswers', JSON.stringify(answers));
        });
        
        optionsContainer.appendChild(optionElement);
    });
    
    // Check if there's a saved answer for this question
    const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
    if (answers[index] !== undefined) {
        const options = document.querySelectorAll('.option');
        options[answers[index]].classList.add('selected');
    }
    
    // Hide answer rationale
    document.getElementById('answer-rationale').classList.add('hidden');
    
    // Update prev/next button states
    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').disabled = index === questions.length - 1;
}

/**
 * Show the answer rationale for a question
 * @param {number} index - The index of the question
 */
function showAnswerRationale(index) {
    const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
    const question = questions[index];
    
    const rationaleContainer = document.getElementById('answer-rationale');
    rationaleContainer.innerHTML = `
        <h3>Correct Answer: ${String.fromCharCode(65 + question.correctAnswer)}</h3>
        <div class="rationale-content">${question.rationale}</div>
    `;
    
    rationaleContainer.classList.remove('hidden');
    
    // Highlight correct answer
    const options = document.querySelectorAll('.option');
    options.forEach((option, i) => {
        if (i === question.correctAnswer) {
            option.classList.add('correct');
        } else {
            option.classList.remove('correct');
        }
    });
}

/**
 * Show the exam results
 */
function showExamResults() {
    const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
    const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
    
    // Calculate results
    let correct = 0;
    let answered = 0;
    
    Object.keys(answers).forEach(index => {
        answered++;
        if (answers[index] === questions[index].correctAnswer) {
            correct++;
        }
    });
    
    const score = Math.round((correct / questions.length) * 100);
    
    // Create results markup
    const resultsMarkup = `
        <h2>Exam Results</h2>
        <div class="results-stats">
            <div class="stat-item">
                <div class="stat-value">${answered}/${questions.length}</div>
                <div class="stat-label">Questions Answered</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${correct}</div>
                <div class="stat-label">Correct Answers</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${score}%</div>
                <div class="stat-label">Score</div>
            </div>
        </div>
        <div class="results-message">
            <p>${getResultMessage(score)}</p>
        </div>
        <button id="review-exam-btn" class="btn btn-primary">Review Exam</button>
    `;
    
    // Update content
    document.getElementById('exam-container').innerHTML = resultsMarkup;
    
    // Add event listener to review button
    document.getElementById('review-exam-btn').addEventListener('click', () => {
        location.reload();
    });
}

/**
 * Get a message based on the exam score
 * @param {number} score - The exam score
 * @returns {string} - A message based on the score
 */
function getResultMessage(score) {
    if (score >= 80) {
        return "Excellent! You're well-prepared for the NCLEX exam.";
    } else if (score >= 70) {
        return "Good job! With a bit more practice, you'll be ready for the NCLEX.";
    } else if (score >= 60) {
        return "You're on the right track, but need more practice in the areas you missed.";
    } else {
        return "More study and practice is needed. Focus on understanding the rationales for each question.";
    }
}

/**
 * Initialize interactive examples for NGN question types
 */
function initializeNGNExamples() {
    console.log('Initializing NGN examples');
    setupNGNInteractiveExamples();
}

/**
 * Setup interactive examples for NGN question types
 */
function setupNGNInteractiveExamples() {
    setupDragAndDropExample();
    setupMatrixExample();
    setupClozeExample();
    setupHighlightingExample();
}

/**
 * Setup drag and drop example
 */
function setupDragAndDropExample() {
    console.log('Setting up drag and drop example');
    
    if (typeof jQuery === 'undefined') {
        console.error('jQuery is required for drag and drop functionality');
        return;
    }
    
    try {
        // Make items draggable
        $(".parent li").draggable({
            revert: "invalid",
            helper: "clone",
            cursor: "move"
        });
        
        // Make center box droppable
        $(".action_inner_center .action_box_first").droppable({
            accept: ".parent li",
            hoverClass: "active",
            drop: function(event, ui) {
                // Clone the dropped item
                const droppedItem = $(ui.draggable).clone();
                
                // Remove the UI draggable classes and behavior
                droppedItem.removeClass("ui-draggable ui-draggable-handle");
                
                // Add to droppable area
                $(this).append(droppedItem);
                
                // Hide the original item
                $(ui.draggable).hide();
            }
        });
    } catch (e) {
        console.error('Error setting up drag and drop:', e);
    }
}

/**
 * Setup matrix example
 */
function setupMatrixExample() {
    console.log('Setting up matrix example');
    const matrixCells = document.querySelectorAll('.matrix-cell.selectable');
    
    matrixCells.forEach(cell => {
        cell.addEventListener('click', function() {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                this.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                this.innerHTML = '';
            }
        });
    });
}

/**
 * Setup cloze (dropdown) example
 */
function setupClozeExample() {
    console.log('Setting up cloze example');
    const dropdowns = document.querySelectorAll('.cloze-dropdown');
    
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(event) {
            event.stopPropagation();
            this.classList.toggle('active');
        });
        
        const options = dropdown.querySelectorAll('.cloze-dropdown-option');
        options.forEach(option => {
            option.addEventListener('click', function(event) {
                event.stopPropagation();
                const selectedOption = this.closest('.cloze-dropdown').querySelector('.selected-option');
                selectedOption.textContent = this.textContent;
                this.closest('.cloze-dropdown').classList.remove('active');
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });
}

/**
 * Setup highlighting example
 */
function setupHighlightingExample() {
    console.log('Setting up highlighting example');
    const paragraph = document.querySelector('.highlight-paragraph');
    
    if (paragraph) {
        paragraph.addEventListener('mouseup', function() {
            const selection = window.getSelection();
            
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                if (range.toString().trim() !== '') {
                    const span = document.createElement('span');
                    span.style.backgroundColor = 'yellow';
                    span.className = 'highlighted-text';
                    
                    try {
                        range.surroundContents(span);
                    } catch (e) {
                        console.error('Error highlighting text:', e);
                    }
                    
                    selection.removeAllRanges();
                }
            }
        });
    }
}

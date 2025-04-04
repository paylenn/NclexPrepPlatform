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
    
    // Debug the URL parameter
    console.log('Exam type from URL:', examType);
    
    if (examType) {
        // Show the practice container and hide other sections
        if (document.querySelector('.practice-container')) {
            document.querySelector('.practice-container').style.display = 'block';
        }
        if (document.querySelector('.practice-overview')) {
            document.querySelector('.practice-overview').style.display = 'none';
        }
        if (document.querySelector('.practice-tips')) {
            document.querySelector('.practice-tips').style.display = 'none';
        }
        
        // Setup exam questions
        setupExamQuestions(examType);
    } else if (window.location.pathname.includes('practice.html')) {
        // If on practice page but no specific exam, show selection UI
        if (document.querySelector('.practice-container')) {
            document.querySelector('.practice-container').style.display = 'none';
        }
        if (document.querySelector('.practice-overview')) {
            document.querySelector('.practice-overview').style.display = 'block';
        }
        if (document.querySelector('.practice-tips')) {
            document.querySelector('.practice-tips').style.display = 'block';
        }
    }
}

/**
 * Setup the exam questions based on the exam type
 * @param {string} examType - The type of exam to load
 */
function setupExamQuestions(examType) {
    console.log('Setting up exam questions for type:', examType);
    // Reset any existing answers
    sessionStorage.removeItem('examAnswers');
    
    // Load questions from JSON file - use relative path, starting with a slash
    fetch('../data/practice-questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let questions;
            let examTitle = 'NCLEX Practice Questions';
            
            // Handle the structure from practice-questions.json where exams are keyed by exam type
            if (data[examType] && data[examType].items && Array.isArray(data[examType].items)) {
                questions = data[examType].items;
                examTitle = data[examType].title || examTitle;
                console.log(`Loaded ${questions.length} questions for ${examTitle}`);
            } else if (data.questions && Array.isArray(data.questions)) {
                questions = data.questions;
                console.log(`Loaded ${questions.length} questions from data.questions array`);
            } else if (data.practice && Array.isArray(data.practice)) {
                questions = data.practice;
                console.log(`Loaded ${questions.length} questions from data.practice array`);
            } else {
                console.error('Unexpected data structure:', data);
                throw new Error('Questions data is in an unexpected format');
            }
            
            // Set title based on exam type
            if (document.getElementById('exam-title')) {
                document.getElementById('exam-title').textContent = examTitle;
            }
            
            // Save questions to session storage
            sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
            sessionStorage.setItem('currentExamType', examType);
            
            // Update total questions count if element exists
            if (document.getElementById('total-questions')) {
                document.getElementById('total-questions').textContent = questions.length;
            }
            
            // Display first question
            displayQuestion(0);
            
            // Setup next/prev buttons if they exist
            if (document.getElementById('next-btn')) {
                document.getElementById('next-btn').addEventListener('click', () => {
                    const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                    if (currentIndex < questions.length - 1) {
                        displayQuestion(currentIndex + 1);
                    }
                });
            }
            
            if (document.getElementById('prev-btn')) {
                document.getElementById('prev-btn').addEventListener('click', () => {
                    const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                    if (currentIndex > 0) {
                        displayQuestion(currentIndex - 1);
                    }
                });
            }
            
            // Setup show answer button if it exists
            if (document.getElementById('show-answer-btn')) {
                document.getElementById('show-answer-btn').addEventListener('click', () => {
                    const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                    showAnswerRationale(currentIndex);
                });
            }
            
            // Setup finish exam button if it exists
            if (document.getElementById('finish-exam-btn')) {
                document.getElementById('finish-exam-btn').addEventListener('click', showExamResults);
            }
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            
            // Show a user-friendly error message
            const questionContainer = document.querySelector('.question-container');
            if (questionContainer) {
                questionContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h4>Error Loading Questions</h4>
                        <p>We encountered an error while loading the practice questions. Please try refreshing the page.</p>
                        <p>Error details: ${error.message}</p>
                        <button class="btn btn-primary mt-3" onclick="location.reload()">Refresh Page</button>
                    </div>
                `;
            }
        });
}

/**
 * Display a specific question
 * @param {number} index - The index of the question to display
 */
function displayQuestion(index) {
    try {
        const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
        const examType = sessionStorage.getItem('currentExamType');
        const question = questions[index];
        
        if (!question) {
            throw new Error(`Question at index ${index} not found`);
        }
        
        // Get elements (check if they exist first)
        const currentQuestionEl = document.getElementById('current-question');
        const questionStemEl = document.getElementById('question-stem');
        const optionsContainer = document.getElementById('question-options');
        const rationaleContainer = document.getElementById('answer-rationale');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        // Update current question number if element exists
        if (currentQuestionEl) {
            currentQuestionEl.textContent = index + 1;
        }
        
        // Update question content if element exists
        if (questionStemEl) {
            // Handle different JSON structures - some use stem, others use text
            const questionText = question.stem || question.text;
            questionStemEl.innerHTML = questionText;
        }
        
        // Update options if container exists
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            // Check if options exist in the question object (could be named options or choices)
            const options = question.options || question.choices;
            if (!options || !Array.isArray(options)) {
                optionsContainer.innerHTML = '<div class="alert alert-warning">No answer options available for this question.</div>';
                return;
            }
            
            // Check if this is a Select All That Apply question (NGN format)
            const isMultiSelect = examType === 'exam2' || 
                                 (question.correctAnswer && Array.isArray(question.correctAnswer));
            
            if (isMultiSelect) {
                optionsContainer.innerHTML = '<div class="alert alert-info mb-3">Select all options that apply.</div>';
            }
            
            options.forEach((option, i) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                
                // For multi-select questions, use checkboxes instead of the standard option format
                if (isMultiSelect) {
                    optionElement.innerHTML = `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="option${i}" value="${i}">
                            <label class="form-check-label" for="option${i}">${option}</label>
                        </div>
                    `;
                } else {
                    optionElement.innerHTML = `
                        <div class="option-marker">${String.fromCharCode(65 + i)}</div>
                        <div class="option-text">${option}</div>
                    `;
                }
                
                // Add click handler
                if (isMultiSelect) {
                    const checkbox = optionElement.querySelector(`#option${i}`);
                    checkbox.addEventListener('change', function() {
                        // Save answers for multi-select questions
                        const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
                        if (!answers[index]) {
                            answers[index] = [];
                        }
                        
                        if (this.checked) {
                            if (!answers[index].includes(i)) {
                                answers[index].push(i);
                            }
                        } else {
                            answers[index] = answers[index].filter(val => val !== i);
                        }
                        
                        sessionStorage.setItem('examAnswers', JSON.stringify(answers));
                    });
                } else {
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
                }
                
                optionsContainer.appendChild(optionElement);
            });
            
            // Check if there's a saved answer for this question
            const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
            if (answers[index] !== undefined) {
                if (isMultiSelect && Array.isArray(answers[index])) {
                    // For multi-select questions, check the appropriate checkboxes
                    answers[index].forEach(selectedIndex => {
                        const checkbox = document.getElementById(`option${selectedIndex}`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                } else if (!isMultiSelect) {
                    // For single-select questions, add the selected class
                    const optionElements = optionsContainer.querySelectorAll('.option');
                    if (optionElements.length > answers[index]) {
                        optionElements[answers[index]].classList.add('selected');
                    }
                }
            }
        }
        
        // Hide answer rationale if element exists
        if (rationaleContainer) {
            rationaleContainer.classList.add('hidden');
        }
        
        // Update prev/next button states if they exist
        if (prevBtn) {
            prevBtn.disabled = index === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = index === questions.length - 1;
        }
    } catch (error) {
        console.error('Error displaying question:', error);
        
        // Show a user-friendly error message
        const questionContainer = document.querySelector('.question-container');
        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error Displaying Question</h4>
                    <p>We encountered an error while displaying this question. Please try refreshing the page.</p>
                    <p>Error details: ${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }
}

/**
 * Show the answer rationale for a question
 * @param {number} index - The index of the question
 */
function showAnswerRationale(index) {
    try {
        const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
        const examType = sessionStorage.getItem('currentExamType');
        const question = questions[index];
        
        if (!question) {
            throw new Error(`Question at index ${index} not found`);
        }
        
        const rationaleContainer = document.getElementById('answer-rationale');
        if (!rationaleContainer) {
            console.error('Answer rationale container not found');
            return;
        }
        
        // Handle different JSON structures for correctAnswer and explanations
        const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.correct_answer;
        const rationaleText = question.rationale || question.explanation || "No explanation provided for this question.";
        
        if (correctAnswer === undefined) {
            console.error('Correct answer not found in question data');
            rationaleContainer.innerHTML = `
                <div class="alert alert-warning">
                    <h4>Information Missing</h4>
                    <p>The correct answer information is not available for this question.</p>
                </div>
            `;
            rationaleContainer.classList.remove('hidden');
            return;
        }
        
        let correctAnswerDisplay = '';
        // Check if this is a multi-select question
        const isMultiSelect = examType === 'exam2' || Array.isArray(correctAnswer);
        
        if (isMultiSelect && Array.isArray(correctAnswer)) {
            correctAnswerDisplay = correctAnswer.map(index => String.fromCharCode(65 + index)).join(', ');
        } else {
            correctAnswerDisplay = String.fromCharCode(65 + correctAnswer);
        }
        
        // Create the rationale content
        rationaleContainer.innerHTML = `
            <h3>Correct Answer: ${correctAnswerDisplay}</h3>
            <div class="rationale-content">${rationaleText}</div>
        `;
        
        rationaleContainer.classList.remove('hidden');
        
        // Highlight correct answer if options are available
        if (isMultiSelect && Array.isArray(correctAnswer)) {
            // For multi-select questions, mark correct checkboxes
            correctAnswer.forEach(index => {
                const option = document.getElementById(`option${index}`);
                if (option) {
                    option.parentElement.parentElement.classList.add('correct');
                }
            });
        } else {
            // For single-select questions
            const options = document.querySelectorAll('.option');
            if (options.length > 0) {
                options.forEach((option, i) => {
                    if (i === correctAnswer) {
                        option.classList.add('correct');
                    } else {
                        option.classList.remove('correct');
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error showing answer rationale:', error);
        
        // Display user-friendly error in the rationale container
        const rationaleContainer = document.getElementById('answer-rationale');
        if (rationaleContainer) {
            rationaleContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error</h4>
                    <p>We encountered an error while displaying the answer explanation. Please try refreshing the page.</p>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
            rationaleContainer.classList.remove('hidden');
        }
    }
}

/**
 * Show the exam results
 */
function showExamResults() {
    try {
        const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
        const examType = sessionStorage.getItem('currentExamType');
        const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
        
        // Calculate results
        let correct = 0;
        let answered = 0;
        
        Object.keys(answers).forEach(index => {
            const question = questions[index];
            if (!question) return;
            
            answered++;
            
            // Handle different structures for correct answers (correctAnswer or correct_answer)
            const correctAnswer = question.correctAnswer !== undefined 
                ? question.correctAnswer 
                : question.correct_answer;
            
            // Check if this is a multi-select question
            const isMultiSelect = examType === 'exam2' || Array.isArray(correctAnswer);
            
            if (isMultiSelect && Array.isArray(correctAnswer) && Array.isArray(answers[index])) {
                // For multi-select, all selections must match exactly
                const userAnswer = answers[index].sort();
                const correctAnswerSorted = [...correctAnswer].sort(); // Create a copy before sorting
                
                if (userAnswer.length === correctAnswerSorted.length && 
                    userAnswer.every((val, i) => val === correctAnswerSorted[i])) {
                    correct++;
                }
            } else if (!isMultiSelect && answers[index] === correctAnswer) {
                // For single-select questions
                correct++;
            }
        });
        
        const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
        
        // Create results markup
        const resultsMarkup = `
            <h2>Exam Results</h2>
            <div class="results-stats">
                <div class="stat-item">
                    <div class="stat-value">${answered}/${questions.length}</div>
                    <div class="stat-label">Questions Attempted</div>
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
            <div class="exam-controls">
                <button id="review-exam-btn" class="btn btn-secondary">Review Questions</button>
                <button id="restart-exam-btn" class="btn btn-primary">Take New Exam</button>
            </div>
        `;
        
        // Update content
        const examContainer = document.getElementById('exam-container');
        if (examContainer) {
            examContainer.innerHTML = resultsMarkup;
            
            // Add event listener to review button
            document.getElementById('review-exam-btn').addEventListener('click', () => {
                // Reload the current exam
                setupExamQuestions(examType);
            });
            
            // Add event listener to restart button
            document.getElementById('restart-exam-btn').addEventListener('click', () => {
                // Go back to the practice overview page
                window.location.href = 'practice.html';
            });
        }
    } catch (error) {
        console.error('Error showing exam results:', error);
        
        // Show error message
        const examContainer = document.getElementById('exam-container');
        if (examContainer) {
            examContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error Calculating Results</h4>
                    <p>We encountered an error while calculating your results. Please try refreshing the page.</p>
                    <p>Error details: ${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }
}

/**
 * Get a message based on the exam score
 * @param {number} score - The exam score
 * @returns {string} - A message based on the score
 */
function getResultMessage(score) {
    if (score >= 80) {
        return "Excellent! You're well-prepared for the NCLEX exam. Your strong performance shows a solid understanding of nursing concepts and clinical judgment.";
    } else if (score >= 70) {
        return "Good job! With a bit more focused practice, you'll be ready for the NCLEX. Review the questions you missed to strengthen those knowledge areas.";
    } else if (score >= 60) {
        return "You're on the right track, but need more practice in the areas you missed. Focus on understanding the rationales for each question to improve your clinical reasoning.";
    } else {
        return "More study and practice is needed. Don't get discouraged! Focus on understanding the rationales for each question and review the fundamental nursing concepts in your weaker areas.";
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
    const dragItems = document.querySelectorAll('.drag-item');
    const dropZones = document.querySelectorAll('.drop-zone');
    
    if (dragItems.length === 0 || dropZones.length === 0) {
        return; // Elements not found, likely not on NGN examples page
    }
    
    // Initialize drag items
    dragItems.forEach(item => {
        item.setAttribute('draggable', 'true');
        
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.id);
            this.classList.add('dragging');
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    
    // Initialize drop zones
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const itemId = e.dataTransfer.getData('text/plain');
            const draggedItem = document.getElementById(itemId);
            
            // Check if already has an item
            if (this.querySelector('.drag-item')) {
                return; // Already has an item
            }
            
            // Remove from previous parent
            if (draggedItem.parentNode.classList.contains('drop-zone')) {
                draggedItem.parentNode.removeChild(draggedItem);
            }
            
            // Add to new drop zone
            this.appendChild(draggedItem);
        });
    });
    
    // Reset button
    const resetButton = document.getElementById('reset-drag-drop');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            const dragContainer = document.querySelector('.drag-container');
            if (!dragContainer) return;
            
            // Move all items back to the drag container
            dragItems.forEach(item => {
                if (item.parentNode.classList.contains('drop-zone')) {
                    item.parentNode.removeChild(item);
                    dragContainer.appendChild(item);
                }
            });
        });
    }
}

/**
 * Setup matrix example
 */
function setupMatrixExample() {
    const matrixCells = document.querySelectorAll('.matrix-cell');
    
    if (matrixCells.length === 0) {
        return; // Elements not found, likely not on NGN examples page
    }
    
    matrixCells.forEach(cell => {
        cell.addEventListener('click', function() {
            // Toggle selection
            this.classList.toggle('selected');
        });
    });
    
    // Reset button
    const resetButton = document.getElementById('reset-matrix');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            matrixCells.forEach(cell => {
                cell.classList.remove('selected');
            });
        });
    }
}

/**
 * Setup cloze (dropdown) example
 */
function setupClozeExample() {
    const clozeDropdowns = document.querySelectorAll('.cloze-dropdown');
    
    if (clozeDropdowns.length === 0) {
        return; // Elements not found, likely not on NGN examples page
    }
    
    // Reset button
    const resetButton = document.getElementById('reset-cloze');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            clozeDropdowns.forEach(dropdown => {
                dropdown.selectedIndex = 0;
            });
        });
    }
}

/**
 * Setup highlighting example
 */
function setupHighlightingExample() {
    const highlightText = document.querySelector('.highlight-text');
    const highlightButton = document.getElementById('highlight-button');
    
    if (!highlightText || !highlightButton) {
        return; // Elements not found, likely not on NGN examples page
    }
    
    let isHighlighting = false;
    
    highlightButton.addEventListener('click', function() {
        isHighlighting = !isHighlighting;
        
        if (isHighlighting) {
            this.textContent = 'Cancel Highlighting';
            this.classList.add('active');
            highlightText.classList.add('highlighting-active');
        } else {
            this.textContent = 'Start Highlighting';
            this.classList.remove('active');
            highlightText.classList.remove('highlighting-active');
        }
    });
    
    // Make text spans highlightable
    const textSpans = highlightText.querySelectorAll('span');
    textSpans.forEach(span => {
        span.addEventListener('click', function() {
            if (isHighlighting) {
                this.classList.toggle('highlighted');
            }
        });
    });
    
    // Reset button
    const resetButton = document.getElementById('reset-highlighting');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            textSpans.forEach(span => {
                span.classList.remove('highlighted');
            });
            
            // Also reset the highlighting mode
            isHighlighting = false;
            highlightButton.textContent = 'Start Highlighting';
            highlightButton.classList.remove('active');
            highlightText.classList.remove('highlighting-active');
        });
    }
}

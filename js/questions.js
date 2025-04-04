/**
 * Questions functionality for practice pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize practice exam functionality if on practice page
    if (document.querySelector('.practice-container')) {
        initializePracticeExam();
    }
    
    // Initialize NGN interactive examples if on NGN types page
    if (document.querySelector('.ngn-types-container')) {
        initializeNGNExamples();
    }
});

/**
 * Initialize the practice exam functionality
 */
function initializePracticeExam() {
    // Load questions from data file
    fetch('/data/practice-questions.json')
        .then(response => response.json())
        .then(data => {
            // Store questions globally
            window.practiceQuestions = data;
            
            // Get URL parameters to see if we're loading a specific exam
            const urlParams = new URLSearchParams(window.location.search);
            const examType = urlParams.get('exam') || 'exam1';
            
            // Setup the question interface
            setupExamQuestions(examType);
        })
        .catch(error => {
            console.error('Error loading practice questions:', error);
            document.querySelector('.practice-container').innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Questions</h3>
                    <p>Sorry, we couldn't load the practice questions. Please try again later.</p>
                </div>
            `;
        });
}

/**
 * Setup the exam questions based on the exam type
 * @param {string} examType - The type of exam to load
 */
function setupExamQuestions(examType) {
    const questions = window.practiceQuestions[examType] || [];
    
    if (questions.length === 0) {
        document.querySelector('.practice-container').innerHTML = `
            <div class="error-message">
                <h3>No Questions Found</h3>
                <p>Sorry, we couldn't find any questions for this exam.</p>
                <a href="/pages/practice.html" class="btn btn-primary">Return to Practice Home</a>
            </div>
        `;
        return;
    }
    
    // Set up exam header
    const examHeader = document.querySelector('.exam-header');
    if (examHeader) {
        examHeader.innerHTML = `
            <h2>${questions.title || 'Practice Exam'}</h2>
            <p>${questions.description || 'Test your NCLEX knowledge with these practice questions.'}</p>
        `;
    }
    
    // Get question container
    const questionContainer = document.querySelector('.questions-container');
    if (!questionContainer) return;
    
    // Clear existing content
    questionContainer.innerHTML = '';
    
    // Initialize exam state
    window.examState = {
        currentQuestionIndex: 0,
        answers: new Array(questions.items.length).fill(null),
        questionsReviewed: new Array(questions.items.length).fill(false),
        examCompleted: false
    };
    
    // Display first question
    displayQuestion(0);
    
    // Setup navigation buttons
    const prevButton = document.querySelector('.prev-question');
    const nextButton = document.querySelector('.next-question');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (window.examState.currentQuestionIndex > 0) {
                displayQuestion(window.examState.currentQuestionIndex - 1);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (window.examState.currentQuestionIndex < questions.items.length - 1) {
                displayQuestion(window.examState.currentQuestionIndex + 1);
            } else if (!window.examState.examCompleted) {
                // If on last question, show finish exam button
                nextButton.textContent = 'Finish Exam';
                nextButton.classList.add('finish-exam');
                
                // On next click, show results
                nextButton.addEventListener('click', showExamResults, { once: true });
                window.examState.examCompleted = true;
            }
        });
    }
    
    // Setup answer review functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('show-answer')) {
            const questionIndex = parseInt(e.target.dataset.index);
            showAnswerRationale(questionIndex);
        }
    });
}

/**
 * Display a specific question
 * @param {number} index - The index of the question to display
 */
function displayQuestion(index) {
    if (!window.practiceQuestions) return;
    
    const examType = new URLSearchParams(window.location.search).get('exam') || 'exam1';
    const questions = window.practiceQuestions[examType].items;
    
    if (index < 0 || index >= questions.length) return;
    
    // Update current question index
    window.examState.currentQuestionIndex = index;
    
    // Get question data
    const question = questions[index];
    
    // Get question container
    const questionContainer = document.querySelector('.questions-container');
    if (!questionContainer) return;
    
    // Create question HTML
    let questionHTML = `
        <div class="question-container" data-index="${index}">
            <div class="question-header">
                <div class="question-number">Question ${index + 1} of ${questions.length}</div>
                <div class="question-category">${question.category || 'Nursing Knowledge'}</div>
            </div>
            <div class="question-text">${question.text}</div>
            <div class="answer-choices">
    `;
    
    // Add answer choices
    question.choices.forEach((choice, choiceIndex) => {
        const isSelected = window.examState.answers[index] === choiceIndex;
        questionHTML += `
            <div class="answer-choice ${isSelected ? 'selected' : ''}">
                <label>
                    <input type="radio" name="q${index}" value="${choiceIndex}" ${isSelected ? 'checked' : ''}>
                    ${choice}
                </label>
            </div>
        `;
    });
    
    questionHTML += `
            </div>
            <div class="question-actions">
                <button class="btn btn-secondary show-answer" data-index="${index}">
                    ${window.examState.questionsReviewed[index] ? 'Review Answer Again' : 'Show Answer'}
                </button>
                <div class="navigation-buttons">
                    ${index > 0 ? '<button class="btn btn-secondary prev-question">Previous</button>' : ''}
                    ${index < questions.length - 1 ? '<button class="btn btn-primary next-question">Next</button>' : (window.examState.examCompleted ? '<button class="btn btn-primary finish-exam">Finish Exam</button>' : '<button class="btn btn-primary next-question">Next</button>')}
                </div>
            </div>
            <div class="rationale" id="rationale-${index}"></div>
        </div>
    `;
    
    // Update the container
    questionContainer.innerHTML = questionHTML;
    
    // Add event listeners to radio buttons
    document.querySelectorAll(`input[name="q${index}"]`).forEach(radio => {
        radio.addEventListener('change', function() {
            window.examState.answers[index] = parseInt(this.value);
            
            // Remove selected class from all choices
            document.querySelectorAll('.answer-choice').forEach(choice => {
                choice.classList.remove('selected');
            });
            
            // Add selected class to this choice
            this.closest('.answer-choice').classList.add('selected');
        });
    });
}

/**
 * Show the answer rationale for a question
 * @param {number} index - The index of the question
 */
function showAnswerRationale(index) {
    if (!window.practiceQuestions) return;
    
    const examType = new URLSearchParams(window.location.search).get('exam') || 'exam1';
    const questions = window.practiceQuestions[examType].items;
    
    if (index < 0 || index >= questions.length) return;
    
    // Get question data
    const question = questions[index];
    
    // Get rationale container
    const rationaleContainer = document.getElementById(`rationale-${index}`);
    if (!rationaleContainer) return;
    
    // Mark question as reviewed
    window.examState.questionsReviewed[index] = true;
    
    // Get user's answer
    const userAnswer = window.examState.answers[index];
    
    // Determine if answer is correct
    const isCorrect = userAnswer === question.correctAnswer;
    
    // Update answer choices to show correct/incorrect
    document.querySelectorAll(`.answer-choice`).forEach((choice, choiceIndex) => {
        if (choiceIndex === question.correctAnswer) {
            choice.classList.add('correct');
        } else if (choiceIndex === userAnswer) {
            choice.classList.add('incorrect');
        }
    });
    
    // Create rationale HTML
    let rationaleHTML = `
        <h4>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</h4>
        <p><strong>Correct Answer:</strong> ${question.choices[question.correctAnswer]}</p>
        <div class="rationale-text">
            <p><strong>Rationale:</strong> ${question.rationale}</p>
        </div>
    `;
    
    // Update the container and show it
    rationaleContainer.innerHTML = rationaleHTML;
    rationaleContainer.classList.add('show');
    
    // Update show answer button text
    const showAnswerButton = document.querySelector(`.show-answer[data-index="${index}"]`);
    if (showAnswerButton) {
        showAnswerButton.textContent = 'Review Answer Again';
    }
}

/**
 * Show the exam results
 */
function showExamResults() {
    if (!window.practiceQuestions || !window.examState) return;
    
    const examType = new URLSearchParams(window.location.search).get('exam') || 'exam1';
    const questions = window.practiceQuestions[examType].items;
    
    // Calculate score
    let correctAnswers = 0;
    window.examState.answers.forEach((answer, index) => {
        if (answer === questions[index].correctAnswer) {
            correctAnswers++;
        }
    });
    
    const percentageScore = Math.round((correctAnswers / questions.length) * 100);
    
    // Get container
    const practiceContainer = document.querySelector('.practice-container');
    if (!practiceContainer) return;
    
    // Create results HTML
    let resultsHTML = `
        <div class="results-container">
            <h2>Exam Results</h2>
            <div class="score-container">
                <div class="score-circle">
                    <span class="score-percent">${percentageScore}%</span>
                </div>
                <div class="score-details">
                    <p>You answered <strong>${correctAnswers}</strong> out of <strong>${questions.length}</strong> questions correctly.</p>
                </div>
            </div>
            <div class="results-summary">
                <h3>Question Summary</h3>
                <div class="question-summary-grid">
    `;
    
    // Add summary of each question
    questions.forEach((question, index) => {
        const userAnswer = window.examState.answers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        resultsHTML += `
            <div class="question-summary-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-number">${index + 1}</div>
                <div class="question-result">${isCorrect ? 'Correct' : 'Incorrect'}</div>
            </div>
        `;
    });
    
    resultsHTML += `
                </div>
            </div>
            <div class="results-actions">
                <a href="/pages/practice.html" class="btn btn-secondary">Return to Practice Home</a>
                <a href="/pages/practice.html?exam=${examType}&retry=true" class="btn btn-primary">Retry This Exam</a>
            </div>
        </div>
    `;
    
    // Update the container
    practiceContainer.innerHTML = resultsHTML;
}

/**
 * Initialize interactive examples for NGN question types
 */
function initializeNGNExamples() {
    // Load NGN info from data file
    fetch('/data/ngn-info.json')
        .then(response => response.json())
        .then(data => {
            // Store NGN info globally
            window.ngnInfo = data;
            
            // Setup the interactive examples
            setupNGNInteractiveExamples();
        })
        .catch(error => {
            console.error('Error loading NGN information:', error);
        });
}

/**
 * Setup interactive examples for NGN question types
 */
function setupNGNInteractiveExamples() {
    // Setup drag and drop example
    setupDragAndDropExample();
    
    // Setup matrix/grid example
    setupMatrixExample();
    
    // Setup cloze (dropdown) example
    setupClozeExample();
    
    // Setup highlighting example
    setupHighlightingExample();
}

/**
 * Setup drag and drop example
 */
function setupDragAndDropExample() {
    const dragDropContainer = document.querySelector('.drag-drop-example');
    if (!dragDropContainer) return;
    
    // Implementation would go here
    // This would require more complex drag and drop functionality
    // For now, we just show a static example
}

/**
 * Setup matrix example
 */
function setupMatrixExample() {
    const matrixContainer = document.querySelector('.matrix-example');
    if (!matrixContainer) return;
    
    // Add click event to selectable cells
    const selectableCells = matrixContainer.querySelectorAll('.selectable');
    
    selectableCells.forEach(cell => {
        cell.addEventListener('click', function() {
            // Toggle selection
            this.classList.toggle('selected');
            
            // Check if we're enforcing a "select one per row" rule
            const isSelectOne = matrixContainer.classList.contains('select-one-per-row');
            
            if (isSelectOne) {
                // Get all cells in this row
                const row = this.closest('tr');
                const rowCells = row.querySelectorAll('.selectable');
                
                // Deselect other cells in this row
                rowCells.forEach(otherCell => {
                    if (otherCell !== this) {
                        otherCell.classList.remove('selected');
                    }
                });
            }
        });
    });
}

/**
 * Setup cloze (dropdown) example
 */
function setupClozeExample() {
    const clozeContainer = document.querySelector('.cloze-example');
    if (!clozeContainer) return;
    
    // Add change event to dropdown selects
    const dropdowns = clozeContainer.querySelectorAll('select');
    
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            // You could add validation or feedback here
        });
    });
}

/**
 * Setup highlighting example
 */
function setupHighlightingExample() {
    const highlightContainer = document.querySelector('.highlight-example');
    if (!highlightContainer) return;
    
    // Add click event to highlightable elements
    const highlightableElements = highlightContainer.querySelectorAll('.highlightable');
    
    highlightableElements.forEach(element => {
        element.addEventListener('click', function() {
            // Toggle highlight
            this.classList.toggle('highlighted');
        });
    });
}
